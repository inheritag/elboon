import { describe, expect, it } from 'vitest';
import {
  availableFor,
  CHECKOUT_HOLD_MS,
  heldMap,
  inventoryLines,
  lowStockLines,
  stockView,
  totalAvailable,
  type HeldUnit
} from './inventory';
import type { Product } from './product';

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    name: 'Cotton tee',
    description: '',
    priceCents: 2200,
    currency: 'GBP',
    category: 'fashion',
    imageUrls: [],
    stockQty: 6,
    lowStockThreshold: 1,
    offerEnabled: false,
    active: true,
    sku: null,
    colors: [
      {
        name: 'Black',
        hex: '#111111',
        imageUrls: [],
        stockQty: 3,
        sku: null,
        sizeStocks: [
          { name: 'S', stockQty: 2, sku: 'TEE-BLK-S' },
          { name: 'M', stockQty: 1, sku: 'TEE-BLK-M' }
        ]
      },
      {
        name: 'White',
        hex: '#f4f4f4',
        imageUrls: [],
        stockQty: 3,
        sku: null,
        sizeStocks: [
          { name: 'S', stockQty: 3, sku: 'TEE-WHT-S' },
          { name: 'M', stockQty: 0, sku: 'TEE-WHT-M' }
        ]
      }
    ],
    sizes: [
      { name: 'S', stockQty: 0, sku: null },
      { name: 'M', stockQty: 0, sku: null }
    ],
    ...overrides
  };
}

describe('inventory lines', () => {
  it('flattens colour × size into SKU rows with on-hand and available', () => {
    const lines = inventoryLines([product()]);
    expect(lines.map((row) => [row.color, row.size, row.sku, row.onHand, row.available])).toEqual([
      ['Black', 'S', 'TEE-BLK-S', 2, 2],
      ['Black', 'M', 'TEE-BLK-M', 1, 1],
      ['White', 'S', 'TEE-WHT-S', 3, 3],
      ['White', 'M', 'TEE-WHT-M', 0, 0]
    ]);
    expect(lines.filter((row) => row.out).map((row) => row.sku)).toEqual(['TEE-WHT-M']);
    expect(lowStockLines([product()]).map((row) => row.sku)).toEqual(['TEE-WHT-M', 'TEE-BLK-M']);
  });

  it('subtracts recent unpaid checkouts from what the shop can sell', () => {
    const now = Date.parse('2026-10-08T12:00:00.000Z');
    const holds: HeldUnit[] = [
      {
        productId: 'p1',
        color: 'Black',
        size: 'S',
        quantity: 1,
        createdAt: '2026-10-08T11:30:00.000Z'
      },
      {
        productId: 'p1',
        color: 'White',
        size: 'S',
        quantity: 2,
        createdAt: '2026-10-08T11:45:00.000Z'
      }
    ];
    const held = heldMap(holds, now);
    const tee = product();
    expect(availableFor(tee, held, 'Black', 'S')).toBe(1);
    expect(availableFor(tee, held, 'White', 'S')).toBe(1);
    expect(totalAvailable(tee, held)).toBe(3);
  });

  it('drops holds older than the checkout window', () => {
    const now = Date.parse('2026-10-08T12:00:00.000Z');
    const held = heldMap(
      [
        {
          productId: 'p1',
          color: 'Black',
          size: 'S',
          quantity: 2,
          createdAt: new Date(now - CHECKOUT_HOLD_MS - 1000).toISOString()
        }
      ],
      now
    );
    expect(availableFor(product(), held, 'Black', 'S')).toBe(2);
  });

  it('rolls lines up to on-hand, held, available, and SKUs', () => {
    const held = heldMap(
      [
        {
          productId: 'p1',
          color: 'Black',
          size: 'S',
          quantity: 1,
          createdAt: '2026-10-08T11:30:00.000Z'
        }
      ],
      Date.parse('2026-10-08T12:00:00.000Z')
    );
    expect(stockView(product(), held)).toEqual({
      onHand: 6,
      held: 1,
      available: 5,
      low: true,
      out: false,
      skus: ['TEE-BLK-S', 'TEE-BLK-M', 'TEE-WHT-S', 'TEE-WHT-M']
    });
  });
});
