import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { OfferStatus } from '../domain/offer';
import type { LogisticsStatus, OrderItem, PaymentStatus, ShippingAddress } from '../domain/order';
import type { ProductRow } from '../domain/product';
import { decrementStock } from '../domain/stock';
import type {
  CreateProductInput,
  CustomerPublic,
  DevEmail,
  OfferListRow,
  OrderSummaryRow,
  PendingOrder,
  Store
} from './store';

interface LocalProduct extends ProductRow {
  created_at: string;
}

interface LocalOffer {
  id: string;
  product_id: string;
  customer_email: string;
  user_id: string | null;
  offer_price_cents: number;
  status: OfferStatus;
  counter_price_cents: number | null;
  created_at: string;
  updated_at: string;
}

interface LocalCustomer {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  phone: string;
  shipping_address: ShippingAddress | null;
  created_at: string;
}

interface LocalOrder {
  id: string;
  customer_email: string;
  user_id: string | null;
  shipping_address: ShippingAddress;
  items: OrderItem[];
  total_cents: number;
  payment_status: PaymentStatus;
  logistics_status: LogisticsStatus;
  created_at: string;
}

interface Snapshot {
  products: LocalProduct[];
  offers: LocalOffer[];
  orders: LocalOrder[];
  customers: LocalCustomer[];
  emails: DevEmail[];
}

const SEED_PRODUCTS: LocalProduct[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Wireless Earbuds',
    description:
      'Compact Bluetooth earbuds with a charging case. Clear calls, all-day battery, and a fit that stays put.',
    price_cents: 4999,
    currency: 'GBP',
    category: 'tech',
    image_urls: ['/products/earbuds.jpg', '/products/earbuds-side.jpg', '/products/earbuds-out.jpg'],
    stock_qty: 12,
    low_stock_threshold: 3,
    offer_enabled: true,
    active: true,
    created_at: '2026-01-05T00:00:00.000Z'
  },
  {
    id: '55555555-5555-4555-8555-555555555555',
    name: 'Mini Bluetooth Speaker',
    description: 'Pocket speaker with a surprisingly full sound. USB-C charging, twelve-hour battery.',
    price_cents: 3900,
    currency: 'GBP',
    category: 'tech',
    image_urls: ['/products/speaker.jpg', '/products/speaker-side.jpg'],
    stock_qty: 8,
    low_stock_threshold: 3,
    offer_enabled: false,
    active: true,
    created_at: '2026-01-04T00:00:00.000Z'
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    name: 'Braided Charging Cable',
    description: 'A tough USB-C cable that will not tangle in a bag. Complementary pick for any gadget.',
    price_cents: 1200,
    currency: 'GBP',
    category: 'accessories',
    image_urls: ['/products/cable.jpg'],
    stock_qty: 40,
    low_stock_threshold: 5,
    offer_enabled: false,
    active: true,
    created_at: '2026-01-03T00:00:00.000Z'
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Linen Throw',
    description: 'Soft washable throw for the sofa or bed. Neutral oatmeal that sits with any room.',
    price_cents: 3500,
    currency: 'GBP',
    category: 'home',
    image_urls: ['/products/throw.jpg', '/products/throw-drape.jpg'],
    stock_qty: 2,
    low_stock_threshold: 3,
    offer_enabled: false,
    active: true,
    created_at: '2026-01-02T00:00:00.000Z'
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'Everyday Shorts',
    description: 'Lightweight cotton shorts for warm days. Elastic waist, deep pockets.',
    price_cents: 2800,
    currency: 'GBP',
    category: 'fashion',
    image_urls: ['/products/shorts.jpg', '/products/shorts-back.jpg'],
    stock_qty: 20,
    low_stock_threshold: 3,
    offer_enabled: false,
    active: true,
    created_at: '2026-01-01T00:00:00.000Z'
  }
];

function emptySnapshot(): Snapshot {
  return { products: [], offers: [], orders: [], customers: [], emails: [] };
}

function newestFirst(a: { created_at: string }, b: { created_at: string }): number {
  return b.created_at.localeCompare(a.created_at);
}

export class LocalStore implements Store {
  private readonly persistPath: string | null;
  private data: Snapshot;

  constructor(options: { persistPath: string | null; seed?: boolean }) {
    this.persistPath = options.persistPath ? resolve(options.persistPath) : null;
    this.data = this.loadOrCreate(options.seed !== false);
  }

  private loadOrCreate(seed: boolean): Snapshot {
    if (this.persistPath && existsSync(this.persistPath)) {
      return this.migrate(JSON.parse(readFileSync(this.persistPath, 'utf8')));
    }

    const snapshot = emptySnapshot();
    if (seed) snapshot.products = SEED_PRODUCTS.map((product) => ({ ...product, image_urls: [...product.image_urls] }));
    this.data = snapshot;
    this.persist();
    return snapshot;
  }

