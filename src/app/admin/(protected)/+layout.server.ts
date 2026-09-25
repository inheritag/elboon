import { redirect } from '@sveltejs/kit';
import { isValidSessionToken, SESSION_COOKIE_NAME } from '../../../libs/auth';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
  const token = cookies.get(SESSION_COOKIE_NAME);
  if (!isValidSessionToken(token)) {
    redirect(303, '/admin/login');
  }
};
