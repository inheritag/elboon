import { describe, expect, it } from 'vitest';
import { calendarDay, deskFigures, listedInventory, soldPerDay } from './desk';
import type { ProductRow } from './product';

function product(overrides: Partial<ProductRow> & Pick<ProductRow, 'id' | 'name' | 'price_cents' | 'stock_qty'>): ProductRow {
  return {
    description: '',
    currency: 'GBP',
    category: 'tech',
    image_urls: [],
    low_stock_threshold: 3,
    offer_enabled: false,
    active: true,
    ...overrides
  };
}

describe('listedInventory', () => {
  it('counts active listings and values remaining stock at listed prices', () => {
    const figures = listedInventory([
      product({ id: 'a', name: 'Cable', price_cents: 1200, stock_qty: 40 }),
      product({ id: 'b', name: 'Hidden', price_cents: 9999, stock_qty: 10, active: false }),
      product({
        id: 'c',
        name: 'Earbuds',
        price_cents: 5000,
        stock_qty: 99,
        variants: [
          { name: 'Black', hex: '#111111', imageUrls: [], stockQty: 2 },
          { name: 'White', hex: '#f4f4f4', imageUrls: [], stockQty: 1 }
        ]
      })
    ]);

    expect(figures.listingCount).toBe(2);
    expect(figures.unitCount).toBe(43);
    expect(figures.worthCents).toBe(40 * 1200 + 3 * 5000);
  });

  it('treats an empty catalogue as zero', () => {
    expect(listedInventory([])).toEqual({
      listingCount: 0,
      unitCount: 0,
      worthCents: 0,
      currency: 'GBP'
    });
  });
});

describe('soldPerDay', () => {
  it('groups paid totals onto London calendar days and ignores unpaid orders', () => {
    const now = new Date('2026-10-01T12:00:00.000Z');
    const sold = soldPerDay(
      [
        { payment_status: 'paid', total_cents: 2800, created_at: '2026-10-01T10:00:00.000Z' },
        { payment_status: 'paid', total_cents: 1200, created_at: '2026-10-01T11:00:00.000Z' },
        { payment_status: 'pending', total_cents: 9900, created_at: '2026-10-01T11:30:00.000Z' },
        { payment_status: 'paid', total_cents: 3500, created_at: '2026-09-30T12:00:00.000Z' }
      ],
      { now, timeZone: 'Europe/London', days: 3 }
    );

    expect(sold.soldTodayCents).toBe(4000);
    expect(sold.soldDays.map((row) => ({ day: row.day, label: row.label, cents: row.cents }))).toEqual([
      { day: '2026-10-01', label: 'Today', cents: 4000 },
      { day: '2026-09-30', label: '30 Sept', cents: 3500 }
    ]);
  });

  it('drops paid days older than the lookback', () => {
    const sold = soldPerDay(
      [
        { payment_status: 'paid', total_cents: 100, created_at: '2026-10-01T10:00:00.000Z' },
        { payment_status: 'paid', total_cents: 200, created_at: '2026-08-01T10:00:00.000Z' }
      ],
      { now: new Date('2026-10-01T12:00:00.000Z'), days: 7 }
    );
    expect(sold.soldDays.map((row) => row.day)).toEqual(['2026-10-01']);
  });

  it('puts a late-UTC sale onto the next London morning in summer time', () => {
    // 30 Sep 23:30 UTC is 1 Oct 00:30 BST.
    expect(calendarDay('2026-09-30T23:30:00.000Z')).toBe('2026-10-01');
    const sold = soldPerDay(
      [{ payment_status: 'paid', total_cents: 500, created_at: '2026-09-30T23:30:00.000Z' }],
      { now: new Date('2026-10-01T12:00:00.000Z') }
    );
    expect(sold.soldTodayCents).toBe(500);
  });
});

describe('deskFigures', () => {
  it('combines listings, worth, and today sold', () => {
    const figures = deskFigures(
      [product({ id: 'a', name: 'Cable', price_cents: 1000, stock_qty: 2 })],
      [{ payment_status: 'paid', total_cents: 1000, created_at: '2026-10-01T10:00:00.000Z' }],
      new Date('2026-10-01T12:00:00.000Z')
    );
    expect(figures.listingCount).toBe(1);
    expect(figures.worthCents).toBe(2000);
    expect(figures.soldTodayCents).toBe(1000);
  });
});
