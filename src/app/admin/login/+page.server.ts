import { fail, redirect } from '@sveltejs/kit';
import { cookieSettings, createSessionToken, SESSION_COOKIE_NAME, verifyPassword } from '../../../libs/auth';
import { config } from '../../../libs/config';
import { DEV_ADMIN_PASSWORD } from '../../../libs/dev-defaults';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  return {
    devMode: config.isDevMode(),
    devPassword: config.isDevMode() ? DEV_ADMIN_PASSWORD : null
  };
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const formData = await request.formData();
    const password = formData.get('password');

    if (typeof password !== 'string' || !verifyPassword(password, config.adminPasswordHash())) {
      return fail(401, { error: 'Incorrect password' });
    }

    cookies.set(SESSION_COOKIE_NAME, createSessionToken(), cookieSettings());

    redirect(303, '/admin');
  }
};
