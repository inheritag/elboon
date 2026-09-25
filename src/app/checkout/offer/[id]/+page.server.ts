import { error, redirect } from '@sveltejs/kit';
import { checkoutPriceForOffer, type Offer } from '../../../../domain/offer';
import { customerFromCookies } from '../../../../libs/customer';
import { getStore } from '../../../../libs/store';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, cookies, url }) => {
  const row = await getStore().getOfferWithProduct(params.id);
  if (!row) {
    error(404, 'Offer not found');
  }

  const customer = await customerFromCookies(cookies);
  if (row.user_id && customer?.id !== row.user_id) {
    redirect(303, `/?auth=login&redirectTo=${encodeURIComponent(url.pathname)}`);
  }

  const offer: Offer = {
    status: row.status,
    offerPriceCents: row.offer_price_cents,
    counterPriceCents: row.counter_price_cents
  };
  const priceCents = checkoutPriceForOffer(offer);
  if (priceCents === null) {
    error(400, 'This offer is not available for checkout');
  }

  return {
    productName: row.product_name,
    priceCents,
    askingCents: row.product_price_cents,
    status: row.status,
    shipping: customer?.shippingAddress ?? null,
    email: customer?.email ?? row.customer_email
  };
};
