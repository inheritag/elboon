import { fail } from '@sveltejs/kit';
import { applyOfferAction, type Offer, type OfferAction } from '../../../../domain/offer';
import { config } from '../../../../libs/config';
import { sendOfferOutcomeEmail } from '../../../../libs/email';
import { getStore, type OfferListRow } from '../../../../libs/store';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const offers = await getStore().listPendingOffers();
  return { offers };
};

export const actions: Actions = {
  respond: async ({ request }) => {
    const form = await request.formData();
    const offerId = form.get('offerId');
    const actionType = form.get('actionType');

    if (typeof offerId !== 'string' || !isOfferActionType(actionType)) {
      return fail(400, { error: 'Invalid response' });
    }

    const action = buildOfferAction(actionType, form.get('counterPriceCents'));
    if (!action) {
      return fail(400, { error: 'A counter offer needs a price' });
    }

    const offerRow = await getStore().getOfferWithProduct(offerId);
    if (!offerRow) {
      return fail(404, { error: 'Offer not found' });
    }

    const updated = applyOfferAction(toOffer(offerRow), action);
    await getStore().updateOffer(offerId, {
      status: updated.status,
      counterPriceCents: updated.counterPriceCents
    });
    if (updated.status !== 'ignored') {
      await notifyCustomer(offerId, offerRow.product_name, offerRow.customer_email, updated);
    }

    return { success: true };
  }
};

function isOfferActionType(value: FormDataEntryValue | null): value is OfferAction['type'] {
  return value === 'accept' || value === 'ignore' || value === 'counter';
}

function buildOfferAction(type: OfferAction['type'], counterPriceRaw: FormDataEntryValue | null): OfferAction | null {
  if (type !== 'counter') return { type };

  const counterPrice = Number(counterPriceRaw);
  if (!counterPrice || counterPrice <= 0) return null;
  return { type: 'counter', counterPriceCents: Math.round(counterPrice * 100) };
}

function toOffer(row: OfferListRow): Offer {
  return { status: row.status, offerPriceCents: row.offer_price_cents, counterPriceCents: row.counter_price_cents };
}

async function notifyCustomer(offerId: string, productName: string, customerEmail: string, offer: Offer): Promise<void> {
  const checkoutUrl = `${config.siteUrl()}/checkout/offer/${offerId}`;

  if (offer.status === 'accepted') {
    await sendOfferOutcomeEmail({ to: customerEmail, productName, outcome: 'accepted', checkoutUrl });
  } else if (offer.status === 'countered') {
    await sendOfferOutcomeEmail({
      to: customerEmail,
      productName,
      outcome: 'countered',
      checkoutUrl,
      counterPriceCents: offer.counterPriceCents ?? 0
    });
  }
}
