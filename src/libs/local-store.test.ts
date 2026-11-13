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
    await store.decrementProductStock(shorts.id, 2, null, 'M');

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

  it('keeps a booked parcel on the desk until there is a tracking number', async () => {
    const store = new LocalStore({ persistPath: null });
    const orderId = await store.createPendingOrder({
      customerEmail: 'ada@example.com',
      shippingAddress: shipping,
      items: [],
      totalCents: 1200
    });
    await store.recordShipment(orderId, { carrierRef: '55', trackingNumber: null });
    expect((await store.getOrder(orderId))?.logistics_status).toBe('awaiting_partner');
    await store.recordShipment(orderId, { carrierRef: '55', trackingNumber: 'AB123456789GB' });
    const booked = await store.getOrder(orderId);
    expect(booked?.tracking_number).toBe('AB123456789GB');
    expect(booked?.logistics_status).toBe('handed_off');
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

  it('adds a shopper category and lists it', async () => {
    const store = new LocalStore({ persistPath: null });
    const created = await store.createCategory('Kitchen');
    expect(created.slug).toBe('kitchen');
    const listed = await store.listCategories();
    expect(listed.some((category) => category.slug === 'kitchen')).toBe(true);
  });

  it('sets stock on a size line without touching the others', async () => {
    const store = new LocalStore({ persistPath: null });
    const shorts = (await store.listActiveProducts('fashion'))[0];
    expect(await store.setProductStock(shorts.id, 11, null, 'M')).toBe(true);
    const updated = await store.getActiveProduct(shorts.id);
    const sizes = (updated?.sizes as { name: string; stockQty: number }[]) ?? [];
    expect(sizes.find((size) => size.name === 'M')?.stockQty).toBe(11);
    expect(sizes.find((size) => size.name === 'S')?.stockQty).toBe(4);
  });

  it('nests a sub-category under a parent when it does not already exist', async () => {
    const store = new LocalStore({ persistPath: null });
    const phones = await store.createCategory('phones', 'tech');
    expect(phones.parentSlug).toBe('tech');
    const samsung = await store.createCategory('samsung', 'phones');
    expect(samsung.parentSlug).toBe('phones');
    const accessories = await store.createCategory('phone accessories', 'phones');
    expect(accessories.slug).toBe('phone-accessories');
    expect(accessories.parentSlug).toBe('phones');
    await expect(store.createCategory('Phones', 'fashion')).rejects.toThrow('That category already exists');
    const phonesAgain = (await store.listCategories()).find((category) => category.slug === 'phones');
    expect(phonesAgain?.parentSlug).toBe('tech');
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

  it('takes stock once, and leaves it alone when a line is short', async () => {
    const store = new LocalStore({ persistPath: null, seed: false });
    await store.createProduct({
      name: 'Mug',
      description: 'A mug',
      priceCents: 800,
      category: 'home',
      stockQty: 5,
      lowStockThreshold: 1,
      offerEnabled: false
    });
    const mug = (await store.listAllProducts())[0];

    const shortId = await store.createPendingOrder({
      customerEmail: 'ada@example.com',
      shippingAddress: shipping,
      items: [
        { productId: mug.id, productName: 'Mug', quantity: 3, unitPriceCents: 800 },
        { productId: mug.id, productName: 'Mug', quantity: 3, unitPriceCents: 800 }
      ],
      totalCents: 4800
    });
    expect(await store.takePaidStock(shortId)).toBe('unpaid');
    await store.markOrderPaid(shortId);
    expect(await store.takePaidStock(shortId)).toBe('short');
    expect((await store.getProduct(mug.id))?.stock_qty).toBe(5);
    expect(await store.takePaidStock(shortId)).toBe('already');
    expect((await store.getProduct(mug.id))?.stock_qty).toBe(5);

    const paidId = await store.createPendingOrder({
      customerEmail: 'ada@example.com',
      shippingAddress: shipping,
      items: [
        { productId: mug.id, productName: 'Mug', quantity: 2, unitPriceCents: 800 },
        { productId: mug.id, productName: 'Mug', quantity: 2, unitPriceCents: 800 }
      ],
      totalCents: 3200
    });
    await store.markOrderPaid(paidId);
    expect(await store.takePaidStock(paidId)).toBe('taken');
    expect((await store.getProduct(mug.id))?.stock_qty).toBe(1);
    expect(await store.takePaidStock(paidId)).toBe('already');
    expect((await store.getProduct(mug.id))?.stock_qty).toBe(1);
  });

  it('keeps the old price and judges an offer against the sale price', async () => {
    const store = new LocalStore({ persistPath: null, seed: false });
    await store.createProduct({
      name: 'Mug',
      description: 'A mug',
      priceCents: 1000,
      discountPercent: 20,
      category: 'home',
      stockQty: 2,
      lowStockThreshold: 1,
      offerEnabled: true
    });
    const mug = (await store.listAllProducts())[0];
    expect(mug.price_cents).toBe(1000);
    expect(mug.discount_percent).toBe(20);
    await store.createOffer({ productId: mug.id, customerEmail: 'a@b.co', offerPriceCents: 700 });
    const pending = await store.listPendingOffers();
    expect(pending[0].product_price_cents).toBe(800);
  });

  it('keeps the first Checkout session and sends the confirmation once', async () => {
    const store = new LocalStore({ persistPath: null, seed: false });
    const orderId = await store.createPendingOrder({
      customerEmail: 'ada@example.com',
      shippingAddress: shipping,
      items: [],
      totalCents: 1200
    });
    expect(await store.setStripeSession(orderId, 'cs_first')).toBe('saved');
    expect(await store.setStripeSession(orderId, 'cs_second')).toBe('kept');
    expect((await store.getOrder(orderId))?.stripe_session_id).toBe('cs_first');
    expect(await store.setStripeSession(orderId, 'cs_new', 'cs_first')).toBe('saved');
    expect((await store.getOrder(orderId))?.stripe_session_id).toBe('cs_new');

    expect(await store.claimConfirmation(orderId)).toBe('busy');
    await store.markOrderPaid(orderId);
    expect(await store.claimConfirmation(orderId)).toBe('send');
    expect(await store.claimConfirmation(orderId)).toBe('busy');
    await store.releaseConfirmation(orderId);
    expect(await store.claimConfirmation(orderId)).toBe('send');
    await store.markConfirmationSent(orderId);
    expect(await store.claimConfirmation(orderId)).toBe('sent');
  });
});
