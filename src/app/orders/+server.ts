import { json } from '@sveltejs/kit';
import { calculateOrderTotal, isCompleteShipping, type ShippingAddress } from '../../domain/order';
import { priceItemsFromCatalog } from '../../libs/catalog-price';
import { customerFromCookies } from '../../libs/customer';
import { getStore } from '../../libs/store';
import type { RequestHandler } from './$types';

interface CreateOrderBody {
  customerEmail?: string;
  shippingAddress: ShippingAddress;
  items: { productId: string; quantity: number; color?: string | null; size?: string | null }[];
}

export const POST: RequestHandler = async ({ request, cookies }) => {
  const body = (await request.json()) as CreateOrderBody;
  const customer = await customerFromCookies(cookies);
  const email = customer?.email ?? body.customerEmail;

  if (!email || !email.includes('@') || !isCompleteShipping(body.shippingAddress) || !body.items?.length) {
    return json({ error: 'Shipping details are required' }, { status: 400 });
  }

  const items = await priceItemsFromCatalog(body.items);
  if (items === null) {
    return json({ error: 'One or more items are no longer available' }, { status: 400 });
  }

  const store = getStore();
  const orderId = await store.createPendingOrder({
    customerEmail: email,
    userId: customer?.id ?? null,
    shippingAddress: body.shippingAddress,
    items,
    totalCents: calculateOrderTotal(items)
  });

  if (customer) {
    await store.updateCustomerShipping(customer.id, body.shippingAddress);
  }

  return json({ orderId });
};
