<script lang="ts">
  import { enhance } from '$app/forms';
  import { readHaggle } from '../../../../domain/haggle';
  import { formatPrice } from '../../../../domain/product';
  import OfferThread from '../../../OfferThread.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  function defaultCounter(offerCents: number, askingCents: number): string {
    const mid = Math.round((offerCents + askingCents) / 2);
    return (mid / 100).toFixed(2);
  }
</script>

<section class="container offers-admin">
  <h1>Offers to answer</h1>
  <p class="lede">Accept emails a checkout link. Counter emails your price. Ignore is silent.</p>

  {#each data.offers as offer}
    {@const read = readHaggle(offer.offer_price_cents, offer.product_price_cents)}
    <article class="card ticket">
      <OfferThread labels={['Them', 'You', 'Them']} step={2} />
      <p class="tone">{read.label} · {read.percentOfAsk}% of listed</p>
      <h2><a href="/product/{offer.product_id}">{offer.product_name}</a></h2>
      <p class="who"><a href="mailto:{offer.customer_email}">{offer.customer_email}</a></p>

      <div class="prices">
        <div class="col">
          <span class="label">Listed</span>
          <strong>{formatPrice(offer.product_price_cents, 'GBP')}</strong>
        </div>
        <div class="col proposed">
          <span class="label">They offered</span>
          <strong>{formatPrice(offer.offer_price_cents, 'GBP')}</strong>
        </div>
      </div>

      <div class="offer-actions">
        <form method="POST" action="?/respond" use:enhance>
          <input type="hidden" name="offerId" value={offer.id} />
          <input type="hidden" name="actionType" value="accept" />
          <button class="btn btn-secondary" type="submit">Accept</button>
        </form>
        <form method="POST" action="?/respond" use:enhance class="counter-form">
          <input type="hidden" name="offerId" value={offer.id} />
          <input type="hidden" name="actionType" value="counter" />
          <input
            type="number"
            name="counterPriceCents"
            aria-label="Counter price"
            min="0.01"
            step="0.01"
            value={defaultCounter(offer.offer_price_cents, offer.product_price_cents)}
          />
          <button class="btn btn-secondary" type="submit">Counter</button>
        </form>
        <form method="POST" action="?/respond" use:enhance>
          <input type="hidden" name="offerId" value={offer.id} />
          <input type="hidden" name="actionType" value="ignore" />
          <button class="btn btn-secondary" type="submit">Ignore</button>
        </form>
      </div>
    </article>
  {:else}
    <p class="muted">No pending offers.</p>
  {/each}
</section>

<style>
  .offers-admin {
    padding: 24px 0 48px;
    max-width: 720px;
  }

  .lede {
    color: var(--text-secondary);
    margin-bottom: 20px;
  }

  .ticket {
    padding: 20px;
    margin-bottom: 12px;
  }

  .tone {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--accent);
  }

  h2 {
    font-size: 22px;
    margin: 6px 0;
  }

  h2 a {
    text-decoration: underline;
  }

  .who {
    margin-bottom: 14px;
    font-size: 14px;
  }

  .prices {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin: 8px 0 16px;
  }

  .label {
    display: block;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-secondary);
  }

  .col strong {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.03em;
  }

  .proposed {
    animation: slide-in var(--dur) var(--ease-out);
  }

  @keyframes slide-in {
    from {
      opacity: 0;
      transform: translateX(-10px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  .offer-actions {
    display: grid;
    grid-template-columns: 1fr 1.4fr 1fr;
    gap: 8px;
    align-items: stretch;
  }

  .offer-actions form {
    display: flex;
  }

  .offer-actions .btn {
    width: 100%;
  }

  .counter-form {
    display: flex;
    gap: 6px;
  }

  .counter-form input[type='number'] {
    width: 100%;
    min-width: 0;
    padding: 8px 10px;
    border: 1px solid var(--border);
    background: var(--bg-subtle);
  }

  .muted {
    color: var(--text-secondary);
  }

  @media (max-width: 640px) {
    .offer-actions {
      grid-template-columns: 1fr;
    }
  }
</style>
