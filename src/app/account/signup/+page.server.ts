import { fail, redirect } from '@sveltejs/kit';
import { hashPassword, safeInternalPath } from '../../../libs/auth';
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
  default: async ({ request, cookies }) => {
    const form = await request.formData();
    const email = String(form.get('email') ?? '').trim();
    const password = String(form.get('password') ?? '');
    const fullName = String(form.get('fullName') ?? '').trim();
    const redirectTo = safeInternalPath(String(form.get('redirectTo') || ''), '/account');

    if (!email.includes('@') || password.length < 8) {
      return fail(400, { error: 'Use a valid email and a password of at least 8 characters', email, fullName });
    }

    const store = getStore();
    if (await store.getCustomerByEmail(email)) {
      return fail(400, { error: 'An account with that email already exists. Sign in instead.', email, fullName });
    }

    const customer = await store.createCustomer({
      email,
      passwordHash: hashPassword(password),
      fullName
    });
    await store.attachOffersToUser(email, customer.id);
    setCustomerCookie(cookies, customer.id);
    redirect(303, redirectTo);
  }
};
