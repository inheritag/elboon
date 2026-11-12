import { clickAndDropOrder } from '../domain/shipment';
import { config } from './config';
import type { OrderRecord } from './store';

const ORDERS_URL = 'https://api.parcel.royalmail.com/api/v1/orders';

interface CreatedOrder {
  orderIdentifier?: number | string;
  trackingNumber?: string | null;
}

interface CreateResponse {
  createdOrders?: CreatedOrder[];
  failedOrders?: { errors?: { message?: string }[] }[];
}

/** Book the paid order in Click & Drop. Postage is applied there. Null if it did not land. */
export async function bookRoyalMail(
  order: OrderRecord
): Promise<{ carrierRef: string; trackingNumber: string | null } | null> {
  const key = config.royalMailApiKey();
  if (!key || order.carrier_ref) return null;

  const item = clickAndDropOrder({
    orderId: order.id,
    email: order.customer_email,
    totalCents: order.total_cents,
    orderedAt: order.created_at,
    shipping: order.shipping_address
  });
  if (!item) return null;

  try {
    const response = await fetch(ORDERS_URL, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${key}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({ items: [item] })
    });
    const body = (await response.json().catch(() => null)) as CreateResponse | null;
    const created = body?.createdOrders?.[0];
    if (!response.ok || !created?.orderIdentifier) {
      const messages = body?.failedOrders?.flatMap((failed) => failed.errors ?? []).map((error) => error.message);
      console.error('Royal Mail did not take the order', order.id, response.status, messages ?? null);
      return null;
    }
    return {
      carrierRef: String(created.orderIdentifier),
      trackingNumber: created.trackingNumber ? String(created.trackingNumber) : null
    };
  } catch (err) {
    console.error('Royal Mail did not take the order', order.id, err);
    return null;
  }
}