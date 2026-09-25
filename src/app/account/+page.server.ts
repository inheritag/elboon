import { fail, redirect } from '@sveltejs/kit';
import { clearCustomerCookie, customerFromCookies } from '../../libs/customer';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
  const customer = await customerFromCookies(cookies);
  if (!customer) redirect(303, '/account/login?redirectTo=/account');
  return { profile: customer };
};

export const actions: Actions = {
  logout: async ({ cookies }) => {
    clearCustomerCookie(cookies);
    redirect(303, '/');
  },

  default: async () => {
    return fail(400);
  }
};
