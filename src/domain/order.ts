import type { CardBrand } from './card';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  /** Catalogue price before the discount. Omitted on orders placed before a discount existed. */
  wasCents?: number | null;
  discountPercent?: number;
  color?: string | null;
  size?: string | null;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  postcode: string;
  country: string;
}

export type PaymentStatus = 'pending' | 'paid' | 'failed';

export type LogisticsStatus = 'awaiting_partner' | 'handed_off';

export interface CardReceipt {
  brand: CardBrand;
  last4: string;
}

export function calculateOrderTotal(items: OrderItem[]): number {
  return items.reduce((total, item) => total + item.unitPriceCents * item.quantity, 0);
}

function text(value: unknown, min: number): boolean {
  return typeof value === 'string' && value.trim().length >= min;
}

export interface ShopperOrderItem {
  name: string;
  quantity: number;
  color: string | null;
  size: string | null;
}

export interface ShopperOrder {
  id: string;
  createdAt: string;
  totalCents: number;
  items: ShopperOrderItem[];
  status: string;
}

/** Paid orders for this shopper only. Newest first, as the store already returns them. */
export function ordersForShopper(
  email: string,
  orders: Array<{
    id: string;
    customer_email: string;
    items: OrderItem[];
    total_cents: number;
    payment_status: PaymentStatus;
    logistics_status: LogisticsStatus;
    carrier_ref: string | null;
    tracking_number: string | null;
    created_at: string;
  }>
): ShopperOrder[] {
  const wanted = email.trim().toLowerCase();
  if (!wanted) return [];
  return orders
    .filter(
      (order) => order.payment_status === 'paid' && order.customer_email.trim().toLowerCase() === wanted
    )
    .map((order) => ({
      id: order.id,
      createdAt: order.created_at,
      totalCents: order.total_cents,
      items: order.items.map((item) => ({
        name: item.productName,
        quantity: item.quantity,
        color: item.color ?? null,
        size: item.size ?? null
      })),
      status: shopperOrderStatus(order)
    }));
}

export function shopperOrderStatus(order: {
  logistics_status: LogisticsStatus;
  tracking_number: string | null;
  carrier_ref: string | null;
}): string {
  if (order.tracking_number) return `Payment received. Royal Mail tracking is ${order.tracking_number}.`;
  if (order.logistics_status === 'handed_off') return 'Sent.';
  if (order.carrier_ref) return 'Payment received. We will send it with Royal Mail.';
  return 'Payment received. We will be in touch about delivery.';
}

/** Address text is present, so later booking does not call trim on a missing field. */
export function isCompleteShipping(address: Partial<ShippingAddress> | null | undefined): address is ShippingAddress {
  if (!address) return false;
  return (
    text(address.fullName, 1) &&
    text(address.phone, 6) &&
    text(address.line1, 1) &&
    text(address.city, 1) &&
    typeof address.postcode === 'string' &&
    text(address.country, 1) &&
    (address.line2 == null || typeof address.line2 === 'string')
  );
}
