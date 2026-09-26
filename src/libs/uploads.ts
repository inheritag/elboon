import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { config } from './config';

const UPLOAD_DIR = resolve('.data/uploads');

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};

export function uploadsDir(): string {
  return UPLOAD_DIR;
}

export async function saveProductImage(file: File): Promise<string> {
  const ext = EXTENSIONS[file.type];
  if (!ext) {
    throw new Error('Images must be JPG, PNG, or WebP');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Images must be under 5MB');
  }

  const name = `${randomUUID()}${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await persistImage(name, file.type, bytes);
  return `/uploads/${name}`;
}

export async function saveProductImages(form: FormData, field = 'images'): Promise<string[]> {
  const files = form.getAll(field).filter((entry): entry is File => entry instanceof File && entry.size > 0);
  const urls: string[] = [];
  for (const file of files) {
    urls.push(await saveProductImage(file));
  }
  return urls;
}

export function keptImageUrls(form: FormData): string[] {
  return form
    .getAll('keep')
    .filter((value): value is string => typeof value === 'string')
    .filter((value) => value.startsWith('/products/') || value.startsWith('/uploads/'));
}

export async function readProductImage(
  name: string
): Promise<{ mime: string; bytes: Uint8Array } | null> {
  const diskPath = resolve(UPLOAD_DIR, name);
  if (existsSync(diskPath)) {
    const ext = name.slice(name.lastIndexOf('.')).toLowerCase();
    const mime =
      ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : null;
    if (!mime) return null;
    return { mime, bytes: readFileSync(diskPath) };
  }

  if (config.isDevMode()) return null;

  const { getDb, readyDb } = await import('./db');
  const sql = await readyDb();
  const rows = await sql<{ mime: string; bytes: Uint8Array }[]>`
    SELECT mime, bytes FROM product_images WHERE id = ${name} LIMIT 1
  `;
  const row = rows[0];
  return row ? { mime: row.mime, bytes: row.bytes } : null;
}

async function persistImage(name: string, mime: string, bytes: Buffer): Promise<void> {
  if (config.isDevMode()) {
    try {
      mkdirSync(UPLOAD_DIR, { recursive: true });
      writeFileSync(resolve(UPLOAD_DIR, name), bytes);
      return;
    } catch {
      // Local disk is the default; production has no writable app directory.
    }
  }

  const { getDb, readyDb } = await import('./db');
  const sql = await readyDb();
  await sql`
    INSERT INTO product_images (id, mime, bytes)
    VALUES (${name}, ${mime}, ${bytes})
  `;
}
