import { error } from '@sveltejs/kit';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { uploadsDir } from '../../../libs/uploads';
import type { RequestHandler } from './$types';

const TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp'
};

export const GET: RequestHandler = async ({ params }) => {
  const name = basename(params.name);
  const ext = name.slice(name.lastIndexOf('.')).toLowerCase();
  const type = TYPES[ext];
  if (!type) error(404);

  const filePath = resolve(uploadsDir(), name);
  if (!existsSync(filePath)) error(404);

  return new Response(readFileSync(filePath), {
    headers: { 'content-type': type, 'cache-control': 'public, max-age=31536000' }
  });
};
