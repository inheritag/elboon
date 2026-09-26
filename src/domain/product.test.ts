import { describe, expect, it } from 'vitest';
import { parseColors, stockFor, totalColorStock } from './product';

describe('product colours', () => {
  it('parses named colours and ignores blanks', () => {
    const colors = parseColors([
      { name: 'Black', hex: '#111111', imageUrls: ['/a.jpg'], stockQty: 3 },
      { name: '  ', hex: 'nope', stockQty: 9 },
      { name: 'White', hex: 'red', imageUrls: [], stockQty: 1 }
    ]);
    expect(colors).toEqual([
      { name: 'Black', hex: '#111111', imageUrls: ['/a.jpg'], stockQty: 3 },
      { name: 'White', hex: '#111111', imageUrls: [], stockQty: 1 }
    ]);
    expect(totalColorStock(colors)).toBe(4);
  });

  it('uses colour stock when variants exist', () => {
    const product = {
      stockQty: 10,
      colors: [{ name: 'Black', hex: '#111111', imageUrls: [], stockQty: 2 }]
    };
    expect(stockFor(product, 'Black')).toBe(2);
    expect(stockFor(product, 'White')).toBe(0);
    expect(stockFor({ stockQty: 10, colors: [] })).toBe(10);
  });
});
