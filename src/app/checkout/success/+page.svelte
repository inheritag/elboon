<script lang="ts">
  import { onMount } from 'svelte';
  import { clearCart } from '../../cart';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  onMount(() => {
    if (data.view === 'paid') clearCart();
  });
</script>

<section class="container success">
  {#if data.view === 'paid'}
    <h1>Order confirmed</h1>
    <p>
      {#if data.tracking}
        Payment received. Royal Mail tracking is {data.tracking}.
      {:else if data.booked}
        Payment received. We will send it with Royal Mail.
      {:else}
        Payment received. We will be in touch about delivery.
      {/if}
    </p>
    <a class="btn btn-primary" href="/">Continue shopping</a>
  {:else if data.view === 'checking'}
    <h1>Payment is being checked</h1>
    <p>We have not confirmed this payment yet. Your cart is still here.</p>
    <a class="btn btn-primary" href="/checkout/pay/{data.orderId}">Back to payment</a>
  {:else}
    <h1>Payment not taken</h1>
    <p>Nothing has been charged. Your cart is still here.</p>
    <a class="btn btn-primary" href="/checkout/pay/{data.orderId}">Back to payment</a>
  {/if}
</section>

<style>
  .success {
    max-width: 520px;
    padding: 80px 0;
    text-align: center;
  }

  .success p {
    color: var(--text-secondary);
    margin: 12px 0 24px;
  }
</style>
