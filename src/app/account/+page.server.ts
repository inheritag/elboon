import { fail, redirect } from '@sveltejs/kit';
import { checkoutPriceForOffer } from '../../domain/offer';
import { clearCustomerCookie, customerFromCookies } from '../../libs/customer';
import { getStore } from '../../libs/store';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
  const customer = await customerFromCookies(cookies);
  if (!customer) redirect(303, '/?auth=login&redirectTo=/account');

  const offers = await getStore().listOffersForUser(customer.id);
  return {
    profile: customer,
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

export const actions: Actions = {
  logout: async ({ cookies }) => {
    clearCustomerCookie(cookies);
    redirect(303, '/');
  },

  default: async () => {
    return fail(400);
  }
};
