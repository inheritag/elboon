<script lang="ts">
  import { formatPrice } from '../../../domain/product';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<section class="container offers">
  <h1>Your offers</h1>
  <p>Accepted and countered offers can be checked out at the agreed price.</p>

  {#each data.offers as offer}
    <article class="card row">
      <div>
        <h2>{offer.product_name}</h2>
        <p>You offered {formatPrice(offer.offer_price_cents, 'GBP')}</p>
        <p class="status">{offer.status}</p>
      </div>
      {#if offer.checkoutPriceCents !== null}
        <a class="btn btn-primary" href="/checkout/offer/{offer.id}">
          Checkout at {formatPrice(offer.checkoutPriceCents, 'GBP')}
        </a>
      {/if}
    </article>
  {:else}
    <p>No offers yet.</p>
  {/each}
</section>

<style>
  .offers {
    max-width: 640px;
    padding: 40px 0 64px;
  }

  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    margin: 12px 0;
    flex-wrap: wrap;
  }

  h2 {
    font-size: 18px;
  }

  .status {
    text-transform: capitalize;
    color: var(--text-secondary);
    font-size: 14px;
  }
</style>
