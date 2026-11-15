import { describe, expect, it } from 'vitest';
import { productFromRow, toProductSummary } from './product';
import { discountFromForm, parseDiscountPercent, salePrice } from './price';

describe('salePrice', () => {
  it('takes 20% off £49.99', () => {
    expect(salePrice(4999, 20)).toEqual({ priceCents: 3999, wasCents: 4999, discountPercent: 20 });
  });

  it('leaves a full price alone', () => {
    expect(salePrice(4999, 0)).toEqual({ priceCents: 4999, wasCents: null, discountPercent: 0 });
  });

  it('hides a cut that rounding does not actually lower', () => {
    expect(salePrice(49, 1)).toEqual({ priceCents: 49, wasCents: null, discountPercent: 0 });
  });

  it('hides a cut that would make the item free', () => {
    expect(salePrice(4, 90)).toEqual({ priceCents: 4, wasCents: null, discountPercent: 0 });
  });

  it('ignores a stored percent outside 0 to 90', () => {
    expect(salePrice(1000, 100)).toEqual({ priceCents: 1000, wasCents: null, discountPercent: 0 });
  });
});

describe('parseDiscountPercent', () => {
  it('accepts a whole number from 0 to 90 and an empty field', () => {
    expect(parseDiscountPercent('')).toBe(0);
    expect(parseDiscountPercent(null)).toBe(0);
    expect(parseDiscountPercent('0')).toBe(0);
    expect(parseDiscountPercent('90')).toBe(90);
  });

  it('rejects fractions and anything past 90', () => {
    expect(parseDiscountPercent('20.5')).toBeNull();
    expect(parseDiscountPercent('-1')).toBeNull();
    expect(parseDiscountPercent('91')).toBeNull();
    expect(discountFromForm('91')).toEqual({ error: 'Discount can be from 0 to 90%.' });
  });
});

describe('product price', () => {
  it('keeps the stored price and sells at the cut', () => {
    const product = productFromRow({
      id: '1',
      name: 'Wireless Earbuds',
      description: '',
      price_cents: 4999,
      discount_percent: 20,
      currency: 'GBP',
      category: 'tech',
      image_urls: [],
      stock_qty: 1,
      low_stock_threshold: 3,
      offer_enabled: true,
      active: true
    });
    expect(product.priceCents).toBe(4999);
    expect(product.discountPercent).toBe(20);
    expect(toProductSummary(product)).toMatchObject({
      priceCents: 3999,
      wasCents: 4999,
      discountPercent: 20
    });
  });

  it('reads a missing percent as no discount', () => {
    const product = productFromRow({
      id: '1',
      name: 'Cable',
      description: '',
      price_cents: 1200,
      currency: 'GBP',
      category: 'tech',
      image_urls: [],
      stock_qty: 1,
      low_stock_threshold: 3,
      offer_enabled: false,
      active: true
    });
    expect(product.discountPercent).toBe(0);
    expect(toProductSummary(product).wasCents).toBeNull();
  });

  it('marks zero available stock as out, and keeps a low count only when some remain', () => {
    const product = productFromRow({
      id: '1',
      name: 'Cable',
      description: '',
      price_cents: 1200,
      currency: 'GBP',
      category: 'tech',
      image_urls: [],
      stock_qty: 2,
      low_stock_threshold: 3,
      offer_enabled: false,
      active: true
    });
    expect(toProductSummary(product)).toMatchObject({ outOfStock: false, remainingQty: 2 });
    expect(toProductSummary(product, 0)).toMatchObject({ outOfStock: true, remainingQty: null, lowStock: false });
  });
});
