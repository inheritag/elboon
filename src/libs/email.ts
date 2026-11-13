import { Resend } from 'resend';
import type { OrderItem, ShippingAddress } from '../domain/order';
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

/** Resend's test sender. It can deliver to the Resend account inbox without a verified elboon.com domain. */
const FROM_ADDRESS = 'Elboon <onboarding@resend.dev>';

/** Every message goes to the shop inbox. A buyer address is named in the body, not used as the recipient. */
export function addressMail(
  inbox: string,
  to: string,
  html: string
): { to: string; html: string; replyTo?: string } {
  const shop = inbox.trim();
  const about = to.trim();
  if (about.toLowerCase() === shop.toLowerCase()) return { to: shop, html };
  return { to: shop, html: `<p>For ${escapeHtml(about)}.</p>${html}`, replyTo: about };
}

/** Resend returns `{ error }` instead of throwing. A missing id is also a failed send. */
export function emailFailure(result: {
  data: { id: string } | null;
  error: { message?: string } | null;
}): string | null {
  if (result.error) return result.error.message || 'Email was not sent';
  if (!result.data?.id) return 'Email was not sent';
  return null;
}

async function deliver(to: string, subject: string, html: string, replyTo?: string): Promise<void> {
  const mail = addressMail(config.ownerEmail(), to, html);
  const reply = replyTo ?? mail.replyTo;

  if (config.isDevMode()) {
    await getLocalStore().recordEmail({ to: mail.to, subject, html: mail.html });
    console.info(`[dev email] to=${mail.to} subject=${subject}`);
    return;
  }

  const resend = getResend();
  if (!resend) {
    throw new Error('RESEND_API_KEY is not set');
  }

  const result = await resend.emails.send({
    from: FROM_ADDRESS,
    to: mail.to,
    subject,
    html: mail.html,
    ...(reply ? { replyTo: reply } : {})
  });
  const failure = emailFailure(result);
  if (failure) {
    console.error('[email failed]', failure);
    throw new Error(failure);
  }
}

export async function sendSupportEmail(params: { email: string; message: string }): Promise<void> {
  const body = params.message
    .split('\n')
    .map((line) => escapeHtml(line))
    .join('<br>');
  await deliver(
    config.ownerEmail(),
    'Customer support',
    `<p>${escapeHtml(params.email)} wrote:</p><p>${body}</p>`,
    params.email
  );
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
    config.ownerEmail(),
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

export async function sendOwnerOrderEmail(params: {
  orderId: string;
  customerEmail: string;
  totalCents: number;
  items: OrderItem[];
  shipping: ShippingAddress;
  booked?: boolean;
  trackingNumber?: string | null;
}): Promise<void> {
  const total = formatPrice(params.totalCents, 'GBP');
  const adminUrl = `${config.siteUrl()}/admin/orders`;
  await deliver(config.ownerEmail(), `Order paid: ${params.orderId}`, ownerOrderHtml({ ...params, total, adminUrl }));
}

export function ownerOrderHtml(params: {
  customerEmail: string;
  total: string;
  items: OrderItem[];
  shipping: ShippingAddress;
  booked?: boolean;
  trackingNumber?: string | null;
  adminUrl: string;
}): string {
  const lines = params.items
    .map((item) => {
      const detail = [item.productName, item.color, item.size].filter(Boolean).join(', ');
      const lineTotal = formatPrice(item.unitPriceCents * item.quantity, 'GBP');
      return `<li>${item.quantity} × ${escapeHtml(detail)} — ${lineTotal}</li>`;
    })
    .join('');
  const address = [
    params.shipping.fullName,
    params.shipping.line1,
    params.shipping.line2,
    `${params.shipping.city} ${params.shipping.postcode}`,
    params.shipping.country
  ]
    .filter(Boolean)
    .map((part) => escapeHtml(String(part)))
    .join(', ');
  const tracking = params.trackingNumber ? escapeHtml(params.trackingNumber) : '';
  const delivery = tracking
    ? `Royal Mail tracking is ${tracking}.`
    : params.booked
      ? 'Booked with Royal Mail. No tracking number yet.'
      : 'Not booked with Royal Mail yet.';

  return `<p><strong>${escapeHtml(params.customerEmail)}</strong> paid <strong>${params.total}</strong>.</p>
    <ul>${lines}</ul>
    <p>Ship to ${address}. Phone ${escapeHtml(params.shipping.phone)}.</p>
    <p>${delivery}</p>
    <p><a href="${escapeHtml(params.adminUrl)}">Orders</a></p>`;
}

export async function sendOrderConfirmationEmail(params: {
  to: string;
  orderId: string;
  totalCents: number;
  booked?: boolean;
  trackingNumber?: string | null;
}): Promise<void> {
  const total = formatPrice(params.totalCents, 'GBP');
  const tracking = params.trackingNumber ? escapeHtml(params.trackingNumber) : '';
  const lead = tracking
    ? `Payment received. Royal Mail tracking is <strong>${tracking}</strong>.`
    : params.booked
      ? 'Payment received. We will send it with Royal Mail.'
      : 'Payment received. We will be in touch about delivery.';

  await deliver(
    params.to,
    `Order confirmed: ${params.orderId}`,
    `<p>${lead}</p><p>Order total: <strong>${total}</strong></p>`
  );
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (char) => {
    if (char === '&') return '&amp;';
    if (char === '<') return '&lt;';
    if (char === '>') return '&gt;';
    return '&quot;';
  });
}
