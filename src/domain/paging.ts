export const CATALOG_PAGE_SIZE = 24;

export interface PageWindow<T> {
  items: T[];
  page: number;
  pages: number;
  total: number;
  pageSize: number;
}

/** Clamp a 1-based page onto a list. Empty lists still report page 1 of 1. */
export function paginate<T>(items: T[], page: number, pageSize = CATALOG_PAGE_SIZE): PageWindow<T> {
  const size = Math.max(1, Math.floor(pageSize) || 1);
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / size));
  const current = Math.min(pages, Math.max(1, Math.floor(Number.isFinite(page) ? page : 1) || 1));
  const start = (current - 1) * size;
  return {
    items: items.slice(start, start + size),
    page: current,
    pages,
    total,
    pageSize: size
  };
}
