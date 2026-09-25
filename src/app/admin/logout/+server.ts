import { redirect } from '@sveltejs/kit';
import { SESSION_COOKIE_NAME } from '../../../libs/auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
  cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
  redirect(303, '/admin/login');
};
