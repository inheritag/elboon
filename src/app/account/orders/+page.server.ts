import { redirect } from '@sveltejs/kit';
import { ordersForShopper } from '../../../domain/order';
import { customerFromCookies } from '../../../libs/customer';
import { getStore } from '../../../libs/store';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
  const customer = await customerFromCookies(cookies);
  if (!customer) redirect(303, '/?auth=login&redirectTo=/account/orders');
  const orders = await getStore().listOrders();
  return { orders: ordersForShopper(customer.email, orders) };
};
