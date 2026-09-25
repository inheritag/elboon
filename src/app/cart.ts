import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface CartLine {
  productId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
  imageUrl?: string | null;
}

const STORAGE_KEY = 'elboon_cart';

function loadFromStorage(): CartLine[] {
  if (!browser) return [];

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  return JSON.parse(raw) as CartLine[];
}

export const cart = writable<CartLine[]>(loadFromStorage());

/** Bumps when an item is added so the header cart can animate. */
export const cartBump = writable(0);

export interface CartFly {
  fromX: number;
  fromY: number;
  nonce: number;
}

export const cartFly = writable<CartFly | null>(null);

if (browser) {
  cart.subscribe((lines) => localStorage.setItem(STORAGE_KEY, JSON.stringify(lines)));
}

export function addToCart(
  line: Omit<CartLine, 'quantity'>,
  quantity = 1,
  origin?: { x: number; y: number }
): void {
  cart.update((lines) => {
    const existing = lines.find((l) => l.productId === line.productId);
    if (existing) {
      return lines.map((l) =>
        l.productId === line.productId
          ? { ...l, quantity: l.quantity + quantity, imageUrl: line.imageUrl ?? l.imageUrl }
          : l
      );
    }
    return [...lines, { ...line, quantity }];
  });
  cartBump.update((n) => n + 1);
  if (origin && browser) {
    cartFly.set({ fromX: origin.x, fromY: origin.y, nonce: Date.now() });
  }
}

export function originFromEvent(event: Event): { x: number; y: number } {
  const node = event.currentTarget as HTMLElement;
  const rect = node.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

export function setCartQuantity(productId: string, quantity: number): void {
  if (quantity < 1) {
    removeFromCart(productId);
    return;
  }
  cart.update((lines) =>
    lines.map((line) => (line.productId === productId ? { ...line, quantity } : line))
  );
}

export function removeFromCart(productId: string): void {
  cart.update((lines) => lines.filter((l) => l.productId !== productId));
}

export function clearCart(): void {
  cart.set([]);
}
