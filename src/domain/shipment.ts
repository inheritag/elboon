import { countryCode } from './countries';
import type { ShippingAddress } from './order';

export interface ClickAndDropOrder {
  orderReference: string;
  isRecipientABusiness: false;
  recipient: {
    address: {
      fullName: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      postcode: string;
      countryCode: string;
    };
    phoneNumber: string;
    emailAddress: string;
  };
  orderDate: string;
  subtotal: number;
  shippingCostCharged: 0;
  total: number;
  currencyCode: 'GBP';
}

export interface ShipmentInput {
  orderId: string;
  email: string;
  totalCents: number;
  orderedAt: string;
  shipping: ShippingAddress;
}

function clip(value: string, max: number): string {
  return value.trim().slice(0, max);
}

/**
 * A Click & Drop order with no service and no weight. Postage is applied
 * in Click & Drop, so we do not invent a parcel size here.
 */
export function clickAndDropOrder(input: ShipmentInput): ClickAndDropOrder | null {
  const code = countryCode(input.shipping.country);
  const line1 = clip(input.shipping.line1, 100);
  if (!code || !line1) return null;

  const pounds = Math.round(input.totalCents) / 100;
  const line2 = input.shipping.line2 ? clip(input.shipping.line2, 100) : '';
  const address: ClickAndDropOrder['recipient']['address'] = {
    fullName: clip(input.shipping.fullName, 210),
    addressLine1: line1,
    city: clip(input.shipping.city, 100),
    postcode: clip(input.shipping.postcode, 20),
    countryCode: code
  };
  if (line2) address.addressLine2 = line2;

  return {
    orderReference: input.orderId.slice(0, 40),
    isRecipientABusiness: false,
    recipient: {
      address,
      phoneNumber: clip(input.shipping.phone, 25),
      emailAddress: clip(input.email, 254)
    },
    orderDate: input.orderedAt,
    subtotal: pounds,
    shippingCostCharged: 0,
    total: pounds,
    currencyCode: 'GBP'
  };
}