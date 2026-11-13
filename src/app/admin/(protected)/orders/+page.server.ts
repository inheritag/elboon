import { fail } from '@sveltejs/kit';
import { sendOrderConfirmationEmail, sendOwnerOrderEmail } from '../../../../libs/email';
import { getStore } from '../../../../libs/store';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const orders = await getStore().listOrders();
  return { orders };
};

export const actions: Actions = {
  handoff: async ({ request }) => {
    const form = await request.formData();
    const id = form.get('id');
    if (typeof id !== 'string') return fail(400, { error: 'Missing order id' });
    const order = (await getStore().listOrders()).find((row) => row.id === id);
    if (!order || order.payment_status !== 'paid') {
      return fail(400, { error: 'Only paid orders can go to logistics' });
    }
    await getStore().markHandedToLogistics(id);
    return { success: true };
  },

  acknowledge: async ({ request }) => {
    const form = await request.formData();
    const id = form.get('id');
    if (typeof id !== 'string') return fail(400, { error: 'Missing order id' });
    const order = (await getStore().listOrders()).find((row) => row.id === id);
    if (!order || order.payment_status !== 'paid') {
      return fail(400, { error: 'Only a paid order can be acknowledged' });
    }

    const booked = Boolean(order.carrier_ref);
    try {
      await sendOwnerOrderEmail({
        orderId: order.id,
        customerEmail: order.customer_email,
        totalCents: order.total_cents,
        items: order.items,
        shipping: order.shipping_address,
        booked,
        trackingNumber: order.tracking_number
      });
      await sendOrderConfirmationEmail({
        to: order.customer_email,
        orderId: order.id,
        totalCents: order.total_cents,
        booked,
        trackingNumber: order.tracking_number
      });
      await getStore().markConfirmationSent(order.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Email was not sent';
      console.error('[order email]', message);
      return fail(500, { error: message });
    }

    return { emailed: true };
  }
};
