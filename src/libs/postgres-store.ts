import { canNestUnder, slugFromLabel, type CategoryRecord } from '../domain/catalog';
import type { OfferStatus } from '../domain/offer';
import type { LogisticsStatus, OrderItem, PaymentStatus, ShippingAddress } from '../domain/order';
import type { HeldUnit } from '../domain/inventory';
import { applySale, applySet, productFromRow, type ProductRow } from '../domain/product';
import { readyDb, toJsonValue } from './db';
import type { CreateProductInput, CustomerPublic, OfferListRow, OrderSummaryRow, PendingOrder, Store } from './store';

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
      ON CONFLICT (slug) DO UPDATE SET label = EXCLUDED.label
      RETURNING slug, label, parent_slug
    `;
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

  async markOrderPaid(orderId: string): Promise<void> {
    const sql = await readyDb();
    await sql`UPDATE orders SET payment_status = 'paid' WHERE id = ${orderId}`;
  }

  async markHandedToLogistics(orderId: string): Promise<void> {
    const sql = await readyDb();
    await sql`UPDATE orders SET logistics_status = 'handed_off' WHERE id = ${orderId}`;
  }

  async listOrders(): Promise<OrderSummaryRow[]> {
    const sql = await readyDb();
    const rows = await sql<
      {
        id: string;
        customer_email: string;
        shipping_address: ShippingAddress;
        items: OrderItem[];
        total_cents: number;
        payment_status: PaymentStatus;
        logistics_status: LogisticsStatus;
        created_at: Date | string;
      }[]
    >`
      SELECT id, customer_email, shipping_address, items, total_cents, payment_status,
             logistics_status, created_at
      FROM orders
      ORDER BY created_at DESC
    `;
    return rows.map((row) => ({
      ...row,
      created_at: typeof row.created_at === 'string' ? row.created_at : row.created_at.toISOString()
    }));
  }
}
