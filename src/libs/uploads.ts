import { mkdirSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';

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

  mkdirSync(UPLOAD_DIR, { recursive: true });
  const name = `${randomUUID()}${ext}`;
  writeFileSync(resolve(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
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
