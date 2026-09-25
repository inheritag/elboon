<script lang="ts">
  import { formatPrice } from '../../../domain/product';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<section class="container desk">
  <h1>What needs doing</h1>

  <article class="card block">
    <h2><a href="/admin/offers">Offers to answer</a> ({data.pendingOffers.length})</h2>
    {#each data.pendingOffers as offer}
      <p>
        {offer.product_name}: {formatPrice(offer.offer_price_cents, 'GBP')} from
        {offer.customer_email}
      </p>
    {:else}
      <p class="muted">None waiting.</p>
    {/each}
  </article>

  <article class="card block">
    <h2><a href="/admin/orders">Orders to send</a> ({data.awaitingHandoff.length})</h2>
    {#each data.awaitingHandoff as order}
      <p>
        {order.shipping_address.fullName} · {formatPrice(order.total_cents, 'GBP')} ·
        {order.shipping_address.city}
      </p>
    {:else}
      <p class="muted">None waiting.</p>
    {/each}
  </article>

  <article class="card block">
    <h2><a href="/admin/products">Low stock</a> ({data.lowStock.length})</h2>
    {#each data.lowStock as product}
      <p>
        <a href="/admin/products/{product.id}">{product.name}</a>: {product.stock_qty} left
      </p>
    {:else}
      <p class="muted">Stock looks fine.</p>
    {/each}
  </article>
</section>

<style>
  .desk {
    padding: 24px 0 48px;
    display: grid;
    gap: 16px;
    max-width: 720px;
  }

  h1 {
    font-size: 28px;
  }

  .block {
    padding: 20px;
  }

  h2 {
    font-size: 16px;
    margin-bottom: 10px;
  }

  h2 a {
    color: var(--accent);
    text-decoration: underline;
  }

  .block p {
    margin: 4px 0;
    font-size: 14px;
  }

  .muted {
    color: var(--text-secondary);
  }
</style>
