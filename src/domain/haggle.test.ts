import { describe, expect, it } from 'vitest';
import { haggleDefaultCents, haggleFloorCents, readHaggle } from './haggle';

describe('readHaggle', () => {
  it('names the band from how far under asking the bid sits', () => {
    expect(readHaggle(2000, 5000).tone).toBe('lowball');
    expect(readHaggle(3000, 5000).tone).toBe('cheeky');
    expect(readHaggle(3800, 5000).tone).toBe('serious');
    expect(readHaggle(4500, 5000).tone).toBe('close');
    expect(readHaggle(5000, 5000).tone).toBe('asking');
  });

  it('keeps the slider at least 30% of asking, and £1 minimum', () => {
    expect(haggleFloorCents(4999)).toBe(1500);
    expect(haggleFloorCents(200)).toBe(100);
    expect(haggleDefaultCents(5000)).toBe(3600);
  });
});
