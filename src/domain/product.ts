import { isLowStock } from './stock';

export interface ProductColor {
  name: string;
  hex: string;
  imageUrls: string[];
  stockQty: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  category: string;
  imageUrls: string[];
  stockQty: number;
  lowStockThreshold: number;
  offerEnabled: boolean;
  active: boolean;
  colors: ProductColor[];
}

/** The shape a product takes once it's shown to a shopper. No internal thresholds leaked. */
export interface ProductSummary {
  id: string;
  name: string;
  priceCents: number;
  currency: string;
  category: string;
  imageUrl: string | null;
  lowStock: boolean;
  /** Remaining units, only set when stock is low, shown to create urgency. */
  remainingQty: number | null;
  offerEnabled: boolean;
  colors: { name: string; hex: string }[];
}

/** The columns SvelteKit's Postgres driver returns for a `products` row. */
export interface ProductRow {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  currency: string;
  category: string;
  image_urls: string[];
  stock_qty: number;
  low_stock_threshold: number;
  offer_enabled: boolean;
  active: boolean;
  variants?: unknown;
}

export function parseColors(raw: unknown): ProductColor[] {
  if (!Array.isArray(raw)) return [];
  const colors: ProductColor[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const name = String(row.name ?? '').trim();
    if (!name) continue;
    const hex = String(row.hex ?? '#111111');
    colors.push({
      name,
      hex: /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#111111',
      imageUrls: Array.isArray(row.imageUrls) ? row.imageUrls.filter((url): url is string => typeof url === 'string') : [],
      stockQty: Math.max(0, Number(row.stockQty) || 0)
    });
  }
  return colors;
}

export function totalColorStock(colors: ProductColor[]): number {
  return colors.reduce((sum, color) => sum + color.stockQty, 0);
}

export function stockFor(product: Pick<Product, 'stockQty' | 'colors'>, color?: string | null): number {
  if (product.colors.length === 0) return product.stockQty;
  return product.colors.find((item) => item.name === color)?.stockQty ?? 0;
}

export function productFromRow(row: ProductRow): Product {
  const colors = parseColors(row.variants);
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    priceCents: row.price_cents,
    currency: row.currency,
    category: row.category,
    imageUrls: row.image_urls,
    stockQty: colors.length > 0 ? totalColorStock(colors) : row.stock_qty,
    lowStockThreshold: row.low_stock_threshold,
    offerEnabled: row.offer_enabled,
    active: row.active,
    colors
  };
}

export function toProductSummary(product: Product): ProductSummary {
  return {
    id: product.id,
    name: product.name,
    priceCents: product.priceCents,
    currency: product.currency,
    category: product.category,
    imageUrl: product.imageUrls[0] ?? null,
    lowStock: isLowStock(product.stockQty, product.lowStockThreshold),
    remainingQty: isLowStock(product.stockQty, product.lowStockThreshold) ? product.stockQty : null,
    offerEnabled: product.offerEnabled,
    colors: product.colors.map((color) => ({ name: color.name, hex: color.hex }))
  };
}

export function formatPrice(priceCents: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(priceCents / 100);
}
