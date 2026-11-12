import { describe, expect, it } from 'vitest';
import {
  canNestUnder,
  planNewCategory,
  categoryNav,
  categoryPath,
  categoryTrail,
  flattenTree,
  inCategoryTree,
  rootCategory,
  withDescendants,
  type CategoryRecord
} from './catalog';

const tree: CategoryRecord[] = [
  { slug: 'tech', label: 'tech', parentSlug: null },
  { slug: 'phones', label: 'phones', parentSlug: 'tech' },
  { slug: 'samsung', label: 'samsung', parentSlug: 'phones' },
  { slug: 'phone-accessories', label: 'phone accessories', parentSlug: 'phones' },
  { slug: 'fashion', label: 'fashion', parentSlug: null }
];

describe('category tree', () => {
  it('walks descendants, ancestors, and paths', () => {
    expect(withDescendants('tech', tree)).toEqual(['tech', 'phones', 'phone-accessories', 'samsung']);
    expect(rootCategory('samsung', tree)?.slug).toBe('tech');
    expect(categoryPath('samsung', tree)).toBe('tech / phones / samsung');
    expect(categoryTrail('samsung', tree)).toEqual(['tech', 'phones', 'samsung']);
    expect(inCategoryTree('samsung', 'tech', tree)).toBe(true);
    expect(inCategoryTree('fashion', 'tech', tree)).toBe(false);
    expect(inCategoryTree('phone-accessories', 'phones', tree)).toBe(true);
  });

  it('refuses a subcategory whose slug is already taken, before a parent is saved', () => {
    const plan = planNewCategory('Travel', 'Home', null, [
      { slug: 'home', label: 'home', parentSlug: null }
    ]);
    expect(plan).toEqual({ error: 'That category already exists' });
  });

  it('refuses a subcategory that would sit too deep', () => {
    const plan = planNewCategory('Cases', 'Leather', 'samsung', tree);
    expect(plan).toEqual({ error: 'Choose a parent the new category can sit under' });
    expect(planNewCategory('Cases', '', 'samsung', tree)).toEqual({ slug: 'cases', childSlug: null });
  });

  it('blocks cycles and over-nesting', () => {
    expect(canNestUnder('phones', 'samsung', tree)).toBe(false);
    expect(canNestUnder(null, 'samsung', tree)).toBe(true);
    expect(canNestUnder(null, 'missing', tree)).toBe(false);
  });

  it('builds a drill-down nav from a leaf', () => {
    const nav = categoryNav('samsung', tree);
    expect(nav.top.map((row) => row.slug)).toEqual(['fashion', 'tech']);
    expect(nav.levels.map((level) => level.parentSlug)).toEqual(['tech', 'phones']);
    expect(nav.levels[1].items.map((row) => row.slug)).toEqual(['phone-accessories', 'samsung']);
  });

  it('flattens the tree in parent-then-child order', () => {
    expect(flattenTree(tree).map((row) => row.slug)).toEqual([
      'fashion',
      'tech',
      'phones',
      'phone-accessories',
      'samsung'
    ]);
  });
});
