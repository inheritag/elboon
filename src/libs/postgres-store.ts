import { canNestUnder, slugFromLabel, type CategoryRecord } from '../domain/catalog';
import type { OfferStatus } from '../domain/offer';
import type { LogisticsStatus, OrderItem, PaymentStatus, ShippingAddress } from '../domain/order';
import type { HeldUnit } from '../domain/inventory';
import { applySale, applySet, planStockTake, productFromRow, type ProductRow } from '../domain/product';
import { isShortStock } from '../domain/stock';
import { readyDb, toJsonValue } from './db';
import type {
  CreateProductInput,
  CustomerPublic,
  OfferListRow,
  OrderRecord,
  OrderSummaryRow,
  PendingOrder,
  Store
} from './store';

interface CategoryRow {
  slug: string;
  label: string;
  parent_slug: string | null;
}

function asCategory(row: CategoryRow): CategoryRecord {
  return { slug: row.slug, label: row.label, parentSlug: row.parent_slug ?? null };
}

export class PostgresStore implements Store {
  async listActiveProducts(category?: string | null): Promise<ProductRow[]> {
    const sql = await readyDb();
    if (category) {
      return sql<ProductRow[]>`
        SELECT * FROM products WHERE active = true AND category = ${category} ORDER BY created_at DESC
      `;
    }
    return sql<ProductRow[]>`SELECT * FROM products WHERE active = true ORDER BY created_at DESC`;
  }

  async getActiveProduct(id: string): Promise<ProductRow | null> {
    const sql = await readyDb();
    const rows = await sql<ProductRow[]>`SELECT * FROM products WHERE id = ${id} AND active = true`;
    return rows[0] ?? null;
  }

  async getProduct(id: string): Promise<ProductRow | null> {
    const sql = await readyDb();
    const rows = await sql<ProductRow[]>`SELECT * FROM products WHERE id = ${id}`;
    return rows[0] ?? null;
  }

  async listAllProducts(): Promise<ProductRow[]> {
    const sql = await readyDb();
    return sql<ProductRow[]>`SELECT * FROM products ORDER BY created_at DESC`;
  }

  async createProduct(input: CreateProductInput): Promise<void> {
    const sql = await readyDb();
    await sql`
      INSERT INTO products (name, description, price_cents, category, stock_qty, low_stock_threshold, offer_enabled, active, image_urls, variants, sizes, sku)
      VALUES (
        ${input.name},
        ${input.description},
        ${input.priceCents},
        ${input.category},
        ${input.stockQty},
        ${input.lowStockThreshold},
        ${input.offerEnabled},
        ${input.active ?? true},
        ${input.imageUrls ?? []},
        ${sql.json(toJsonValue(input.colors ?? []))},
        ${sql.json(toJsonValue(input.sizes ?? []))},
        ${input.sku ?? null}
      )
    `;
  }

  async updateProduct(id: string, input: CreateProductInput): Promise<void> {
    const sql = await readyDb();
    const imageUrls = input.imageUrls;
    if (imageUrls !== undefined) {
      await sql`
        UPDATE products SET
          name = ${input.name},
          description = ${input.description},
          price_cents = ${input.priceCents},
          category = ${input.category},
          stock_qty = ${input.stockQty},
          low_stock_threshold = ${input.lowStockThreshold},
          offer_enabled = ${input.offerEnabled},
          image_urls = ${imageUrls},
          variants = ${sql.json(toJsonValue(input.colors ?? []))},
          sizes = ${sql.json(toJsonValue(input.sizes ?? []))},
          sku = ${input.sku ?? null}
        WHERE id = ${id}
      `;
      return;
    }

    await sql`
      UPDATE products SET
        name = ${input.name},
        description = ${input.description},
        price_cents = ${input.priceCents},
        category = ${input.category},
        stock_qty = ${input.stockQty},
        low_stock_threshold = ${input.lowStockThreshold},
        offer_enabled = ${input.offerEnabled},
        variants = ${sql.json(toJsonValue(input.colors ?? []))},
        sizes = ${sql.json(toJsonValue(input.sizes ?? []))},
        sku = ${input.sku ?? null}
      WHERE id = ${id}
    `;
  }

