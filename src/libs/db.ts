import postgres from 'postgres';
import { config } from './config';

// Bundled into the Vercel function. db/schema.sql is not copied to /var/task.
const SCHEMA_STATEMENTS = [
  'CREATE EXTENSION IF NOT EXISTS pgcrypto',
  `CREATE TABLE IF NOT EXISTS products (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,
  description         text NOT NULL DEFAULT '',
  price_cents         integer NOT NULL CHECK (price_cents >= 0),
  currency            text NOT NULL DEFAULT 'GBP',
  category            text NOT NULL,
  image_urls          text[] NOT NULL DEFAULT '{}',
  stock_qty           integer NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  low_stock_threshold integer NOT NULL DEFAULT 3,
  offer_enabled       boolean NOT NULL DEFAULT false,
  active              boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now()
)`,
  `CREATE TABLE IF NOT EXISTS customers (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email              text NOT NULL UNIQUE,
  password_hash      text NOT NULL,
  full_name          text NOT NULL DEFAULT '',
  phone              text NOT NULL DEFAULT '',
  shipping_address   jsonb,
  created_at         timestamptz NOT NULL DEFAULT now()
)`,
  `CREATE TABLE IF NOT EXISTS offers (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id         uuid NOT NULL REFERENCES products (id),
  user_id            uuid REFERENCES customers (id),
  customer_email     text NOT NULL,
  offer_price_cents  integer NOT NULL CHECK (offer_price_cents >= 0),
  status             text NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'accepted', 'ignored', 'countered')),
  counter_price_cents integer,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
)`,
  `CREATE TABLE IF NOT EXISTS orders (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid REFERENCES customers (id),
  customer_email     text NOT NULL,
  shipping_address   jsonb NOT NULL,
  items              jsonb NOT NULL,
  total_cents        integer NOT NULL CHECK (total_cents >= 0),
  payment_status     text NOT NULL DEFAULT 'pending'
                       CHECK (payment_status IN ('pending', 'paid', 'failed')),
  logistics_status   text NOT NULL DEFAULT 'awaiting_partner'
                       CHECK (logistics_status IN ('awaiting_partner', 'handed_off')),
  created_at         timestamptz NOT NULL DEFAULT now()
)`,
  'CREATE INDEX IF NOT EXISTS offers_status_idx ON offers (status)',
  'CREATE INDEX IF NOT EXISTS offers_user_idx ON offers (user_id)',
  'CREATE INDEX IF NOT EXISTS products_category_idx ON products (category) WHERE active = true',
  `CREATE TABLE IF NOT EXISTS categories (
  slug       text PRIMARY KEY,
  label      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
)`,
  `INSERT INTO categories (slug, label) VALUES
    ('tech', 'tech'),
    ('accessories', 'accessories'),
    ('fashion', 'fashion'),
    ('home', 'home'),
    ('beauty', 'beauty')
  ON CONFLICT (slug) DO NOTHING`,
  `CREATE TABLE IF NOT EXISTS product_images (
  id         text PRIMARY KEY,
  mime       text NOT NULL,
  bytes      bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
)`
];

let sql: postgres.Sql | null = null;
let schemaReady: Promise<void> | null = null;

export function getDb(): postgres.Sql {
  if (!sql) {
    sql = postgres(config.databaseUrl(), {
      ssl: 'require',
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false
    });
  }
  return sql;
}

export async function readyDb(): Promise<postgres.Sql> {
  const client = getDb();
  if (!schemaReady) {
    schemaReady = applySchema(client);
  }
  await schemaReady;
  return client;
}

async function applySchema(client: postgres.Sql): Promise<void> {
  for (const statement of SCHEMA_STATEMENTS) {
    await client.unsafe(statement);
  }
}

/**
 * postgres.js's `sql.json()` wants a type with an index signature, which our
 * domain types (ShippingAddress, OrderItem[]) don't have. This is a TS
 * typing gap, not a real risk. The value is already plain, serialisable data.
 */
export function toJsonValue<T>(value: T): postgres.JSONValue {
  return value as unknown as postgres.JSONValue;
}
