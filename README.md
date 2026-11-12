# Elboon

E-commerce MVP from the 1 Sep 2026 planning meeting. SvelteKit app, Vercel
hosting, guest checkout, make-an-offer on selected products, admin inventory.

## What the MVP includes

- Storefront with categories (tech, accessories, fashion, home, beauty)
- Product pages with photos, descriptions, and remaining-count when stock is low
- Make an offer on **selected** items only. Owner can accept, ignore, or counter.
- Guest checkout, or optional account that saves shipping and offers
- Card payment on Stripe. With no Stripe key in dev, the pay button does not charge
- Admin: product upload (photo, name, price, stock, listed flag, offer flag)
- Paid orders are booked with Royal Mail. Postage is applied in Click & Drop
- Similar / complementary product recommendations
- No flash sales, no ratings

## Folder structure

- `src/app`: routes, pages and `+server.ts` API endpoints together
- `src/domain`: pure business logic (no framework or DB imports)
- `src/libs`: infra, store (Postgres or local JSON), email, admin auth, env

## Local setup (dev mode)

1. `npm install`
2. Copy `.env.example` to `.env` (`DEV_MODE=true` is the default)
3. `npm run dev`

JSON store at `.data/dev-store.json`. Admin password is `elboon-dev`. Without
`STRIPE_API_KEY`, the pay button takes no charge. With it, checkout goes to
Stripe. Order and offer emails land in `/dev/inbox`. Paid orders and new haggles go to elboonltd@gmail.com.

## Production-like local setup

1. Set `DEV_MODE=false` in `.env` and fill in Postgres and Resend.
2. Set `STRIPE_API_KEY` to an `sk_live_` or `sk_test_` key, and `SITE_URL` to the public https address.
3. Optional: `STRIPE_WEBHOOK_SECRET` for `POST /checkout/stripe`, and `ROYAL_MAIL_API_KEY` to book the parcel.
4. Generate an admin password: `node scripts/hash-password.mjs "your-password"`
5. Run `psql $POSTGRES_URL -f db/schema.sql`
6. `npm run dev`

## Tests

`npm test`
