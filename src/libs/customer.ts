import type { Cookies } from '@sveltejs/kit';
import {
  cookieSettings,
  createCustomerSessionToken,
  CUSTOMER_COOKIE_NAME,
  readCustomerSessionUserId
} from './auth';
import { getStore, type CustomerPublic } from './store';

export async function customerFromCookies(cookies: Cookies): Promise<CustomerPublic | null> {
  const userId = readCustomerSessionUserId(cookies.get(CUSTOMER_COOKIE_NAME));
  if (!userId) return null;
  return getStore().getCustomer(userId);
}

export function setCustomerCookie(cookies: Cookies, userId: string): void {
  cookies.set(CUSTOMER_COOKIE_NAME, createCustomerSessionToken(userId), cookieSettings());
}

export function clearCustomerCookie(cookies: Cookies): void {
  cookies.delete(CUSTOMER_COOKIE_NAME, { path: '/' });
}
