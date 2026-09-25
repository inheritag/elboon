import { isLowStock } from './stock';

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
}

export function productFromRow(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    priceCents: row.price_cents,
    currency: row.currency,
    category: row.category,
    imageUrls: row.image_urls,
    stockQty: row.stock_qty,
    lowStockThreshold: row.low_stock_threshold,
    offerEnabled: row.offer_enabled,
    active: row.active
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
    offerEnabled: product.offerEnabled
  };
}

export function formatPrice(priceCents: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(priceCents / 100);
}
