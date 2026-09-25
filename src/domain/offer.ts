/**
 * The "make offer" haggle flow. A customer proposes a price on an
 * offer-enabled product; the store owner resolves it one of three ways
 * (Sep 1 meeting): accept, ignore, or counter.
 *
 * State machine:
 *   pending -> accepted   (owner agrees to the customer's price)
 *   pending -> ignored    (owner declines without notifying the customer)
 *   pending -> countered  (owner proposes a different price)
 * `accepted` and `ignored` are terminal. `countered` is also terminal from
 * the admin's side for this MVP: the customer either checks out at the
 * countered price or the offer simply expires unused.
 */

export type OfferStatus = 'pending' | 'accepted' | 'ignored' | 'countered';

export interface Offer {
  status: OfferStatus;
  offerPriceCents: number;
  counterPriceCents: number | null;
}

export type OfferAction =
  | { type: 'accept' }
  | { type: 'ignore' }
  | { type: 'counter'; counterPriceCents: number };

const ACTIONS_ALLOWED_FROM: Record<OfferStatus, OfferAction['type'][]> = {
  pending: ['accept', 'ignore', 'counter'],
  accepted: [],
  ignored: [],
  countered: []
};

export function applyOfferAction(offer: Offer, action: OfferAction): Offer {
  const allowed = ACTIONS_ALLOWED_FROM[offer.status];
  if (!allowed.includes(action.type)) {
    throw new Error(`Cannot apply "${action.type}" to an offer that is "${offer.status}"`);
  }

  switch (action.type) {
    case 'accept':
      return { ...offer, status: 'accepted' };
    case 'ignore':
      return { ...offer, status: 'ignored' };
    case 'counter':
      return { ...offer, status: 'countered', counterPriceCents: action.counterPriceCents };
  }
}

/** The price the customer would actually pay if they proceed to checkout now. */
export function checkoutPriceForOffer(offer: Offer): number | null {
  if (offer.status === 'accepted') return offer.offerPriceCents;
  if (offer.status === 'countered') return offer.counterPriceCents;
  return null;
}
