<script lang="ts">
  import { formatPrice } from '../../../domain/product';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  function when(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function detail(item: { name: string; quantity: number; color: string | null; size: string | null }): string {
    const bits = [item.name, item.color, item.size].filter(Boolean);
    return `${item.quantity} × ${bits.join(' · ')}`;
  }
</script>

<svelte:head>
  <title>Your orders · elboon</title>
</svelte:head>

<section class="container orders">
  <p class="back"><a href="/account">Your account</a></p>
  <h1>Your orders</h1>

  {#each data.orders as order}
    <article>
      <p class="when">{when(order.createdAt)}</p>
      <ul>
        {#each order.items as item}
          <li>{detail(item)}</li>
        {/each}
      </ul>
      <p class="total">{formatPrice(order.totalCents, 'GBP')}</p>
      <p class="status">{order.status}</p>
    </article>
  {:else}
    <p class="empty">No orders yet.</p>
    <a class="btn btn-primary" href="/">Browse products</a>
  {/each}
</section>

<style>
  .orders {
    max-width: 640px;
    padding: 40px 0 64px;
  }

  .back {
    margin-bottom: 8px;
  }

  .back a {
    color: var(--ink);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  h1 {
    margin-bottom: 20px;
  }

  article {
    padding: 16px 0;
    border-top: 1px solid var(--border);
  }

  .when,
  .total {
    font-weight: 600;
  }

  ul {
    margin: 8px 0;
    padding: 0;
    list-style: none;
  }

  li {
    margin: 4px 0;
  }

  .empty {
    margin-bottom: 16px;
    color: var(--text-secondary);
  }

  .btn {
    width: auto;
  }

  .status {
    display: inline-block;
    margin-top: 8px;
    padding: 2px 8px;
    border: 1px solid var(--border);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-secondary);
  }
</style>
