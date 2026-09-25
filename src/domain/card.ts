/**
 * In-app Visa / Mastercard checks. The Sep 1 MVP explicitly avoided Stripe
 * and Flutterwave; this is a standard card form, not a third-party checkout.
 * The PAN is never stored. Callers should keep only brand + last4.
 */

export type CardBrand = 'visa' | 'mastercard';

export interface CardInput {
  number: string;
  expiry: string;
  cvc: string;
  nameOnCard: string;
}

export interface ChargedCard {
  brand: CardBrand;
  last4: string;
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export function detectCardBrand(number: string): CardBrand | null {
  const digits = digitsOnly(number);
  if (/^4\d{12,18}$/.test(digits)) return 'visa';

  const prefix2 = Number(digits.slice(0, 2));
  const prefix4 = Number(digits.slice(0, 4));
  if (digits.length === 16 && ((prefix2 >= 51 && prefix2 <= 55) || (prefix4 >= 2221 && prefix4 <= 2720))) {
    return 'mastercard';
  }
  return null;
}

export function luhnValid(number: string): boolean {
  const digits = digitsOnly(number);
  if (digits.length < 13) return false;

  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = Number(digits[i]);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

export function expiryValid(expiry: string, now = new Date()): boolean {
  const match = expiry.trim().match(/^(\d{1,2})\s*\/\s*(\d{2})$/);
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;

  const lastDay = new Date(year, month, 0);
  return lastDay >= new Date(now.getFullYear(), now.getMonth(), 1);
}

export function chargeCard(input: CardInput): ChargedCard | { error: string } {
  const number = digitsOnly(input.number);
  const brand = detectCardBrand(number);
  if (!brand) {
    return { error: 'We only accept Visa and Mastercard' };
  }
  if (!luhnValid(number)) {
    return { error: 'Check the card number' };
  }
  if (!expiryValid(input.expiry)) {
    return { error: 'Check the expiry date (MM/YY)' };
  }
  if (!/^\d{3,4}$/.test(input.cvc.trim())) {
    return { error: 'Check the security code' };
  }
  if (!input.nameOnCard.trim()) {
    return { error: 'Name on card is required' };
  }

  return { brand, last4: number.slice(-4) };
}
