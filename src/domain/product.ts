import { decrementStock, isLowStock } from './stock';

export const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;

export interface ProductSize {
  name: string;
  stockQty: number;
  sku: string | null;
}

export interface ProductColor {
  name: string;
  hex: string;
  imageUrls: string[];
  stockQty: number;
  sku: string | null;
  sizeStocks: ProductSize[];
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
  sku: string | null;
  colors: ProductColor[];
  sizes: ProductSize[];
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
  sizes: { name: string }[];
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
  sizes?: unknown;
  sku?: string | null;
}

export function parseSku(raw: unknown): string | null {
  const sku = String(raw ?? '').trim();
  return sku || null;
}

export function parseSizes(raw: unknown): ProductSize[] {
  if (!Array.isArray(raw)) return [];
  const sizes: ProductSize[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const name = String(row.name ?? '').trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    sizes.push({ name, stockQty: Math.max(0, Number(row.stockQty) || 0), sku: parseSku(row.sku) });
  }
  return sizes;
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
      stockQty: Math.max(0, Number(row.stockQty) || 0),
      sku: parseSku(row.sku),
      sizeStocks: parseSizes(row.sizeStocks)
    });
  }
  return colors;
}

export function totalSizeStock(sizes: ProductSize[]): number {
  return sizes.reduce((sum, size) => sum + size.stockQty, 0);
}

export function colorUnits(color: ProductColor): number {
  if (color.sizeStocks.length > 0) return totalSizeStock(color.sizeStocks);
  return color.stockQty;
}

export function totalColorStock(colors: ProductColor[]): number {
  return colors.reduce((sum, color) => sum + colorUnits(color), 0);
}

export function totalUnits(product: Pick<Product, 'stockQty' | 'colors' | 'sizes'>): number {
  if (product.colors.length > 0) return totalColorStock(product.colors);
  if (product.sizes.length > 0) return totalSizeStock(product.sizes);
  return product.stockQty;
}

export function stockFor(
  product: Pick<Product, 'stockQty' | 'colors' | 'sizes'>,
  color?: string | null,
  size?: string | null
): number {
  if (product.colors.length > 0 && product.sizes.length > 0) {
    const match = product.colors.find((item) => item.name === color);
    if (!match) return 0;
    return match.sizeStocks.find((item) => item.name === size)?.stockQty ?? 0;
  }
  if (product.colors.length > 0) {
    return product.colors.find((item) => item.name === color)?.stockQty ?? 0;
  }
  if (product.sizes.length > 0) {
    return product.sizes.find((item) => item.name === size)?.stockQty ?? 0;
  }
  return product.stockQty;
}

export function applySale(
  product: Pick<Product, 'stockQty' | 'colors' | 'sizes'>,
  quantity: number,
  color?: string | null,
  size?: string | null
): { colors: ProductColor[]; sizes: ProductSize[]; stockQty: number } {
  let colors = product.colors.map((item) => ({
    ...item,
    imageUrls: [...item.imageUrls],
    sizeStocks: item.sizeStocks.map((entry) => ({ ...entry }))
  }));
  let sizes = product.sizes.map((item) => ({ ...item }));

  if (colors.length > 0 && sizes.length > 0) {
    colors = colors.map((item) => {
      if (item.name !== color) return item;
      const sizeStocks = item.sizeStocks.map((entry) =>
        entry.name === size ? { ...entry, stockQty: decrementStock(entry.stockQty, quantity) } : entry
      );
      return { ...item, sizeStocks, stockQty: totalSizeStock(sizeStocks) };
    });
  } else if (colors.length > 0) {
    colors = colors.map((item) =>
      item.name === color ? { ...item, stockQty: decrementStock(item.stockQty, quantity) } : item
    );
  } else if (sizes.length > 0) {
    sizes = sizes.map((item) =>
      item.name === size ? { ...item, stockQty: decrementStock(item.stockQty, quantity) } : item
    );
  } else {
    return { colors, sizes, stockQty: decrementStock(product.stockQty, quantity) };
  }

  return { colors, sizes, stockQty: totalUnits({ colors, sizes, stockQty: 0 }) };
}

