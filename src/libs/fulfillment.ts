import { sendOrderConfirmationEmail, sendOwnerOrderEmail } from './email';
import { bookRoyalMail } from './royal-mail';
import { getStore } from './store';

/**
 * Mark a pending order paid, then take stock and send the confirmation.
 * Safe to run again: stock is taken once, and a failed email can be retried.
 * `book: false` skips Royal Mail (the local no-charge button).
 */
export async function fulfillPendingOrder(orderId: string, options?: { book?: boolean }): Promise<boolean> {
  const store = getStore();
  const order = await store.getOrder(orderId);
  if (!order) return false;
  if (order.payment_status === 'pending') {
    const won = await store.markOrderPaid(order.id);
    if (!won) {
      const again = await store.getOrder(orderId);
      if (!again || again.payment_status !== 'paid') return false;
    }
  } else if (order.payment_status !== 'paid') {
    return false;
  }

  const stock = await store.takePaidStock(orderId);
  if (stock === 'unpaid') return false;
  if (stock === 'short') console.error('Paid order has no stock left', orderId);

  if (options?.book !== false) {
    try {
      const current = await store.getOrder(orderId);
      if (current) {
        const shipment = await bookRoyalMail(current);
        if (shipment) await store.recordShipment(orderId, shipment);
      }
    } catch (err) {
      console.error('Royal Mail did not take the order', orderId, err);
    }
  }

  const claim = await store.claimConfirmation(orderId);
  if (claim === 'sent') return true;
  if (claim === 'busy') throw new Error('Confirmation email is still being sent');

  try {
    const latest = await store.getOrder(orderId);
    if (!latest) throw new Error('Order disappeared before the confirmation email');
    const booked = Boolean(latest.carrier_ref);
    await sendOwnerOrderEmail({
      orderId: latest.id,
      customerEmail: latest.customer_email,
      totalCents: latest.total_cents,
      items: latest.items,
      shipping: latest.shipping_address,
      booked,
      trackingNumber: latest.tracking_number
    });
    await sendOrderConfirmationEmail({
      to: latest.customer_email,
      orderId: latest.id,
      totalCents: latest.total_cents,
      booked,
      trackingNumber: latest.tracking_number
    });
    await store.markConfirmationSent(orderId);
  } catch (err) {
    await store.releaseConfirmation(orderId);
    throw err;
  }

  return true;
}
