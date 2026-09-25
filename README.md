# Elboon

E-commerce MVP from the 1 Sep 2026 planning meeting. SvelteKit app, Vercel
hosting, guest checkout, make-an-offer on selected products, admin inventory.

## What the MVP includes

- Storefront with categories (tech, accessories, fashion, home, beauty)
- Product pages with photos, descriptions, and remaining-count when stock is low
- Make an offer on **selected** items only. Owner can accept, ignore, or counter.
- Guest checkout, or optional account that saves shipping and offers
- Shipping on elboon; card payment via a payment provider (mocked in dev)
- Admin: product upload (photo, name, price, stock, listed flag, offer flag)
- Orders handed to an external logistics partner rather than shipped in-house
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

JSON store at `.data/dev-store.json`. Admin password is `elboon-dev`. Card
payments are accepted in-app (test Visa `4242 4242 4242 4242`). Offer emails
land in `/dev/inbox`.

## Production-like local setup

1. Set `DEV_MODE=false` in `.env` and fill in Postgres and Resend.
2. Generate an admin password: `node scripts/hash-password.mjs "your-password"`
3. Run `psql $POSTGRES_URL -f db/schema.sql`
4. `npm run dev`

## Tests

`npm test`
