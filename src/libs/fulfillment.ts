import { sendOrderConfirmationEmail } from './email';
import { bookRoyalMail } from './royal-mail';
import { getStore } from './store';

export async function fulfillPendingOrder(orderId: string): Promise<boolean> {
  const store = getStore();
  const order = await store.getOrder(orderId);
  if (!order || order.payment_status !== 'pending') return false;

  const won = await store.markOrderPaid(order.id);
  if (!won) return false;

  for (const item of order.items) {
    await store.decrementProductStock(item.productId, item.quantity, item.color, item.size);
  }

  const shipment = await bookRoyalMail(order);
  if (shipment) await store.recordShipment(order.id, shipment);

  await sendOrderConfirmationEmail({
    to: order.customer_email,
    orderId: order.id,
    totalCents: order.total_cents,
    booked: Boolean(shipment),
    trackingNumber: shipment?.trackingNumber ?? null
  });

  return true;
}
