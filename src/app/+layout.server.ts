import { isValidSessionToken, SESSION_COOKIE_NAME } from '../libs/auth';
import { config } from '../libs/config';
import { customerFromCookies } from '../libs/customer';
import { getStore } from '../libs/store';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
  const store = getStore();
  const [customer, categories, categoryMetrics] = await Promise.all([
    customerFromCookies(cookies),
    store.listCategories(),
    store.listCategoryMetrics()
  ]);
  return {
    devMode: config.isDevMode(),
    devStore: config.isDevMode() ? config.devStore() : null,
    customer: customer ? { id: customer.id, email: customer.email, fullName: customer.fullName } : null,
    admin: isValidSessionToken(cookies.get(SESSION_COOKIE_NAME)),
    categories,
    categoryMetrics
  };
};
