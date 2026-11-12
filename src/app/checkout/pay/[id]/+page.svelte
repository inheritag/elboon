<script lang="ts">
  import { enhance } from '$app/forms';
  import { formatPrice } from '../../../../domain/product';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<section class="container pay">
  <h1>Payment</h1>
  <p>
    Amount due:
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

  {#if data.expired}
    <p class="error">This checkout has expired.</p>
    <a class="btn btn-secondary" href="/cart">Back to cart</a>
  {:else if !data.stripe && !data.devMode}
    <p class="error">Payment is not set up.</p>
  {:else}
    <div class="actions">
      <form method="POST" action="?/pay" use:enhance>
        <button class="btn btn-primary" type="submit">{data.stripe ? 'Pay' : 'Place order'}</button>
      </form>
      <form method="POST" action="?/cancel" use:enhance>
        <button class="btn btn-secondary" type="submit">Cancel</button>
      </form>
    </div>
    {#if data.devMode && !data.stripe}
      <p class="fine">Dev: no real charge.</p>
    {/if}
  {/if}
  {#if form?.error}
    <p class="error">{form.error}</p>
  {/if}
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

  .error {
    margin-top: 16px;
    color: var(--ink);
    font-weight: 600;
  }
</style>