  async deleteProduct(id: string): Promise<void> {
    const sql = await readyDb();
    await sql`DELETE FROM products WHERE id = ${id}`;
  }

  async toggleProductActive(id: string): Promise<void> {
    const sql = await readyDb();
    await sql`UPDATE products SET active = NOT active WHERE id = ${id}`;
  }

  async listCategories(): Promise<CategoryRecord[]> {
    const sql = await readyDb();
    const rows = await sql<CategoryRow[]>`SELECT slug, label, parent_slug FROM categories ORDER BY label ASC`;
    return rows.map(asCategory);
  }

  async createCategory(label: string, parentSlug?: string | null): Promise<CategoryRecord> {
    const sql = await readyDb();
    const slug = slugFromLabel(label);
    if (!slug) throw new Error('Enter a category name');
    const parent = parentSlug || null;
    if (parent) {
      const known = await this.listCategories();
      if (!canNestUnder(null, parent, known)) throw new Error('Choose a parent the new category can sit under');
    }
    const rows = await sql<CategoryRow[]>`
      INSERT INTO categories (slug, label, parent_slug) VALUES (${slug}, ${label.trim()}, ${parent})
      ON CONFLICT (slug) DO NOTHING
      RETURNING slug, label, parent_slug
    `;
    if (!rows[0]) throw new Error('That category already exists');
    return asCategory(rows[0]);
  }

  async setProductStock(id: string, quantity: number, color?: string | null, size?: string | null): Promise<boolean> {
    const sql = await readyDb();
    const rows = await sql<ProductRow[]>`SELECT * FROM products WHERE id = ${id}`;
    const product = rows[0];
    if (!product) return false;
    const next = applySet(productFromRow(product), quantity, color, size);
    if (!next) return false;
    await sql`
      UPDATE products SET
        variants = ${sql.json(toJsonValue(next.colors))},
        sizes = ${sql.json(toJsonValue(next.sizes))},
        stock_qty = ${next.stockQty}
      WHERE id = ${id}
    `;
    return true;
  }

