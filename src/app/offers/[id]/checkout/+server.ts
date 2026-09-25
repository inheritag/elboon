import { json } from '@sveltejs/kit';
import { checkoutPriceForOffer } from '../../../../domain/offer';
import { calculateOrderTotal, type ShippingAddress } from '../../../../domain/order';
import { customerFromCookies } from '../../../../libs/customer';
import { getStore } from '../../../../libs/store';
import type { RequestHandler } from './$types';

interface CheckoutOfferBody {
  shippingAddress: ShippingAddress;
}

export const POST: RequestHandler = async ({ request, params, cookies }) => {
  const body = (await request.json()) as CheckoutOfferBody;
  if (!body.shippingAddress?.phone) {
    return json({ error: 'Shipping details are required' }, { status: 400 });
  }

  const store = getStore();
  const row = await store.getOfferWithProduct(params.id);
  if (!row) {
    return json({ error: 'This offer is not available for checkout' }, { status: 400 });
  }

  const customer = await customerFromCookies(cookies);
  if (row.user_id && customer?.id !== row.user_id) {
    return json({ error: 'Sign in to check out this offer' }, { status: 401 });
  }

  const priceCents = checkoutPriceForOffer({
    status: row.status,
    offerPriceCents: row.offer_price_cents,
    counterPriceCents: row.counter_price_cents
  });
  if (priceCents === null) {
    return json({ error: 'This offer is not available for checkout' }, { status: 400 });
  }

  const items = [
    { productId: row.product_id, productName: row.product_name, quantity: 1, unitPriceCents: priceCents }
  ];

  const orderId = await store.createPendingOrder({
    customerEmail: row.customer_email,
    userId: row.user_id ?? customer?.id ?? null,
    shippingAddress: body.shippingAddress,
    items,
    totalCents: calculateOrderTotal(items)
  });

  if (customer) {
    await store.updateCustomerShipping(customer.id, body.shippingAddress);
  }

  return json({ orderId });
};
