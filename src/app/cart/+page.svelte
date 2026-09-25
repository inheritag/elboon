<script lang="ts">
  import { goto } from '$app/navigation';
  import { formatPrice } from '../../domain/product';
  import { cart, removeFromCart, setCartQuantity } from '../cart';
  import type { LayoutData } from '../$types';

  let { data }: { data: LayoutData } = $props();

  let totalCents = $derived($cart.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0));
  let showGate = $state(false);

  function proceed() {
    if (data.customer) {
      void goto('/checkout');
      return;
    }
    showGate = true;
  }

  function onKey(event: KeyboardEvent) {
    if (event.key === 'Escape') showGate = false;
  }
</script>

<svelte:window onkeydown={onKey} />

<section class="container cart-page">
  <h1>Your cart</h1>

  {#if $cart.length === 0}
    <p class="empty">Your cart is empty.</p>
    <a class="btn btn-primary" href="/">Browse products</a>
  {:else}
    <ul class="lines">
      {#each $cart as line}
        <li>
          {#if line.imageUrl}
            <img class="thumb" src={line.imageUrl} alt="" />
          {:else}
            <div class="thumb placeholder"></div>
          {/if}
          <div class="meta">
            <a href="/product/{line.productId}">{line.name}</a>
            <p>{formatPrice(line.unitPriceCents, 'GBP')} each</p>
          </div>
          <div class="stepper" role="group" aria-label="Quantity for {line.name}">
            <button type="button" class="step" onclick={() => setCartQuantity(line.productId, line.quantity - 1)} aria-label="Decrease">-</button>
            <span class="qty">{line.quantity}</span>
            <button type="button" class="step" onclick={() => setCartQuantity(line.productId, line.quantity + 1)} aria-label="Increase">+</button>
          </div>
          <span class="line-total">{formatPrice(line.unitPriceCents * line.quantity, 'GBP')}</span>
          <button class="link-button" onclick={() => removeFromCart(line.productId)}>Remove</button>
        </li>
      {/each}
    </ul>

    <p class="total">Total: {formatPrice(totalCents, 'GBP')}</p>
    <button class="btn btn-primary" type="button" onclick={proceed}>Proceed to checkout</button>
  {/if}
</section>

{#if showGate}
  <div class="overlay">
    <button class="backdrop" type="button" aria-label="Close checkout options" onclick={() => (showGate = false)}
    ></button>
    <div class="sheet" role="dialog" aria-labelledby="gate-title" aria-modal="true" tabindex="-1">
      <h2 id="gate-title">How do you want to check out?</h2>
      <p>Sign in to reuse your shipping details, or continue as guest.</p>
      <a class="btn btn-primary" href="/account/login?redirectTo=/checkout">Sign in</a>
      <a class="btn btn-secondary" href="/account/signup?redirectTo=/checkout">Create an account</a>
      <a class="btn btn-secondary" href="/checkout">Continue as guest</a>
      <button class="link-button" type="button" onclick={() => (showGate = false)}>Back to cart</button>
    </div>
  </div>
{/if}

<style>
  .cart-page {
    padding: 40px 0 64px;
    max-width: 720px;
  }

  .empty {
    color: var(--text-secondary);
    margin: 12px 0 20px;
  }

  .lines {
    list-style: none;
    margin: 20px 0;
  }

  .lines li {
    display: grid;
    grid-template-columns: 64px 1fr auto auto auto;
    align-items: center;
    gap: 12px;
    padding: 14px 0;
    border-bottom: 1px solid var(--border);
  }

  .thumb {
    width: 64px;
    height: 64px;
    object-fit: cover;
    border-radius: var(--radius-sm);
    background: var(--bg-subtle);
  }

  .meta a {
    font-weight: 600;
  }

  .meta p {
    color: var(--text-muted);
    font-size: 13px;
  }

  .stepper {
    display: inline-flex;
    align-items: center;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  .step {
    width: 32px;
    height: 32px;
    border: none;
    background: var(--bg-subtle);
    font-size: 16px;
    cursor: pointer;
  }

  .qty {
    min-width: 28px;
    text-align: center;
    font-weight: 700;
  }

  .line-total {
    font-weight: 600;
    min-width: 4.5rem;
    text-align: right;
  }

  .link-button {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
  }

  .total {
    font-weight: 700;
    font-size: 18px;
    margin: 20px 0;
  }

  .overlay {
    position: fixed;
    inset: 0;
    z-index: 40;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }

  .backdrop {
    position: absolute;
    inset: 0;
    border: none;
    background: rgba(17, 24, 39, 0.45);
    cursor: pointer;
  }

  .sheet {
    position: relative;
    width: min(420px, 100%);
    background: #fff;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    padding: 28px 24px 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .sheet h2 {
    font-size: 22px;
  }

  .sheet p {
    color: var(--text-secondary);
    margin-bottom: 8px;
  }

  .sheet .btn {
    text-align: center;
  }

  .sheet .link-button {
    margin-top: 4px;
  }

  @media (max-width: 640px) {
    .lines li {
      grid-template-columns: 56px 1fr auto;
      grid-template-areas:
        'thumb meta remove'
        'thumb stepper total';
    }

    .thumb {
      grid-area: thumb;
    }

    .meta {
      grid-area: meta;
    }

    .link-button {
      grid-area: remove;
    }

    .stepper {
      grid-area: stepper;
    }

    .line-total {
      grid-area: total;
    }
  }
</style>
