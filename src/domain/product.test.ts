import { describe, expect, it } from 'vitest';
import { applyReceive, applySale, applySet, parseColors, parseSizes, stockFor, totalColorStock, totalUnits } from './product';

describe('product colours', () => {
  it('parses named colours and ignores blanks', () => {
    const colors = parseColors([
      { name: 'Black', hex: '#111111', imageUrls: ['/a.jpg'], stockQty: 3 },
      { name: '  ', hex: 'nope', stockQty: 9 },
      { name: 'White', hex: 'red', imageUrls: [], stockQty: 1 }
    ]);
    expect(colors).toEqual([
      {
        name: 'Black',
        hex: '#111111',
        imageUrls: ['/a.jpg'],
        stockQty: 3,
        sku: null,
        sizeStocks: []
      },
      { name: 'White', hex: '#111111', imageUrls: [], stockQty: 1, sku: null, sizeStocks: [] }
    ]);
    expect(totalColorStock(colors)).toBe(4);
  });

  it('uses colour stock when variants exist', () => {
    const product = {
      stockQty: 10,
      colors: [{ name: 'Black', hex: '#111111', imageUrls: [], stockQty: 2, sku: null, sizeStocks: [] }],
      sizes: []
    };
    expect(stockFor(product, 'Black')).toBe(2);
    expect(stockFor(product, 'White')).toBe(0);
    expect(stockFor({ stockQty: 10, colors: [], sizes: [] })).toBe(10);
  });
});

describe('product sizes', () => {
  it('parses clothing and length labels', () => {
    expect(
      parseSizes([
        { name: 'M', stockQty: 4, sku: 'SHORTS-M' },
        { name: '90 cm', stockQty: 2 },
        { name: 'M', stockQty: 9 }
      ])
    ).toEqual([
      { name: 'M', stockQty: 4, sku: 'SHORTS-M' },
      { name: '90 cm', stockQty: 2, sku: null }
    ]);
  });

  it('uses size stock when there are no colours', () => {
    const product = {
      stockQty: 99,
      colors: [],
      sizes: [
        { name: 'S', stockQty: 1, sku: null },
        { name: 'L', stockQty: 3, sku: null }
      ]
    };
    expect(stockFor(product, null, 'L')).toBe(3);
    expect(stockFor(product, null, 'XL')).toBe(0);
    expect(totalUnits(product)).toBe(4);
  });

  it('uses colour × size stock when both are set', () => {
    const product = {
      stockQty: 0,
      colors: [
        {
          name: 'Black',
          hex: '#111111',
          imageUrls: [],
          stockQty: 5,
          sku: null,
          sizeStocks: [
            { name: 'M', stockQty: 2, sku: 'TEE-BLK-M' },
            { name: 'L', stockQty: 3, sku: null }
          ]
        }
      ],
      sizes: [
        { name: 'M', stockQty: 0, sku: null },
        { name: 'L', stockQty: 0, sku: null }
      ]
    };
    expect(stockFor(product, 'Black', 'M')).toBe(2);
    expect(stockFor(product, 'Black', 'XL')).toBe(0);
    const sold = applySale(product, 1, 'Black', 'M');
    expect(stockFor(sold, 'Black', 'M')).toBe(1);
    expect(sold.stockQty).toBe(4);
  });
});

describe('applySet', () => {
  it('sets colour × size stock without touching the other cells', () => {
    const product = {
      stockQty: 5,
      colors: [
        {
          name: 'Black',
          hex: '#111111',
          imageUrls: [],
          stockQty: 5,
          sku: null,
          sizeStocks: [
            { name: 'M', stockQty: 2, sku: 'TEE-BLK-M' },
            { name: 'L', stockQty: 3, sku: null }
          ]
        }
      ],
      sizes: [
        { name: 'M', stockQty: 0, sku: null },
        { name: 'L', stockQty: 0, sku: null }
      ]
    };
    const next = applySet(product, 9, 'Black', 'M');
    expect(next).not.toBeNull();
    expect(stockFor(next!, 'Black', 'M')).toBe(9);
    expect(stockFor(next!, 'Black', 'L')).toBe(3);
    expect(next!.stockQty).toBe(12);
    expect(next!.colors[0].sizeStocks[0].sku).toBe('TEE-BLK-M');
  });
});

describe('applyReceive', () => {
  it('adds a delivery onto one colour × size cell', () => {
    const product = {
      stockQty: 5,
      colors: [
        {
          name: 'Black',
          hex: '#111111',
          imageUrls: [],
          stockQty: 5,
          sku: null,
          sizeStocks: [
            { name: 'M', stockQty: 2, sku: 'TEE-BLK-M' },
            { name: 'L', stockQty: 3, sku: null }
          ]
        }
      ],
      sizes: [
        { name: 'M', stockQty: 0, sku: null },
        { name: 'L', stockQty: 0, sku: null }
      ]
    };
    const next = applyReceive(product, 4, 'Black', 'M');
    expect(next).not.toBeNull();
    expect(stockFor(next!, 'Black', 'M')).toBe(6);
    expect(stockFor(next!, 'Black', 'L')).toBe(3);
    expect(next!.stockQty).toBe(9);
    expect(applyReceive(product, 0, 'Black', 'M')).toBeNull();
    expect(applyReceive(product, 2, 'Red', 'M')).toBeNull();
  });
});
