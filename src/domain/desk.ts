import { totalAvailable } from './inventory';
import { productFromRow, type ProductRow } from './product';

export const SHOP_TIME_ZONE = 'Europe/London';
/** How far back the desk lists days that had a sale. Today is always shown. */
export const SOLD_DAY_LOOKBACK = 30;

export interface OrderSaleRow {
  payment_status: string;
  total_cents: number;
  created_at: string;
}

export interface SoldDay {
  day: string;
  label: string;
  cents: number;
}

export interface DeskFigures {
  listingCount: number;
  unitCount: number;
  worthCents: number;
  currency: string;
  soldTodayCents: number;
  soldDays: SoldDay[];
}

/** Calendar date (YYYY-MM-DD) in the shop's timezone. */
export function calendarDay(iso: string, timeZone = SHOP_TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date(iso));
  const year = parts.find((part) => part.type === 'year')?.value ?? '0000';
  const month = (parts.find((part) => part.type === 'month')?.value ?? '01').padStart(2, '0');
  const day = (parts.find((part) => part.type === 'day')?.value ?? '01').padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function shiftDay(yyyyMmDd: string, delta: number): string {
  const [year, month, day] = yyyyMmDd.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + delta));
  return shifted.toISOString().slice(0, 10);
}

function dayOnOrAfter(day: string, start: string): boolean {
  return day >= start;
}

function dayLabel(yyyyMmDd: string, today: string): string {
  if (yyyyMmDd === today) return 'Today';
  const [year, month, day] = yyyyMmDd.split('-').map(Number);
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(
    new Date(Date.UTC(year, month - 1, day))
  );
}

/** Active listings only: how many, remaining sellable units, and those units × listed price. */
export function listedInventory(products: ProductRow[], held: Map<string, number> = new Map()): {
  listingCount: number;
  unitCount: number;
  worthCents: number;
  currency: string;
} {
  const listed = products.filter((product) => product.active).map(productFromRow);
  return {
    listingCount: listed.length,
    unitCount: listed.reduce((sum, product) => sum + totalAvailable(product, held), 0),
    worthCents: listed.reduce((sum, product) => sum + totalAvailable(product, held) * product.priceCents, 0),
    currency: listed[0]?.currency ?? 'GBP'
  };
}

/** Paid order totals grouped by shop calendar day. Pending / failed sales are ignored. */
export function soldPerDay(
  orders: OrderSaleRow[],
  options: { now?: Date; timeZone?: string; days?: number } = {}
): { soldTodayCents: number; soldDays: SoldDay[] } {
  const timeZone = options.timeZone ?? SHOP_TIME_ZONE;
  const now = options.now ?? new Date();
  const days = options.days ?? SOLD_DAY_LOOKBACK;
  const today = calendarDay(now.toISOString(), timeZone);
  const start = shiftDay(today, -(days - 1));

  const byDay = new Map<string, number>();
  for (const order of orders) {
    if (order.payment_status !== 'paid') continue;
    const day = calendarDay(order.created_at, timeZone);
    byDay.set(day, (byDay.get(day) ?? 0) + order.total_cents);
  }

  const soldDays: SoldDay[] = [
    { day: today, label: dayLabel(today, today), cents: byDay.get(today) ?? 0 }
  ];
  const earlier = [...byDay.keys()]
    .filter((day) => day !== today && dayOnOrAfter(day, start))
    .sort((a, b) => b.localeCompare(a));
  for (const day of earlier) {
    soldDays.push({ day, label: dayLabel(day, today), cents: byDay.get(day) ?? 0 });
  }

  return { soldTodayCents: byDay.get(today) ?? 0, soldDays };
}

export function deskFigures(
  products: ProductRow[],
  orders: OrderSaleRow[],
  now = new Date(),
  held: Map<string, number> = new Map()
): DeskFigures {
  const listed = listedInventory(products, held);
  const sold = soldPerDay(orders, { now });
  return { ...listed, ...sold };
}
