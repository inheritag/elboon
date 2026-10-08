import { describe, expect, it } from 'vitest';
import { paginate } from './paging';

describe('paginate', () => {
  it('slices a 1-based page and reports totals', () => {
    const window = paginate(['a', 'b', 'c', 'd', 'e'], 2, 2);
    expect(window).toEqual({
      items: ['c', 'd'],
      page: 2,
      pages: 3,
      total: 5,
      pageSize: 2
    });
  });

  it('clamps out-of-range pages and treats an empty list as page 1', () => {
    expect(paginate(['a', 'b', 'c'], 99, 2).page).toBe(2);
    expect(paginate(['a', 'b'], 0, 2).page).toBe(1);
    expect(paginate([], 4, 24)).toEqual({
      items: [],
      page: 1,
      pages: 1,
      total: 0,
      pageSize: 24
    });
  });
});
