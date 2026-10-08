<script lang="ts">
  import { formatPrice } from '../../../domain/product';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<section class="container desk">
  <h1>What needs doing</h1>

  <article class="card block">
    <h2>Listings</h2>
    {#if data.figures.listingCount === 0}
      <p class="muted">Nothing listed yet.</p>
    {:else}
      <p>
        {data.figures.listingCount}
        {data.figures.listingCount === 1 ? 'item' : 'items'} listed.
      </p>
      {#if data.figures.unitCount > 0}
        <p>
          Goods listed are worth {formatPrice(data.figures.worthCents, data.figures.currency)} · {data.figures.unitCount}
          {data.figures.unitCount === 1 ? 'unit' : 'units'} at listed prices.
        </p>
      {:else}
        <p>Goods listed are worth {formatPrice(data.figures.worthCents, data.figures.currency)}.</p>
      {/if}
    {/if}
    <h3>Sold</h3>
    <ul class="sold">
      {#each data.figures.soldDays as day}
        <li>
          <span>{day.label}</span>
          <span>{formatPrice(day.cents, data.figures.currency)}</span>
        </li>
      {/each}
    </ul>
  </article>

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
    <h2><a href="/admin/stock">Low stock</a> ({data.lowStock.length})</h2>
    {#each data.lowStock.slice(0, 8) as line}
      <p>
        <a href="/admin/stock?q={encodeURIComponent(line.productName)}"
          >{line.productName}{#if line.color}
            · {line.color}{/if}{#if line.size}
            · {line.size}{/if}</a
        >: {line.available} free
      </p>
    {:else}
      <p class="muted">Stock looks fine.</p>
    {/each}
    {#if data.lowStock.length > 8}
      <p><a href="/admin/stock">+{data.lowStock.length - 8} more on Stock</a></p>
    {/if}
  </article>
</section>

<style>
  .desk {
    padding: 32px 0 64px;
    display: grid;
    gap: 24px;
    max-width: 720px;
  }

  h1 {
    font-size: 28px;
  }

  .block {
    padding: 24px 26px;
  }

  h2 {
    font-size: 16px;
    margin-bottom: 10px;
  }

  h2 a {
    color: var(--accent);
    text-decoration: underline;
  }

  h3 {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--text-secondary);
    margin: 14px 0 6px;
  }

  .block p {
    margin: 4px 0;
    font-size: 14px;
  }

  .muted {
    color: var(--text-secondary);
  }

  .sold {
    list-style: none;
    margin: 0;
    padding: 0;
    max-width: 280px;
  }

  .sold li {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    font-size: 14px;
    padding: 10px 0;
    border-bottom: 1px solid var(--border);
  }

  .sold li:last-child {
    border-bottom: none;
  }
</style>
