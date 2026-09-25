import { redirect } from '@sveltejs/kit';
import { checkoutPriceForOffer } from '../../../domain/offer';
import { customerFromCookies } from '../../../libs/customer';
import { getStore } from '../../../libs/store';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
  const customer = await customerFromCookies(cookies);
  if (!customer) redirect(303, '/account/login?redirectTo=/account/offers');

  const offers = await getStore().listOffersForUser(customer.id);
  return {
    offers: offers.map((offer) => ({
      ...offer,
      checkoutPriceCents: checkoutPriceForOffer({
        status: offer.status,
        offerPriceCents: offer.offer_price_cents,
        counterPriceCents: offer.counter_price_cents
      })
    }))
  };
};
