import { error } from '@sveltejs/kit';
import { basename } from 'node:path';
import { readProductImage } from '../../../libs/uploads';
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
  if (!TYPES[ext]) error(404);

  const image = await readProductImage(name);
  if (!image) error(404);

  return new Response(Buffer.from(image.bytes), {
    headers: { 'content-type': image.mime, 'cache-control': 'public, max-age=31536000' }
  });
};
