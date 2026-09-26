import type { CardBrand } from './card';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  color?: string | null;
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
