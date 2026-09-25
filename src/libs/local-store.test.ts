import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LocalStore } from './local-store';

const shipping = {
  fullName: 'Ada Lovelace',
  phone: '+2348000000000',
  line1: '1 Computer Lane',
  line2: null,
  city: 'Lagos',
  postcode: '100001',
  country: 'Nigeria'
};

describe('LocalStore', () => {
  it('seeds sample products when empty', async () => {
    const store = new LocalStore({ persistPath: null });
    const products = await store.listActiveProducts();
    expect(products.map((product) => product.name)).toEqual([
      'Wireless Earbuds',
      'Mini Bluetooth Speaker',
      'Braided Charging Cable',
      'Linen Throw',
      'Everyday Shorts'
    ]);
  });

  it('filters the catalog by category', async () => {
    const store = new LocalStore({ persistPath: null, seed: true });
    const home = await store.listActiveProducts('home');
    expect(home).toHaveLength(1);
    expect(home[0].name).toBe('Linen Throw');
  });

  it('records an offer against an offer-enabled product', async () => {
    const store = new LocalStore({ persistPath: null });
    const earbuds = (await store.listActiveProducts('tech')).find((row) => row.offer_enabled);
    expect(earbuds).toBeTruthy();
    expect(await store.isOfferEnabledProduct(earbuds!.id)).toBe(true);

    await store.createOffer({
      productId: earbuds!.id,
      customerEmail: 'shopper@example.com',
      offerPriceCents: 4000
    });

    const pending = await store.listPendingOffers();
    expect(pending).toHaveLength(1);
    expect(pending[0].product_name).toBe('Wireless Earbuds');
    expect(pending[0].product_price_cents).toBe(earbuds!.price_cents);
    expect(pending[0].offer_price_cents).toBe(4000);
  });

  it('checks out on card, decrements stock, and waits for logistics handoff', async () => {
    const store = new LocalStore({ persistPath: null });
    const shorts = (await store.listActiveProducts('fashion'))[0];
    const startingStock = shorts.stock_qty;

    const orderId = await store.createPendingOrder({
      customerEmail: 'ada@example.com',
      shippingAddress: shipping,
      items: [
        {
          productId: shorts.id,
          productName: shorts.name,
          quantity: 2,
          unitPriceCents: shorts.price_cents
        }
      ],
      totalCents: shorts.price_cents * 2
    });
    expect((await store.getPendingOrder(orderId))?.id).toBe(orderId);
    await store.markOrderPaid(orderId);
    await store.decrementProductStock(shorts.id, 2);

    const updated = await store.getActiveProduct(shorts.id);
    expect(updated?.stock_qty).toBe(startingStock - 2);

    const orders = await store.listOrders();
    expect(orders[0].id).toBe(orderId);
    expect(orders[0].payment_status).toBe('paid');
    expect(orders[0].logistics_status).toBe('awaiting_partner');
    expect(await store.getPendingOrder(orderId)).toBeNull();

    await store.markHandedToLogistics(orderId);
    expect((await store.listOrders())[0].logistics_status).toBe('handed_off');
  });

  it('persists to disk so a new instance sees the same data', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'elboon-store-'));
    const persistPath = join(dir, 'dev-store.json');

    const first = new LocalStore({ persistPath, seed: false });
    await first.createProduct({
      name: 'Desk Lamp',
      description: 'A lamp',
      priceCents: 1999,
      category: 'home',
      stockQty: 5,
      lowStockThreshold: 1,
      offerEnabled: false
    });

    const saved = JSON.parse(readFileSync(persistPath, 'utf8')) as { products: { name: string }[] };
    expect(saved.products.map((product) => product.name)).toContain('Desk Lamp');

    const second = new LocalStore({ persistPath, seed: false });
    const products = await second.listAllProducts();
    expect(products.map((product) => product.name)).toEqual(['Desk Lamp']);
  });

  it('attaches guest offers to a new account with the same email', async () => {
    const store = new LocalStore({ persistPath: null });
    const earbuds = (await store.listActiveProducts('tech')).find((row) => row.offer_enabled)!;
    await store.createOffer({
      productId: earbuds.id,
      customerEmail: 'back@example.com',
      offerPriceCents: 4000
    });

    const customer = await store.createCustomer({
      email: 'back@example.com',
      passwordHash: 'hash',
      fullName: 'Bea'
    });
    await store.attachOffersToUser('back@example.com', customer.id);

    const offers = await store.listOffersForUser(customer.id);
    expect(offers).toHaveLength(1);
    expect(offers[0].user_id).toBe(customer.id);
  });
});