  private migrate(raw: Snapshot & { checkoutSessions?: unknown }): Snapshot {
    return {
      products: raw.products ?? [],
      customers: raw.customers ?? [],
      offers: (raw.offers ?? []).map((offer) => ({
        ...offer,
        user_id: offer.user_id ?? null,
        status: (offer.status as string) === 'rejected' ? 'ignored' : offer.status
      })),
      orders: (raw.orders ?? []).map((order) => ({
        ...order,
        user_id: order.user_id ?? null,
        shipping_address: {
          ...order.shipping_address,
          phone: order.shipping_address.phone ?? ''
        },
        logistics_status: order.logistics_status ?? 'awaiting_partner'
      })),
      emails: raw.emails ?? []
    };
  }

  private persist(): void {
    if (!this.persistPath) return;
    mkdirSync(dirname(this.persistPath), { recursive: true });
    const tmp = `${this.persistPath}.${process.pid}.tmp`;
    writeFileSync(tmp, JSON.stringify(this.data, null, 2));
    renameSync(tmp, this.persistPath);
  }

  private productName(productId: string): string {
    return this.data.products.find((product) => product.id === productId)?.name ?? 'Unknown product';
  }

  private productPrice(productId: string): number {
    return this.data.products.find((product) => product.id === productId)?.price_cents ?? 0;
  }

  async listActiveProducts(category?: string | null): Promise<ProductRow[]> {
    return this.data.products
      .filter((product) => product.active && (!category || product.category === category))
      .sort(newestFirst);
  }

  async getActiveProduct(id: string): Promise<ProductRow | null> {
    return this.data.products.find((product) => product.id === id && product.active) ?? null;
  }

  async getProduct(id: string): Promise<ProductRow | null> {
    return this.data.products.find((product) => product.id === id) ?? null;
  }

  async listAllProducts(): Promise<ProductRow[]> {
    return [...this.data.products].sort(newestFirst);
  }

  async createProduct(input: CreateProductInput): Promise<void> {
    this.data.products.push({
      id: randomUUID(),
      name: input.name,
      description: input.description,
      price_cents: input.priceCents,
      currency: 'GBP',
      category: input.category,
      image_urls: input.imageUrls ?? [],
      stock_qty: input.stockQty,
      low_stock_threshold: input.lowStockThreshold,
      offer_enabled: input.offerEnabled,
      active: input.active ?? true,
      created_at: new Date().toISOString()
    });
    this.persist();
  }

  async updateProduct(id: string, input: CreateProductInput): Promise<void> {
    const product = this.data.products.find((row) => row.id === id);
    if (!product) return;
    product.name = input.name;
    product.description = input.description;
    product.price_cents = input.priceCents;
    product.category = input.category;
    product.stock_qty = input.stockQty;
    product.low_stock_threshold = input.lowStockThreshold;
    product.offer_enabled = input.offerEnabled;
    if (input.active !== undefined) product.active = input.active;
    if (input.imageUrls !== undefined) {
      product.image_urls = input.imageUrls;
    }
    this.persist();
  }

  async deleteProduct(id: string): Promise<void> {
    this.data.products = this.data.products.filter((product) => product.id !== id);
    this.persist();
  }

  async toggleProductActive(id: string): Promise<void> {
    const product = this.data.products.find((row) => row.id === id);
    if (!product) return;
    product.active = !product.active;
    this.persist();
  }

  async decrementProductStock(id: string, quantity: number): Promise<void> {
    const product = this.data.products.find((row) => row.id === id);
    const currentStock = product?.stock_qty ?? 0;
    const remaining = decrementStock(currentStock, quantity);
    if (product) product.stock_qty = remaining;
    this.persist();
  }

  async isOfferEnabledProduct(id: string): Promise<boolean> {
    return this.data.products.some((product) => product.id === id && product.active && product.offer_enabled);
  }

  async createOffer(input: {
    productId: string;
    customerEmail: string;
    offerPriceCents: number;
    userId?: string | null;
  }): Promise<void> {
    const now = new Date().toISOString();
    this.data.offers.push({
      id: randomUUID(),
      product_id: input.productId,
      customer_email: input.customerEmail.toLowerCase(),
      user_id: input.userId ?? null,
      offer_price_cents: input.offerPriceCents,
      status: 'pending',
      counter_price_cents: null,
      created_at: now,
      updated_at: now
    });
    this.persist();
  }

  async listOffersForUser(userId: string): Promise<OfferListRow[]> {
    return this.data.offers
      .filter((offer) => offer.user_id === userId)
      .sort(newestFirst)
      .map((offer) => this.toOfferListRow(offer));
  }

  async listPendingOffers(): Promise<OfferListRow[]> {
    return this.data.offers
      .filter((offer) => offer.status === 'pending')
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((offer) => this.toOfferListRow(offer));
  }

  async getOfferWithProduct(id: string): Promise<OfferListRow | null> {
    const offer = this.data.offers.find((row) => row.id === id);
    return offer ? this.toOfferListRow(offer) : null;
  }

