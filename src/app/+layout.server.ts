import { config } from '../libs/config';
import { customerFromCookies } from '../libs/customer';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
  const customer = await customerFromCookies(cookies);
  return {
    devMode: config.isDevMode(),
    devStore: config.isDevMode() ? config.devStore() : null,
    customer: customer ? { id: customer.id, email: customer.email, fullName: customer.fullName } : null
  };
};