  async listHeldUnits(): Promise<HeldUnit[]> {
    const sql = await readyDb();
    const rows = await sql<{ items: OrderItem[]; created_at: Date | string }[]>`
      SELECT items, created_at FROM orders WHERE payment_status = 'pending'
    `;
    return rows.flatMap((row) => {
      const createdAt = row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at);
      return (row.items ?? []).map((item) => ({
        productId: item.productId,
        color: item.color ?? null,
        size: item.size ?? null,
        quantity: item.quantity,
        createdAt
      }));
    });
  }

  async decrementProductStock(id: string, quantity: number, color?: string | null, size?: string | null): Promise<void> {
    const sql = await readyDb();
    const rows = await sql<ProductRow[]>`SELECT * FROM products WHERE id = ${id}`;
    const product = rows[0];
    if (!product) return;
    const next = applySale(productFromRow(product), quantity, color, size);
    await sql`
      UPDATE products SET
        variants = ${sql.json(toJsonValue(next.colors))},
        sizes = ${sql.json(toJsonValue(next.sizes))},
        stock_qty = ${next.stockQty}
      WHERE id = ${id}
    `;
  }

  async isOfferEnabledProduct(id: string): Promise<boolean> {
    const sql = await readyDb();
    const rows = await sql<{ offer_enabled: boolean }[]>`
      SELECT offer_enabled FROM products WHERE id = ${id} AND active = true
    `;
    return rows[0]?.offer_enabled === true;
  }

  async createOffer(input: {
    productId: string;
    customerEmail: string;
    offerPriceCents: number;
    userId?: string | null;
  }): Promise<void> {
    const sql = await readyDb();
    await sql`
      INSERT INTO offers (product_id, customer_email, offer_price_cents, user_id)
      VALUES (${input.productId}, ${input.customerEmail.toLowerCase()}, ${input.offerPriceCents}, ${input.userId ?? null})
    `;
  }

  async listPendingOffers(): Promise<OfferListRow[]> {
    const sql = await readyDb();
    return sql<OfferListRow[]>`
      SELECT o.id, o.product_id, p.name AS product_name, p.price_cents AS product_price_cents,
             o.customer_email, o.user_id, o.offer_price_cents, o.status, o.counter_price_cents
      FROM offers o
      JOIN products p ON p.id = o.product_id
      WHERE o.status = 'pending'
      ORDER BY o.created_at ASC
    `;
  }

  async getOfferWithProduct(id: string): Promise<OfferListRow | null> {
    const sql = await readyDb();
    const rows = await sql<OfferListRow[]>`
      SELECT o.id, o.product_id, p.name AS product_name, p.price_cents AS product_price_cents,
             o.customer_email, o.user_id, o.offer_price_cents, o.status, o.counter_price_cents
      FROM offers o
      JOIN products p ON p.id = o.product_id
      WHERE o.id = ${id}
    `;
    return rows[0] ?? null;
  }

  async updateOffer(id: string, offer: { status: OfferStatus; counterPriceCents: number | null }): Promise<void> {
    const sql = await readyDb();
    await sql`
      UPDATE offers SET status = ${offer.status}, counter_price_cents = ${offer.counterPriceCents}, updated_at = now()
      WHERE id = ${id}
    `;
  }

  async listOffersForUser(userId: string): Promise<OfferListRow[]> {
    const sql = await readyDb();
    return sql<OfferListRow[]>`
      SELECT o.id, o.product_id, p.name AS product_name, p.price_cents AS product_price_cents,
             o.customer_email, o.user_id, o.offer_price_cents, o.status, o.counter_price_cents
      FROM offers o
      JOIN products p ON p.id = o.product_id
      WHERE o.user_id = ${userId}
      ORDER BY o.created_at DESC
    `;
  }

  async createCustomer(input: { email: string; passwordHash: string; fullName?: string }): Promise<CustomerPublic> {
    const sql = await readyDb();
    const email = input.email.toLowerCase().trim();
    const rows = await sql<
      { id: string; email: string; full_name: string; phone: string; shipping_address: ShippingAddress | null }[]
    >`
      INSERT INTO customers (email, password_hash, full_name)
      VALUES (${email}, ${input.passwordHash}, ${input.fullName?.trim() ?? ''})
      RETURNING id, email, full_name, phone, shipping_address
    `;
    const row = rows[0];
    return {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      phone: row.phone,
      shippingAddress: row.shipping_address
    };
  }

  async getCustomer(id: string): Promise<CustomerPublic | null> {
    const sql = await readyDb();
    const rows = await sql<
      { id: string; email: string; full_name: string; phone: string; shipping_address: ShippingAddress | null }[]
    >`SELECT id, email, full_name, phone, shipping_address FROM customers WHERE id = ${id}`;
    const row = rows[0];
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      phone: row.phone,
      shippingAddress: row.shipping_address
    };
  }

  async getCustomerByEmail(email: string): Promise<(CustomerPublic & { passwordHash: string }) | null> {
    const sql = await readyDb();
    const rows = await sql<
      {
        id: string;
        email: string;
        full_name: string;
        phone: string;
        shipping_address: ShippingAddress | null;
        password_hash: string;
      }[]
    >`SELECT id, email, full_name, phone, shipping_address, password_hash FROM customers WHERE email = ${email.toLowerCase().trim()}`;
    const row = rows[0];
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      phone: row.phone,
      shippingAddress: row.shipping_address,
      passwordHash: row.password_hash
    };
  }

  async updateCustomerShipping(id: string, shipping: ShippingAddress): Promise<void> {
    const sql = await readyDb();
    await sql`
      UPDATE customers SET
        full_name = ${shipping.fullName},
        phone = ${shipping.phone},
        shipping_address = ${sql.json(toJsonValue(shipping))}
      WHERE id = ${id}
    `;
  }

  async attachOffersToUser(email: string, userId: string): Promise<void> {
    const sql = await readyDb();
    await sql`
      UPDATE offers SET user_id = ${userId}
      WHERE customer_email = ${email.toLowerCase().trim()} AND user_id IS NULL
    `;
  }

  async createPendingOrder(input: {
    customerEmail: string;
    userId?: string | null;
    shippingAddress: ShippingAddress;
    items: OrderItem[];
    totalCents: number;
  }): Promise<string> {
    const sql = await readyDb();
    const rows = await sql<{ id: string }[]>`
      INSERT INTO orders (
        customer_email, user_id, shipping_address, items, total_cents,
        payment_status, logistics_status
      )
      VALUES (
        ${input.customerEmail},
        ${input.userId ?? null},
        ${sql.json(toJsonValue(input.shippingAddress))},
        ${sql.json(toJsonValue(input.items))},
        ${input.totalCents},
        'pending',
        'awaiting_partner'
      )
      RETURNING id
    `;
    return rows[0].id;
  }

  async getPendingOrder(orderId: string): Promise<PendingOrder | null> {
    const sql = await readyDb();
    const rows = await sql<PendingOrder[]>`
      SELECT id, customer_email, items, total_cents FROM orders
      WHERE id = ${orderId} AND payment_status = 'pending'
    `;
    return rows[0] ?? null;
  }

  async getOrder(orderId: string): Promise<OrderRecord | null> {
    const sql = await readyDb();
    const rows = await sql<OrderRow[]>`
      SELECT id, customer_email, shipping_address, items, total_cents, payment_status,
             logistics_status, stripe_session_id, carrier_ref, tracking_number, created_at
      FROM orders WHERE id = ${orderId}
    `;
    return rows[0] ? asOrder(rows[0]) : null;
  }

  async setStripeSession(
    orderId: string,
    sessionId: string,
    replaceId: string | null = null
  ): Promise<'saved' | 'kept' | 'missing'> {
    const sql = await readyDb();
    const rows = await sql<{ id: string }[]>`
      UPDATE orders SET stripe_session_id = ${sessionId}
      WHERE id = ${orderId}
        AND (
          stripe_session_id IS NULL
          OR stripe_session_id = ${sessionId}
          OR (${replaceId}::text IS NOT NULL AND stripe_session_id = ${replaceId})
        )
      RETURNING id
    `;
    if (rows.length > 0) return 'saved';
    const existing = await sql<{ id: string }[]>`SELECT id FROM orders WHERE id = ${orderId}`;
    return existing.length > 0 ? 'kept' : 'missing';
  }

  async markOrderPaid(orderId: string): Promise<boolean> {
    const sql = await readyDb();
    const rows = await sql<{ id: string }[]>`
      UPDATE orders SET payment_status = 'paid'
      WHERE id = ${orderId} AND payment_status = 'pending'
      RETURNING id
    `;
    return rows.length > 0;
  }

  async takePaidStock(orderId: string): Promise<'taken' | 'short' | 'already' | 'unpaid'> {
    const sql = await readyDb();
    return sql.begin(async (tx) => {
      const rows = await tx<
        { id: string; items: OrderItem[]; payment_status: PaymentStatus; stock_settled: boolean }[]
      >`
        SELECT id, items, payment_status, stock_settled FROM orders WHERE id = ${orderId} FOR UPDATE
      `;
      const order = rows[0];
      if (!order || order.payment_status !== 'paid') return 'unpaid' as const;
      if (order.stock_settled) return 'already' as const;

      const ids = [...new Set((order.items ?? []).map((item) => item.productId))];
      const products = ids.length
        ? await tx<ProductRow[]>`SELECT * FROM products WHERE id IN ${tx(ids)} FOR UPDATE`
        : [];
      const byId = new Map(products.map((row) => [row.id, productFromRow(row)] as const));
      let planned;
      try {
        planned = planStockTake(order.items ?? [], byId);
      } catch (err) {
        if (!isShortStock(err)) throw err;
        await tx`UPDATE orders SET stock_settled = true WHERE id = ${orderId}`;
        return 'short' as const;
      }

      for (const next of planned) {
        await tx`
          UPDATE products SET
            variants = ${tx.json(toJsonValue(next.colors))},
            sizes = ${tx.json(toJsonValue(next.sizes))},
            stock_qty = ${next.stockQty}
          WHERE id = ${next.id}
        `;
      }
      await tx`UPDATE orders SET stock_settled = true WHERE id = ${orderId}`;
      return 'taken' as const;
    });
  }

  async claimConfirmation(orderId: string): Promise<'send' | 'sent' | 'busy'> {
    const sql = await readyDb();
    const claimed = await sql<{ id: string }[]>`
      UPDATE orders SET email_claimed_at = now()
      WHERE id = ${orderId}
        AND payment_status = 'paid'
        AND confirmation_sent = false
        AND (email_claimed_at IS NULL OR email_claimed_at < now() - interval '2 minutes')
      RETURNING id
    `;
    if (claimed.length > 0) return 'send';
    const rows = await sql<{ confirmation_sent: boolean }[]>`
      SELECT confirmation_sent FROM orders WHERE id = ${orderId}
    `;
    return rows[0]?.confirmation_sent ? 'sent' : 'busy';
  }

  async markConfirmationSent(orderId: string): Promise<void> {
    const sql = await readyDb();
    await sql`
      UPDATE orders SET confirmation_sent = true, email_claimed_at = NULL WHERE id = ${orderId}
    `;
  }

  async releaseConfirmation(orderId: string): Promise<void> {
    const sql = await readyDb();
    await sql`
      UPDATE orders SET email_claimed_at = NULL WHERE id = ${orderId} AND confirmation_sent = false
    `;
  }

  async recordShipment(
    orderId: string,
    shipment: { carrierRef: string; trackingNumber: string | null }
  ): Promise<void> {
    const sql = await readyDb();
    if (shipment.trackingNumber) {
      await sql`
        UPDATE orders SET
          carrier_ref = ${shipment.carrierRef},
          tracking_number = ${shipment.trackingNumber},
          logistics_status = 'handed_off'
        WHERE id = ${orderId}
      `;
      return;
    }
    await sql`
      UPDATE orders SET carrier_ref = ${shipment.carrierRef}, tracking_number = NULL
      WHERE id = ${orderId}
    `;
  }

  async markHandedToLogistics(orderId: string): Promise<void> {
    const sql = await readyDb();
    await sql`UPDATE orders SET logistics_status = 'handed_off' WHERE id = ${orderId}`;
  }

  async listOrders(): Promise<OrderSummaryRow[]> {
    const sql = await readyDb();
    const rows = await sql<OrderRow[]>`
      SELECT id, customer_email, shipping_address, items, total_cents, payment_status,
             logistics_status, stripe_session_id, carrier_ref, tracking_number, created_at
      FROM orders
      ORDER BY created_at DESC
    `;
    return rows.map(asOrder);
  }
}

interface OrderRow {
  id: string;
  customer_email: string;
  shipping_address: ShippingAddress;
  items: OrderItem[];
  total_cents: number;
  payment_status: PaymentStatus;
  logistics_status: LogisticsStatus;
  stripe_session_id: string | null;
  carrier_ref: string | null;
  tracking_number: string | null;
  created_at: Date | string;
}

function asOrder(row: OrderRow): OrderRecord {
  return {
    ...row,
    stripe_session_id: row.stripe_session_id ?? null,
    carrier_ref: row.carrier_ref ?? null,
    tracking_number: row.tracking_number ?? null,
    created_at: typeof row.created_at === 'string' ? row.created_at : row.created_at.toISOString()
  };
}
