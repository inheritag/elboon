<script lang="ts">
  import { formatPrice } from '../domain/product';
  import OfferThread from './OfferThread.svelte';

  let {
    offer
  }: {
    offer: {
      id: string;
      product_name: string;
      product_price_cents: number;
      offer_price_cents: number;
      counter_price_cents: number | null;
      status: string;
      checkoutPriceCents: number | null;
    };
  } = $props();

  let step: 1 | 2 | 3 = $derived(offer.status === 'pending' ? 2 : 3);
</script>

<article class="card row">
  <OfferThread step={step} />
  <h2>{offer.product_name}</h2>
  <div class="prices">
    <div>
      <span class="label">Listed</span>
      <strong>{formatPrice(offer.product_price_cents, 'GBP')}</strong>
    </div>
    <div class="proposed">
      <span class="label">You offered</span>
      <strong>{formatPrice(offer.offer_price_cents, 'GBP')}</strong>
    </div>
    {#if offer.counter_price_cents}
      <div>
        <span class="label">They countered</span>
        <strong>{formatPrice(offer.counter_price_cents, 'GBP')}</strong>
      </div>
    {/if}
  </div>
  <p class="status">{offer.status}</p>
  {#if offer.checkoutPriceCents !== null}
    <a class="btn btn-primary" href="/checkout/offer/{offer.id}">
      Checkout at {formatPrice(offer.checkoutPriceCents, 'GBP')}
    </a>
  {/if}
</article>

<style>
  .row {
    padding: 16px 20px;
    margin: 12px 0;
  }

  h2 {
    font-size: 18px;
    margin-bottom: 12px;
  }

  .prices {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 12px;
    margin-bottom: 10px;
  }

  .label {
    display: block;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-secondary);
  }

  .prices strong {
    font-family: var(--font-display);
    font-size: 22px;
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

  .status {
    text-transform: capitalize;
    color: var(--text-secondary);
    font-size: 14px;
    margin-bottom: 12px;
  }
</style>
