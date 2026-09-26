import { sendOrderConfirmationEmail } from './email';
import { getStore } from './store';

export async function fulfillPendingOrder(orderId: string): Promise<boolean> {
  const store = getStore();
  const order = await store.getPendingOrder(orderId);
  if (!order) return false;

  await store.markOrderPaid(order.id);

  for (const item of order.items) {
    await store.decrementProductStock(item.productId, item.quantity, item.color);
  }

  await sendOrderConfirmationEmail({
    to: order.customer_email,
    orderId: order.id,
    totalCents: order.total_cents
  });

  return true;
}
