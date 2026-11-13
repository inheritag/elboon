/** A stored percent. 0 means no discount. The cap keeps a price from being wiped out. */
export const MAX_DISCOUNT_PERCENT = 90;

export interface Sale {
  /** What the shopper pays. */
  priceCents: number;
  /** The price before the cut, only when the cut actually lowers it. */
  wasCents: number | null;
  discountPercent: number;
}

/** Empty is 0. Anything outside 0–90, or not a whole number, is rejected. */
export function parseDiscountPercent(raw: unknown): number | null {
  if (raw == null) return 0;
  const text = String(raw).trim();
  if (text === '') return 0;
  if (!/^\d+$/.test(text)) return null;
  const value = Number(text);
  if (value > MAX_DISCOUNT_PERCENT) return null;
  return value;
}

export function discountFromForm(raw: unknown): number | { error: string } {
  const parsed = parseDiscountPercent(raw);
  if (parsed == null) return { error: 'Discount can be from 0 to 90%.' };
  return parsed;
}

/** A bad stored value is treated as no discount. Form input is not clamped. */
export function discountPercentFromRow(raw: unknown): number {
  const value = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isInteger(value) || value < 0 || value > MAX_DISCOUNT_PERCENT) return 0;
  return value;
}

/**
 * Selling price. `priceCents` stays the price before the cut.
 * A result under 1p, or one that does not beat the original, is not shown as a discount.
 */
export function salePrice(priceCents: number, discountPercent: number): Sale {
  const original = Math.max(0, Math.round(priceCents));
  const percent = discountPercentFromRow(discountPercent);
  if (percent === 0 || original < 1) {
    return { priceCents: original, wasCents: null, discountPercent: 0 };
  }
  const next = Math.round((original * (100 - percent)) / 100);
  if (next < 1 || next >= original) {
    return { priceCents: original, wasCents: null, discountPercent: 0 };
  }
  return { priceCents: next, wasCents: original, discountPercent: percent };
}
