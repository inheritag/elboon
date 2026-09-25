import { fail, redirect } from '@sveltejs/kit';
import { safeInternalPath, verifyPassword } from '../../../libs/auth';
import { customerFromCookies, setCustomerCookie } from '../../../libs/customer';
import { getStore } from '../../../libs/store';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, url }) => {
  const redirectTo = safeInternalPath(url.searchParams.get('redirectTo'), '/account');
  if (await customerFromCookies(cookies)) {
    redirect(303, redirectTo);
  }
  return { redirectTo, email: url.searchParams.get('email') ?? '' };
};

export const actions: Actions = {
  default: async ({ request, cookies, url }) => {
    const form = await request.formData();
    const email = String(form.get('email') ?? '').trim();
    const password = String(form.get('password') ?? '');
    const redirectTo = safeInternalPath(
      String(form.get('redirectTo') || url.searchParams.get('redirectTo') || ''),
      '/account'
    );

    if (!email.includes('@') || !password) {
      return fail(400, { error: 'Email and password are required', email });
    }

    const customer = await getStore().getCustomerByEmail(email);
    if (!customer || !verifyPassword(password, customer.passwordHash)) {
      return fail(401, { error: 'Incorrect email or password', email });
    }

    setCustomerCookie(cookies, customer.id);
    redirect(303, redirectTo);
  }
};
