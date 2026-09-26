import type { CategoryRecord } from '../domain/catalog';
import type { OfferStatus } from '../domain/offer';
import type { LogisticsStatus, OrderItem, PaymentStatus, ShippingAddress } from '../domain/order';
import type { ProductColor, ProductRow } from '../domain/product';
import { config } from './config';
import { LocalStore } from './local-store';
import { PostgresStore } from './postgres-store';

export interface CreateProductInput {
  name: string;
  description: string;
  priceCents: number;
  category: string;
  stockQty: number;
  lowStockThreshold: number;
  offerEnabled: boolean;
  active?: boolean;
  imageUrls?: string[];
  colors?: ProductColor[];
}

export interface DevEmail {
  id: string;
  to: string;
  subject: string;
  html: string;
  sentAt: string;
}

export interface CustomerPublic {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  shippingAddress: ShippingAddress | null;
}

export interface OfferListRow {
  id: string;
  product_id: string;
  product_name: string;
  product_price_cents: number;
  customer_email: string;
  user_id: string | null;
  offer_price_cents: number;
  status: OfferStatus;
  counter_price_cents: number | null;
}

export interface OrderSummaryRow {
  id: string;
  customer_email: string;
  shipping_address: ShippingAddress;
  items: OrderItem[];
  total_cents: number;
  payment_status: PaymentStatus;
  logistics_status: LogisticsStatus;
  created_at: string;
}

export interface PendingOrder {
  id: string;
  customer_email: string;
  items: OrderItem[];
  total_cents: number;
}

export interface Store {
  listActiveProducts(category?: string | null): Promise<ProductRow[]>;
  getActiveProduct(id: string): Promise<ProductRow | null>;
  getProduct(id: string): Promise<ProductRow | null>;
  listAllProducts(): Promise<ProductRow[]>;
  createProduct(input: CreateProductInput): Promise<void>;
  updateProduct(id: string, input: CreateProductInput): Promise<void>;
  deleteProduct(id: string): Promise<void>;
  toggleProductActive(id: string): Promise<void>;
  decrementProductStock(id: string, quantity: number, color?: string | null): Promise<void>;
  listCategories(): Promise<CategoryRecord[]>;
  createCategory(label: string): Promise<CategoryRecord>;

  isOfferEnabledProduct(id: string): Promise<boolean>;
  createOffer(input: {
    productId: string;
    customerEmail: string;
    offerPriceCents: number;
    userId?: string | null;
  }): Promise<void>;
  listPendingOffers(): Promise<OfferListRow[]>;
  listOffersForUser(userId: string): Promise<OfferListRow[]>;
  getOfferWithProduct(id: string): Promise<OfferListRow | null>;
  updateOffer(id: string, offer: { status: OfferStatus; counterPriceCents: number | null }): Promise<void>;

  createCustomer(input: { email: string; passwordHash: string; fullName?: string }): Promise<CustomerPublic>;
  getCustomer(id: string): Promise<CustomerPublic | null>;
  getCustomerByEmail(email: string): Promise<(CustomerPublic & { passwordHash: string }) | null>;
  updateCustomerShipping(id: string, shipping: ShippingAddress): Promise<void>;
  attachOffersToUser(email: string, userId: string): Promise<void>;

  createPendingOrder(input: {
    customerEmail: string;
    userId?: string | null;
    shippingAddress: ShippingAddress;
    items: OrderItem[];
    totalCents: number;
  }): Promise<string>;
  getPendingOrder(orderId: string): Promise<PendingOrder | null>;
  markOrderPaid(orderId: string): Promise<void>;
  markHandedToLogistics(orderId: string): Promise<void>;
  listOrders(): Promise<OrderSummaryRow[]>;
}

let store: Store | null = null;

export function getStore(): Store {
  if (!store) {
    store = config.isDevMode()
      ? new LocalStore({
          persistPath: config.devStore() === 'disk' ? config.devStorePath() : null
        })
      : new PostgresStore();
  }
  return store;
}

export function getLocalStore(): LocalStore {
  const current = getStore();
  if (!(current instanceof LocalStore)) {
    throw new Error('Local store is only available when DEV_MODE=true');
  }
  return current;
}
