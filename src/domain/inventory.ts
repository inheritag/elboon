import { isLowStock } from './stock';
import { stockFor, type Product } from './product';

/** Unpaid checkouts hold units for this long, then they free up again. */
export const CHECKOUT_HOLD_MS = 60 * 60 * 1000;

export interface HeldUnit {
  productId: string;
  color: string | null;
  size: string | null;
  quantity: number;
  createdAt: string;
}

export interface InventoryLine {
  productId: string;
  productName: string;
  listed: boolean;
  color: string | null;
  size: string | null;
  sku: string | null;
  onHand: number;
  held: number;
  available: number;
  priceCents: number;
  currency: string;
  lowStockThreshold: number;
  low: boolean;
  out: boolean;
}

export function variantKey(productId: string, color?: string | null, size?: string | null): string {
  return `${productId}\0${color ?? ''}\0${size ?? ''}`;
}

export function heldMap(
  holds: HeldUnit[],
  now = Date.now(),
  windowMs = CHECKOUT_HOLD_MS
): Map<string, number> {
  const map = new Map<string, number>();
  for (const hold of holds) {
    const at = Date.parse(hold.createdAt);
    if (!Number.isFinite(at) || now - at > windowMs) continue;
    if (hold.quantity <= 0) continue;
    const key = variantKey(hold.productId, hold.color, hold.size);
    map.set(key, (map.get(key) ?? 0) + hold.quantity);
  }
  return map;
}

export function heldFor(
  held: Map<string, number>,
  productId: string,
  color?: string | null,
  size?: string | null
): number {
  return held.get(variantKey(productId, color, size)) ?? 0;
}

export function availableFor(
  product: Pick<Product, 'id' | 'stockQty' | 'colors' | 'sizes'>,
  held: Map<string, number>,
  color?: string | null,
  size?: string | null
): number {
  return Math.max(0, stockFor(product, color, size) - heldFor(held, product.id, color, size));
}

function line(
  product: Product,
  held: Map<string, number>,
  color: string | null,
  size: string | null,
  sku: string | null,
  onHand: number
): InventoryLine {
  const heldQty = heldFor(held, product.id, color, size);
  const available = Math.max(0, onHand - heldQty);
  return {
    productId: product.id,
    productName: product.name,
    listed: product.active,
    color,
    size,
    sku,
    onHand,
    held: heldQty,
    available,
    priceCents: product.priceCents,
    currency: product.currency,
    lowStockThreshold: product.lowStockThreshold,
    low: isLowStock(available, product.lowStockThreshold),
    out: available <= 0
  };
}

export function linesForProduct(product: Product, held: Map<string, number> = new Map()): InventoryLine[] {
  if (product.colors.length > 0 && product.sizes.length > 0) {
    return product.colors.flatMap((color) =>
      product.sizes.map((size) => {
        const cell = color.sizeStocks.find((entry) => entry.name === size.name);
        return line(product, held, color.name, size.name, cell?.sku ?? null, cell?.stockQty ?? 0);
      })
    );
  }
  if (product.colors.length > 0) {
    return product.colors.map((color) => line(product, held, color.name, null, color.sku, color.stockQty));
  }
  if (product.sizes.length > 0) {
    return product.sizes.map((size) => line(product, held, null, size.name, size.sku, size.stockQty));
  }
  return [line(product, held, null, null, product.sku, product.stockQty)];
}

export function inventoryLines(products: Product[], held: Map<string, number> = new Map()): InventoryLine[] {
  return products.flatMap((product) => linesForProduct(product, held));
}

export function totalAvailable(product: Product, held: Map<string, number> = new Map()): number {
  return linesForProduct(product, held).reduce((sum, row) => sum + row.available, 0);
}

export function lowStockLines(products: Product[], held: Map<string, number> = new Map()): InventoryLine[] {
  return inventoryLines(products, held)
    .filter((row) => row.listed && row.low)
    .sort((a, b) => a.available - b.available || a.productName.localeCompare(b.productName));
}

export interface ProductStockView {
  onHand: number;
  held: number;
  available: number;
  low: boolean;
  out: boolean;
  skus: string[];
}

/** Product totals for the catalogue table: free units, not units sitting in unpaid checkouts. */
export function stockView(product: Product, held: Map<string, number> = new Map()): ProductStockView {
  const lines = linesForProduct(product, held);
  const skus = lines.map((row) => row.sku).filter((sku): sku is string => !!sku);
  return {
    onHand: lines.reduce((sum, row) => sum + row.onHand, 0),
    held: lines.reduce((sum, row) => sum + row.held, 0),
    available: lines.reduce((sum, row) => sum + row.available, 0),
    low: lines.some((row) => row.listed && row.low),
    out: lines.length > 0 && lines.every((row) => row.out),
    skus
  };
}
