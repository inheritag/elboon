import { customerFromCookies } from '../../libs/customer';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
  const customer = await customerFromCookies(cookies);
  return {
    shipping: customer?.shippingAddress ?? null,
    email: customer?.email ?? '',
    signedIn: Boolean(customer)
  };
};
