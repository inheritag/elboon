<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { formatPrice } from '../../domain/product';
  import { authHref } from '../auth-href';
  import { cart, removeFromCart, setCartQuantity } from '../cart';
  import type { LayoutData } from '../$types';

  let { data }: { data: LayoutData } = $props();

  let totalCents = $derived($cart.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0));

  function proceed() {
    if (data.customer) {
      void goto('/checkout');
      return;
    }
    void goto(authHref(page.url, 'login', { redirectTo: '/checkout' }), { noScroll: true, keepFocus: true });
  }
</script>

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
            <p>{formatPrice(line.unitPriceCents, 'GBP')} each{line.color ? ` · ${line.color}` : ''}</p>
          </div>
          <div class="stepper" role="group" aria-label="Quantity for {line.name}">
            <button type="button" class="step" onclick={() => setCartQuantity(line.productId, line.quantity - 1, line.color)} aria-label="Decrease">-</button>
            <span class="qty">{line.quantity}</span>
            <button type="button" class="step" onclick={() => setCartQuantity(line.productId, line.quantity + 1, line.color)} aria-label="Increase">+</button>
          </div>
          <span class="line-total">{formatPrice(line.unitPriceCents * line.quantity, 'GBP')}</span>
          <button class="link-button" onclick={() => removeFromCart(line.productId, line.color)}>Remove</button>
        </li>
      {/each}
    </ul>

    <p class="total">Total: {formatPrice(totalCents, 'GBP')}</p>
    <button class="btn btn-primary" type="button" onclick={proceed}>Proceed to checkout</button>
  {/if}
</section>

<style>
  .cart-page {
    padding: clamp(24px, 5vw, 40px) 0 64px;
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
    width: 44px;
    height: 44px;
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

  @media (forced-colors: active) {
    .stepper {
      border: 2px solid CanvasText;
    }

    .link-button {
      color: LinkText;
      text-decoration: underline;
    }
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