  async updateOffer(id: string, offer: { status: OfferStatus; counterPriceCents: number | null }): Promise<void> {
    const row = this.data.offers.find((item) => item.id === id);
    if (!row) return;
    row.status = offer.status;
    row.counter_price_cents = offer.counterPriceCents;
    row.updated_at = new Date().toISOString();
    this.persist();
  }

  async createCustomer(input: { email: string; passwordHash: string; fullName?: string }): Promise<CustomerPublic> {
    const email = input.email.toLowerCase().trim();
    if (this.data.customers.some((row) => row.email === email)) {
      throw new Error('An account with that email already exists');
    }
    const customer: LocalCustomer = {
      id: randomUUID(),
      email,
      password_hash: input.passwordHash,
      full_name: input.fullName?.trim() ?? '',
      phone: '',
      shipping_address: null,
      created_at: new Date().toISOString()
    };
    this.data.customers.push(customer);
    this.persist();
    return this.toCustomerPublic(customer);
  }

  async getCustomer(id: string): Promise<CustomerPublic | null> {
    const customer = this.data.customers.find((row) => row.id === id);
    return customer ? this.toCustomerPublic(customer) : null;
  }

  async getCustomerByEmail(email: string): Promise<(CustomerPublic & { passwordHash: string }) | null> {
    const customer = this.data.customers.find((row) => row.email === email.toLowerCase().trim());
    if (!customer) return null;
    return { ...this.toCustomerPublic(customer), passwordHash: customer.password_hash };
  }

  async updateCustomerShipping(id: string, shipping: ShippingAddress): Promise<void> {
    const customer = this.data.customers.find((row) => row.id === id);
    if (!customer) return;
    customer.full_name = shipping.fullName;
    customer.phone = shipping.phone;
    customer.shipping_address = shipping;
    this.persist();
  }

  async attachOffersToUser(email: string, userId: string): Promise<void> {
    const normalised = email.toLowerCase().trim();
    for (const offer of this.data.offers) {
      if (offer.customer_email === normalised && !offer.user_id) {
        offer.user_id = userId;
      }
    }
    this.persist();
  }

  async createPendingOrder(input: {
    customerEmail: string;
    userId?: string | null;
    shippingAddress: ShippingAddress;
    items: OrderItem[];
    totalCents: number;
  }): Promise<string> {
    const id = randomUUID();
    this.data.orders.push({
      id,
      customer_email: input.customerEmail,
      user_id: input.userId ?? null,
      shipping_address: input.shippingAddress,
      items: input.items,
      total_cents: input.totalCents,
      payment_status: 'pending',
      logistics_status: 'awaiting_partner',
      created_at: new Date().toISOString()
    });
    this.persist();
    return id;
  }

  async getPendingOrder(orderId: string): Promise<PendingOrder | null> {
    const order = this.data.orders.find((row) => row.id === orderId && row.payment_status === 'pending');
    if (!order) return null;
    return {
      id: order.id,
      customer_email: order.customer_email,
      items: order.items,
      total_cents: order.total_cents
    };
  }

  async markOrderPaid(orderId: string): Promise<void> {
    const order = this.data.orders.find((row) => row.id === orderId);
    if (!order) return;
    order.payment_status = 'paid';
    this.persist();
  }

  async markHandedToLogistics(orderId: string): Promise<void> {
    const order = this.data.orders.find((row) => row.id === orderId);
    if (!order) return;
    order.logistics_status = 'handed_off';
    this.persist();
  }

  async listOrders(): Promise<OrderSummaryRow[]> {
    return [...this.data.orders].sort(newestFirst).map((order) => ({
      id: order.id,
      customer_email: order.customer_email,
      shipping_address: order.shipping_address,
      items: order.items,
      total_cents: order.total_cents,
      payment_status: order.payment_status,
      logistics_status: order.logistics_status,
      created_at: order.created_at
    }));
  }

  async recordEmail(email: Omit<DevEmail, 'id' | 'sentAt'>): Promise<void> {
    this.data.emails.push({
      id: randomUUID(),
      sentAt: new Date().toISOString(),
      ...email
    });
    this.persist();
  }

  async listEmails(): Promise<DevEmail[]> {
    return [...this.data.emails].sort((a, b) => b.sentAt.localeCompare(a.sentAt));
  }

  private toOfferListRow(offer: LocalOffer): OfferListRow {
    return {
      id: offer.id,
      product_id: offer.product_id,
      product_name: this.productName(offer.product_id),
      product_price_cents: this.productPrice(offer.product_id),
      customer_email: offer.customer_email,
      user_id: offer.user_id,
      offer_price_cents: offer.offer_price_cents,
      status: offer.status,
      counter_price_cents: offer.counter_price_cents
    };
  }

  private toCustomerPublic(customer: LocalCustomer): CustomerPublic {
    return {
      id: customer.id,
      email: customer.email,
      fullName: customer.full_name,
      phone: customer.phone,
      shippingAddress: customer.shipping_address
    };
  }
}
