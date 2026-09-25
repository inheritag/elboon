-- Elboon MVP schema. Run once against the Neon/Postgres database
-- (`psql $POSTGRES_URL -f db/schema.sql`).

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid()

CREATE TABLE products (
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
);

CREATE TABLE customers (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email              text NOT NULL UNIQUE,
  password_hash      text NOT NULL,
  full_name          text NOT NULL DEFAULT '',
  phone              text NOT NULL DEFAULT '',
  shipping_address   jsonb,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE offers (
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
);

CREATE TABLE orders (
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
);

CREATE INDEX offers_status_idx ON offers (status);
CREATE INDEX offers_user_idx ON offers (user_id);
CREATE INDEX products_category_idx ON products (category) WHERE active = true;
