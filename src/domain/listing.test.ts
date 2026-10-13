import { describe, expect, it } from 'vitest';
import {
  categoryBands,
  choiceHeading,
  familyKey,
  groupListings,
  mixByDepartment,
  shopName,
  sortListings
} from './listing';
import type { ProductSummary } from './product';

function item(id: string, name: string, category = 'clothing', priceCents = 1000): ProductSummary {
  return {
    id,
    name,
    priceCents,
    currency: 'GBP',
    category,
    imageUrl: `/uploads/${id}.jpg`,
    lowStock: false,
    remainingQty: null,
    offerEnabled: false,
    colors: [],
    sizes: []
  };
}

describe('shop names', () => {
  it('shortens marketplace titles and drops the brand code', () => {
    expect(
      shopName('Zaitun Men\'s Crew Neck Jumper Waffle Knitted Sweater Warm Long Sleeve Pullover Casual Busin')
    ).toBe("Men's Crew Neck Jumper Waffle Knitted");
    expect(shopName('LG-Magic-Remote, Replacement for LG-Smart-TV-Remote-Control, Universal for MR21GA MR22')).toBe(
      'LG Magic Remote'
    );
    expect(shopName('Sailor Fude DE Mannen Calligraphy Fountain Pen')).toBe('Sailor Fude DE Mannen Calligraphy Fountain');
  });

  it('keeps phone models apart and groups a case colour as a label', () => {
    const pro = 'JETech Case for iPhone 16 Pro 6.3-Inch, Non-Yellowing Shockproof Phone Bumper Cover';
    const max = 'JETech Case for iPhone 16 Pro Max 6.9-Inch, Non-Yellowing Shockproof Phone Bumper Cover';
    expect(familyKey(pro)).not.toBe(familyKey(max));
    expect(shopName('BEEJTUNY Case for Samsung Galaxy A57 5G, Cover Protective Bumper (Rose Gold)')).toBe(
      'Case for Samsung Galaxy A57 5G'
    );
  });
});

describe('groupListings', () => {
  it('shows one product for each size and colour upload', () => {
    const listings = groupListings([
      item('xl-black', "RRvane Men's V-Neck Sports Top, Lightweight Quick-Dry (XL, Black)", 'clothing', 1599),
      item('m-teal', "RRvane Men's V-Neck Sports Top, Lightweight Quick-Dry (M, Teal)", 'clothing', 1499),
      item('blue', 'TQRR Cleaning Brush, Grout Brush (6, Blue)', 'home', 229),
      item('black', 'TQRR Cleaning Brush, Grout Brush (6, Black)', 'home', 229),
      item('a3', 'THIYUFUNS Case for Xiaomi Redmi A3 4G with 2 Tempered Glass Screen Protector', 'phone-accessories', 899),
      item('a3-again', 'THIYUFUNS Case for Xiaomi Redmi A3 4G with 2 Tempered Glass Screen Protector', 'phone-accessories', 899),
      item('s24', 'THIYUFUNS Case for Samsung Galaxy S24 FE 5G with 2 Tempered Glass', 'phone-accessories', 999)
    ]);

    expect(listings.map((row) => row.name)).toEqual([
      "Men's V-Neck Sports Top",
      'Cleaning Brush',
      'Case for Xiaomi Redmi A3 4G',
      'Case for Samsung Galaxy S24 FE'
    ]);
    expect(listings[0].choices).toEqual(['M, Teal', 'XL, Black']);
    expect(listings[0].priceCents).toBe(1499);
    expect(listings[0].priceMaxCents).toBe(1599);
    expect(listings[1].choices).toEqual(['6, Black', '6, Blue']);
    expect(listings[2].options).toHaveLength(1);
    expect(listings[3].id).toBe('s24');
  });

  it('keeps a real size list on a single product', () => {
    const shorts = item('shorts', 'Everyday Shorts', 'fashion', 2800);
    shorts.sizes = [{ name: 'S' }, { name: 'M' }, { name: 'L' }];
    const [listing] = groupListings([shorts]);
    expect(listing.choices).toEqual(['S', 'M', 'L']);
    expect(choiceHeading(listing.choices)).toBe('Size');
  });
});

describe('sort and bands', () => {
  it('sorts by price without mixing categories on the homepage', () => {
    const listings = sortListings(
      groupListings([
        item('cable', 'Braided Charging Cable', 'accessories', 1200),
        item('tee', 'Cotton tee', 'clothing', 2200),
        item('pen', 'Sailor Fude DE Mannen Calligraphy Fountain Pen', 'home', 1499)
      ]),
      'price-asc'
    );
    const bands = categoryBands(listings, [
      { slug: 'clothing', label: 'clothing', parentSlug: null },
      { slug: 'accessories', label: 'accessories', parentSlug: null },
      { slug: 'home', label: 'home', parentSlug: null }
    ]);
    expect(bands.map((band) => band.slug)).toEqual(['accessories', 'clothing', 'home']);
    expect(bands.every((band) => band.items.every((item) => item.category === band.slug))).toBe(true);
    expect(listings.map((row) => row.priceCents)).toEqual([1200, 1499, 2200]);
  });
});

describe('mixByDepartment', () => {
  const categories = [
    { slug: 'tech', label: 'Tech', parentSlug: null },
    { slug: 'fashion', label: 'Fashion', parentSlug: null },
    { slug: 'home', label: 'Home', parentSlug: null },
    { slug: 'phones', label: 'Phones', parentSlug: 'tech' }
  ];

  it('takes one item from each department in rail order, newest first inside a department', () => {
    const mixed = mixByDepartment(
      groupListings([
        item('phone-new', 'New phone', 'phones', 9000),
        item('tee-new', 'New tee', 'fashion', 2000),
        item('lamp', 'Lamp', 'home', 3000),
        item('cable', 'Cable', 'tech', 1200),
        item('tee-old', 'Old tee', 'fashion', 1800),
        item('vase', 'Vase', 'home', 1500)
      ]),
      categories
    );
    expect(mixed.map((row) => row.id)).toEqual(['tee-new', 'lamp', 'phone-new', 'tee-old', 'vase', 'cable']);
  });

  it('leaves a single department in its incoming order', () => {
    const mixed = mixByDepartment(
      groupListings([
        item('a', 'Alpha tee', 'fashion', 2000),
        item('b', 'Beta tee', 'fashion', 1800)
      ]),
      categories
    );
    expect(mixed.map((row) => row.id)).toEqual(['a', 'b']);
  });
});
