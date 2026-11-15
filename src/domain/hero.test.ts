import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { CategoryRecord } from './catalog';
import { pickHero, type HeroShot } from './hero';
import { imageSize } from './image-size';

const categories: CategoryRecord[] = [
  { slug: 'fashion', label: 'fashion', parentSlug: null },
  { slug: 'home', label: 'home', parentSlug: null },
  { slug: 'tech', label: 'tech', parentSlug: null }
];

function shot(overrides: Partial<HeroShot> & Pick<HeroShot, 'id' | 'category'>): HeroShot {
  return {
    imageUrl: `/uploads/${overrides.id}.jpg`,
    width: 2000,
    height: 1400,
    available: true,
    ...overrides
  };
}

describe('pickHero', () => {
  it('leaves out unavailable items and photos too small to show', () => {
    const pick = pickHero(
      [
        shot({ id: 'gone', category: 'fashion', available: false, width: 3000, height: 2000 }),
        shot({ id: 'tiny', category: 'home', width: 320, height: 320 }),
        shot({ id: 'throw', category: 'home', width: 1024, height: 1024 })
      ],
      categories,
      1
    );
    expect(pick).toMatchObject({ id: 'throw', width: 1024, height: 1024 });
  });

  it('still gives a smaller in-stock photo a turn beside a sharper one', () => {
    const shots = [
      shot({ id: 'dress', category: 'fashion', width: 1024, height: 1024 }),
      shot({ id: 'watch', category: 'tech', width: 2400, height: 1600 }),
      shot({ id: 'mug', category: 'home', width: 900, height: 900 })
    ];
    const seen = new Set<string>();
    for (let seed = 0; seed < 3; seed += 1) seen.add(pickHero(shots, categories, seed)?.id ?? '');
    expect(seen).toEqual(new Set(['dress', 'watch', 'mug']));
  });

  it('uses the sharper photo on a product, and gives each department a turn', () => {
    const shots = [
      shot({ id: 'dress', category: 'fashion', imageUrl: '/uploads/dress-small.jpg', width: 1600, height: 900 }),
      shot({ id: 'dress', category: 'fashion', imageUrl: '/uploads/dress-large.jpg', width: 2800, height: 1800 }),
      shot({ id: 'throw', category: 'home', width: 2000, height: 1400 }),
      shot({ id: 'speaker', category: 'tech', width: 2000, height: 1400 })
    ];
    const seen = new Set<string>();
    for (let seed = 0; seed < 3; seed += 1) {
      const pick = pickHero(shots, categories, seed);
      if (pick?.id === 'dress') expect(pick.imageUrl).toBe('/uploads/dress-large.jpg');
      seen.add(pick?.id ?? '');
    }
    expect(seen).toEqual(new Set(['dress', 'throw', 'speaker']));
  });

  it('returns the same photo for the same seed', () => {
    const shots = [
      shot({ id: 'dress', category: 'fashion' }),
      shot({ id: 'throw', category: 'home' }),
      shot({ id: 'speaker', category: 'tech' })
    ];
    expect(pickHero(shots, categories, 4)).toEqual(pickHero([...shots].reverse(), categories, 4));
  });

  it('returns nothing when every photo is unavailable or too small', () => {
    expect(
      pickHero(
        [shot({ id: 'gone', category: 'fashion', available: false }), shot({ id: 'tiny', category: 'home', width: 200, height: 200 })],
        categories,
        0
      )
    ).toBeNull();
  });
});

describe('imageSize', () => {
  it('reads a JPEG, a PNG, and a WebP header', () => {
    const jpeg = readFileSync('static/products/speaker.jpg');
    expect(imageSize(jpeg)).toEqual({ width: 1024, height: 1024 });

    const png = new Uint8Array(24);
    png.set([137, 80, 78, 71, 13, 10, 26, 10]);
    png[11] = 13;
    png.set([73, 72, 68, 82], 12);
    const pngView = new DataView(png.buffer);
    pngView.setUint32(16, 640);
    pngView.setUint32(20, 480);
    expect(imageSize(png)).toEqual({ width: 640, height: 480 });

    const webp = new Uint8Array(30);
    webp.set([82, 73, 70, 70], 0);
    webp.set([87, 69, 66, 80], 8);
    webp.set([86, 80, 56, 88], 12);
    webp[24] = 0xff;
    webp[25] = 0x04;
    webp[27] = 0x57;
    webp[28] = 0x02;
    expect(imageSize(webp)).toEqual({ width: 1280, height: 600 });
    expect(imageSize(new Uint8Array([1, 2, 3]))).toBeNull();
  });
});
