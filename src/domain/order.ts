import type { CardBrand } from './card';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
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
