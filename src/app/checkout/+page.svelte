<script lang="ts">
  import { goto } from '$app/navigation';
  import { formatPrice } from '../../domain/product';
  import { cart } from '../cart';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let email = $state('');
  let fullName = $state('');
  let phone = $state('');
  let line1 = $state('');
  let city = $state('');
  let postcode = $state('');
  let country = $state('Nigeria');
  let primed = $state(false);
  let status = $state<'idle' | 'submitting' | 'error'>('idle');
  let errorMessage = $state('');

  $effect.pre(() => {
    if (primed) return;
    email = data.email;
    fullName = data.shipping?.fullName ?? '';
    phone = data.shipping?.phone ?? '';
    line1 = data.shipping?.line1 ?? '';
    city = data.shipping?.city ?? '';
    postcode = data.shipping?.postcode ?? '';
    country = data.shipping?.country ?? 'Nigeria';
    primed = true;
  });

  let totalCents = $derived($cart.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0));

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    status = 'submitting';
    const response = await fetch('/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        customerEmail: email,
        shippingAddress: { fullName, phone, line1, line2: null, city, postcode, country },
        items: $cart.map((line) => ({ productId: line.productId, quantity: line.quantity, color: line.color }))
      })
    });

    if (!response.ok) {
      status = 'error';
      errorMessage = (await response.json()).error ?? 'Could not start checkout';
      return;
    }

    const { orderId } = await response.json();
    await goto(`/checkout/pay/${orderId}`);
  }
</script>

<section class="container checkout">
  <h1>Checkout</h1>

  {#if $cart.length === 0}
    <p>Your cart is empty. <a href="/">Browse products</a></p>
  {:else}
    {#if data.signedIn}
      <p class="choice">Signed in as {data.email}. Shipping is filled from your last order.</p>
    {/if}

    <ul class="lines">
      {#each $cart as line}
        <li>
          <span>{line.name}{line.color ? ` · ${line.color}` : ''} &times; {line.quantity}</span>
          <span>{formatPrice(line.unitPriceCents * line.quantity, 'GBP')}</span>
        </li>
      {/each}
    </ul>
    <p class="total">Total: {formatPrice(totalCents, 'GBP')}</p>

    <form onsubmit={submit} class="card">
      <h2>Shipping</h2>
      <p class="hint">Card payment happens on the next step, with our payment provider.</p>
      {#if !data.signedIn}
        <div class="field">
          <label for="email">Email</label>
          <input id="email" type="email" bind:value={email} required />
        </div>
      {/if}
      <div class="field">
        <label for="fullName">Full name</label>
        <input id="fullName" bind:value={fullName} required />
      </div>
      <div class="field">
        <label for="phone">Phone</label>
        <input id="phone" type="tel" bind:value={phone} required />
      </div>
      <div class="field">
        <label for="line1">Address</label>
        <input id="line1" bind:value={line1} required />
      </div>
      <div class="fields-2">
        <div class="field">
          <label for="city">City</label>
          <input id="city" bind:value={city} required />
        </div>
        <div class="field">
          <label for="postcode">Postcode</label>
          <input id="postcode" bind:value={postcode} required />
        </div>
      </div>
      <div class="field">
        <label for="country">Country</label>
        <input id="country" bind:value={country} required />
      </div>
      <button class="btn btn-primary" type="submit" disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Continuing…' : 'Continue to payment'}
      </button>
      {#if errorMessage}
        <p class="error-text">{errorMessage}</p>
      {/if}
    </form>
  {/if}
</section>

<style>
  .checkout {
    max-width: 640px;
    padding: 40px 0 64px;
  }

  .choice {
    margin: 12px 0 20px;
    color: var(--text-secondary);
  }

  .lines {
    list-style: none;
    margin-bottom: 8px;
  }

  .lines li {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid var(--border);
  }

  .total {
    font-weight: 700;
    margin: 12px 0 20px;
  }

  form {
    padding: 20px;
  }

  .hint {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 16px;
  }
</style>
