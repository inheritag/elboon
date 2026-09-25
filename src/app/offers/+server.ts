import { json } from '@sveltejs/kit';
import { customerFromCookies } from '../../libs/customer';
import { sendNewOfferAlertEmail } from '../../libs/email';
import { getStore } from '../../libs/store';
import type { RequestHandler } from './$types';

interface CreateOfferBody {
  productId: string;
  customerEmail?: string;
  offerPriceCents: number;
}

export const POST: RequestHandler = async ({ request, cookies }) => {
  const body = (await request.json()) as CreateOfferBody;
  const customer = await customerFromCookies(cookies);
  const email = customer?.email ?? body.customerEmail;

  if (
    typeof body.productId !== 'string' ||
    typeof body.offerPriceCents !== 'number' ||
    body.offerPriceCents <= 0 ||
    typeof email !== 'string' ||
    !email.includes('@')
  ) {
    return json({ error: 'Invalid offer request' }, { status: 400 });
  }

  const store = getStore();
  const product = await store.getActiveProduct(body.productId);
  if (!product || !product.offer_enabled) {
    return json({ error: 'This product does not accept offers' }, { status: 400 });
  }

  await store.createOffer({
    productId: body.productId,
    customerEmail: email,
    offerPriceCents: body.offerPriceCents,
    userId: customer?.id ?? null
  });

  await sendNewOfferAlertEmail({
    productName: product.name,
    customerEmail: email,
    offerPriceCents: body.offerPriceCents,
    askingCents: product.price_cents
  });

  return json({ ok: true, email }, { status: 201 });
};
