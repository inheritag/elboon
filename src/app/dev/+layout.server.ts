import { error } from '@sveltejs/kit';
import { config } from '../../libs/config';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
  if (!config.isDevMode()) {
    error(404, 'Not found');
  }
  return {};
};
