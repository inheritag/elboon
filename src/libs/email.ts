import { Resend } from 'resend';
import { formatPrice } from '../domain/product';
import { config } from './config';
import { getLocalStore } from './store';

let client: Resend | null = null;

function getResend(): Resend | null {
  const key = config.resendApiKey();
  if (!key) return null;
  if (!client) {
    client = new Resend(key);
  }
  return client;
}

const FROM_ADDRESS = 'Elboon <orders@elboon.com>';

async function deliver(to: string, subject: string, html: string): Promise<void> {
  if (config.isDevMode()) {
    await getLocalStore().recordEmail({ to, subject, html });
    console.info(`[dev email] to=${to} subject=${subject}`);
    return;
  }

  const resend = getResend();
  if (!resend) {
    console.info(`[email skipped] to=${to} subject=${subject}`);
    return;
  }

  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject,
    html
  });
}

export async function sendNewOfferAlertEmail(params: {
  productName: string;
  customerEmail: string;
  offerPriceCents: number;
  askingCents: number;
}): Promise<void> {
  const offer = formatPrice(params.offerPriceCents, 'GBP');
  const asking = formatPrice(params.askingCents, 'GBP');
  const adminUrl = `${config.siteUrl()}/admin/offers`;
  await deliver(
    config.offersInbox(),
    `New offer on ${params.productName}: ${offer}`,
    `<p><strong>${params.customerEmail}</strong> offered <strong>${offer}</strong> on <strong>${params.productName}</strong> (listed ${asking}).</p>
      <p><a href="${adminUrl}">Review in admin</a></p>`
  );
}

export async function sendOfferOutcomeEmail(params: {
  to: string;
  productName: string;
  outcome: 'accepted' | 'countered';
  checkoutUrl?: string;
  counterPriceCents?: number;
}): Promise<void> {
  await deliver(params.to, offerSubject(params.productName, params.outcome), offerBodyHtml(params));
}

function offerSubject(productName: string, outcome: 'accepted' | 'countered'): string {
  if (outcome === 'accepted') return `Your offer for ${productName} was accepted!`;
  return `We countered your offer for ${productName}`;
}

function offerBodyHtml(params: {
  productName: string;
  outcome: 'accepted' | 'countered';
  checkoutUrl?: string;
  counterPriceCents?: number;
}): string {
  if (params.outcome === 'accepted') {
    return `<p>Good news: your offer for <strong>${params.productName}</strong> was accepted.</p>
      <p><a href="${params.checkoutUrl}">Complete your purchase</a></p>
      <p>If you have an account, the deal is also waiting under Your offers.</p>`;
  }

  const counterPrice = formatPrice(params.counterPriceCents ?? 0, 'GBP');
  return `<p>We can't do your price on <strong>${params.productName}</strong>, but we can do <strong>${counterPrice}</strong>.</p>
    <p><a href="${params.checkoutUrl}">Accept and checkout</a></p>`;
}

export async function sendOrderConfirmationEmail(params: {
  to: string;
  orderId: string;
  totalCents: number;
}): Promise<void> {
  await deliver(
    params.to,
    `Order confirmed: ${params.orderId}`,
    `<p>Thanks for your order. A logistics partner will contact you to arrange delivery. Elboon does not ship parcels itself.</p>
      <p>Order total: <strong>${formatPrice(params.totalCents, 'GBP')}</strong></p>`
  );
}
