<script lang="ts">
  import { enhance } from '$app/forms';
  import { formatPrice } from '../../../../domain/product';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<section class="container pay">
  <h1>Payment</h1>
  <p>
    Card details are collected by our payment provider, not on elboon. Amount due:
    <strong>{formatPrice(data.order.total_cents, 'GBP')}</strong>
  </p>

  <ul class="card lines">
    {#each data.order.items as item}
      <li>
        <span>{item.productName} &times; {item.quantity}</span>
        <span>{formatPrice(item.unitPriceCents * item.quantity, 'GBP')}</span>
      </li>
    {/each}
  </ul>

  <div class="actions">
    <form method="POST" action="?/pay" use:enhance>
      <button class="btn btn-primary" type="submit">Pay with card</button>
    </form>
    <form method="POST" action="?/cancel" use:enhance>
      <button class="btn btn-secondary" type="submit">Cancel</button>
    </form>
  </div>
  <p class="fine">In development this completes the order without charging a real card.</p>
</section>

<style>
  .pay {
    max-width: 520px;
    padding: 48px 0 64px;
  }

  .lines {
    list-style: none;
    padding: 16px 20px;
    margin: 24px 0;
  }

  .lines li {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
  }

  .actions {
    display: flex;
    gap: 12px;
  }

  .fine {
    margin-top: 16px;
    font-size: 13px;
    color: var(--text-muted);
  }
</style>
