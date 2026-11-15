import { basename } from 'node:path';
import { closeSync, existsSync, fstatSync, openSync, readSync } from 'node:fs';
import { resolve } from 'node:path';
import { imageSize, type ImageSize } from '../domain/image-size';
import { config } from './config';

const HEADER_BYTES = 131072;
const cache = new Map<string, ImageSize | null>();

/** Pixel size for shop photos. Upload names are measured once and remembered. */
export async function measureImages(urls: string[]): Promise<Map<string, ImageSize>> {
  const pending = [...new Set(urls)].filter((url) => !cache.has(url));
  const uploads = pending.filter((url) => uploadName(url));
  if (!config.isDevMode() && uploads.length > 0) await rememberStoredSizes(uploads);

  await Promise.all(
    pending.map(async (url) => {
      if (cache.has(url)) return;
      cache.set(url, await measureOne(url));
    })
  );

  const sizes = new Map<string, ImageSize>();
  for (const url of urls) {
    const size = cache.get(url);
    if (size) sizes.set(url, size);
  }
  return sizes;
}

async function measureOne(url: string): Promise<ImageSize | null> {
  const productFile = staticProductPath(url);
  if (productFile) return imageSize(readPrefix(productFile, HEADER_BYTES) ?? new Uint8Array());

  const name = uploadName(url);
  if (!name) return null;
  const head = await readUploadBytes(name, HEADER_BYTES);
  const fromHead = head ? imageSize(head) : null;
  if (fromHead) {
    await storeSize(name, fromHead);
    return fromHead;
  }
  const full = await readUploadBytes(name);
  const fromFull = full ? imageSize(full) : null;
  if (fromFull) await storeSize(name, fromFull);
  return fromFull;
}

function staticProductPath(url: string): string | null {
  if (!url.startsWith('/products/')) return null;
  const name = basename(url);
  if (name !== url.slice('/products/'.length) || !/^[\w.-]+$/.test(name)) return null;
  const path = resolve('static/products', name);
  return existsSync(path) ? path : null;
}

function uploadName(url: string): string | null {
  if (!url.startsWith('/uploads/')) return null;
  const name = basename(url);
  if (name !== url.slice('/uploads/'.length) || !/^[\w.-]+$/.test(name)) return null;
  return name;
}

function readPrefix(path: string, maxBytes: number): Uint8Array | null {
  if (!existsSync(path)) return null;
  const fd = openSync(path, 'r');
  try {
    const length = Math.min(fstatSync(fd).size, maxBytes);
    const bytes = Buffer.alloc(length);
    readSync(fd, bytes, 0, length, 0);
    return bytes;
  } finally {
    closeSync(fd);
  }
}

async function readUploadBytes(name: string, maxBytes?: number): Promise<Uint8Array | null> {
  const diskPath = resolve('.data/uploads', name);
  if (existsSync(diskPath)) {
    return maxBytes ? readPrefix(diskPath, maxBytes) : readPrefix(diskPath, Number.MAX_SAFE_INTEGER);
  }
  if (config.isDevMode()) return null;

  const { readyDb } = await import('./db');
  const sql = await readyDb();
  const rows = maxBytes
    ? await sql<{ bytes: Uint8Array }[]>`
        SELECT substring(bytes from 1 for ${maxBytes}) AS bytes
        FROM product_images WHERE id = ${name} LIMIT 1
      `
    : await sql<{ bytes: Uint8Array }[]>`
        SELECT bytes FROM product_images WHERE id = ${name} LIMIT 1
      `;
  return rows[0]?.bytes ?? null;
}

async function rememberStoredSizes(urls: string[]): Promise<void> {
  const names = urls.map(uploadName).filter((name): name is string => Boolean(name));
  if (names.length === 0) return;
  try {
    const { readyDb } = await import('./db');
    const sql = await readyDb();
    const rows = await sql<{ id: string; width: number | null; height: number | null }[]>`
      SELECT id, width, height FROM product_images WHERE id IN ${sql(names)}
    `;
    for (const row of rows) {
      if (row.width && row.height) cache.set(`/uploads/${row.id}`, { width: row.width, height: row.height });
    }
  } catch (err) {
    console.error('Could not read stored image sizes', err);
  }
}

async function storeSize(name: string, size: ImageSize): Promise<void> {
  if (config.isDevMode()) return;
  try {
    const { readyDb } = await import('./db');
    const sql = await readyDb();
    await sql`
      UPDATE product_images
      SET width = ${size.width}, height = ${size.height}
      WHERE id = ${name} AND width IS NULL
    `;
  } catch (err) {
    console.error('Could not store image size', err);
  }
}