export function applySet(
  product: Pick<Product, 'stockQty' | 'colors' | 'sizes'>,
  quantity: number,
  color?: string | null,
  size?: string | null
): { colors: ProductColor[]; sizes: ProductSize[]; stockQty: number } | null {
  if (!Number.isFinite(quantity) || quantity < 0) return null;
  const qty = Math.floor(quantity);
  const colors = product.colors.map((item) => ({
    ...item,
    imageUrls: [...item.imageUrls],
    sizeStocks: item.sizeStocks.map((entry) => ({ ...entry }))
  }));
  const sizes = product.sizes.map((item) => ({ ...item }));

  if (colors.length > 0 && sizes.length > 0) {
    const match = colors.find((item) => item.name === color);
    const cell = match?.sizeStocks.find((entry) => entry.name === size);
    if (!match || !cell) return null;
    const next = colors.map((item) => {
      if (item.name !== color) return item;
      const sizeStocks = item.sizeStocks.map((entry) => (entry.name === size ? { ...entry, stockQty: qty } : entry));
      return { ...item, sizeStocks, stockQty: totalSizeStock(sizeStocks) };
    });
    return { colors: next, sizes, stockQty: totalUnits({ colors: next, sizes, stockQty: 0 }) };
  }
  if (colors.length > 0) {
    if (!colors.some((item) => item.name === color)) return null;
    const next = colors.map((item) => (item.name === color ? { ...item, stockQty: qty } : item));
    return { colors: next, sizes, stockQty: totalUnits({ colors: next, sizes, stockQty: 0 }) };
  }
  if (sizes.length > 0) {
    if (!sizes.some((item) => item.name === size)) return null;
    const next = sizes.map((item) => (item.name === size ? { ...item, stockQty: qty } : item));
    return { colors, sizes: next, stockQty: totalUnits({ colors, sizes: next, stockQty: 0 }) };
  }
  return { colors, sizes, stockQty: qty };
}

/** Adds a delivery onto one stock cell. Zero or negative is ignored. */
export function applyReceive(
  product: Pick<Product, 'stockQty' | 'colors' | 'sizes'>,
  delta: number,
  color?: string | null,
  size?: string | null
): { colors: ProductColor[]; sizes: ProductSize[]; stockQty: number } | null {
  if (!Number.isFinite(delta) || delta <= 0) return null;
  return applySet(product, stockFor(product, color, size) + Math.floor(delta), color, size);
}

export function variantLabel(name: string, color?: string | null, size?: string | null): string {
  const parts = [name];
  if (color) parts.push(color);
  if (size) parts.push(size);
  return parts.join(' · ');
}

export function productFromRow(row: ProductRow): Product {
  const colors = parseColors(row.variants);
  const sizes = parseSizes(row.sizes);
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    priceCents: row.price_cents,
    currency: row.currency,
    category: row.category,
    imageUrls: row.image_urls,
    stockQty: totalUnits({ colors, sizes, stockQty: row.stock_qty }),
    lowStockThreshold: row.low_stock_threshold,
    offerEnabled: row.offer_enabled,
    active: row.active,
    sku: parseSku(row.sku),
    colors,
    sizes
  };
}

export function toProductSummary(product: Product, availableQty = product.stockQty): ProductSummary {
  return {
    id: product.id,
    name: product.name,
    priceCents: product.priceCents,
    currency: product.currency,
    category: product.category,
    imageUrl: product.imageUrls[0] ?? null,
    lowStock: isLowStock(availableQty, product.lowStockThreshold),
    remainingQty: isLowStock(availableQty, product.lowStockThreshold) ? availableQty : null,
    offerEnabled: product.offerEnabled,
    colors: product.colors.map((color) => ({ name: color.name, hex: color.hex })),
    sizes: product.sizes.map((size) => ({ name: size.name }))
  };
}

export function formatPrice(priceCents: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(priceCents / 100);
}
