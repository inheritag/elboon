export function isLowStock(stockQty: number, lowStockThreshold: number): boolean {
  return stockQty <= lowStockThreshold;
}

export function decrementStock(stockQty: number, quantityOrdered: number): number {
  const remaining = stockQty - quantityOrdered;
  if (remaining < 0) {
    throw new Error(`Cannot fulfil order: only ${stockQty} in stock, ${quantityOrdered} requested`);
  }
  return remaining;
}

export function isShortStock(err: unknown): boolean {
  return err instanceof Error && err.message.startsWith('Cannot fulfil order');
}
