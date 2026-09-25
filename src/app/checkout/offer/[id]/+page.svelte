<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { formatPrice } from '../../../../domain/product';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

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
    fullName = data.shipping?.fullName ?? '';
    phone = data.shipping?.phone ?? '';
    line1 = data.shipping?.line1 ?? '';
    city = data.shipping?.city ?? '';
    postcode = data.shipping?.postcode ?? '';
    country = data.shipping?.country ?? 'Nigeria';
    primed = true;
  });

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    status = 'submitting';
    const response = await fetch(`/offers/${page.params.id}/checkout`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        shippingAddress: { fullName, phone, line1, line2: null, city, postcode, country }
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

<section class="container offer-checkout">
  <div class="ticket">
    <p class="ribbon">{data.status === 'countered' ? 'Counter offer' : 'Offer accepted'}</p>
    <h1>{data.productName}</h1>
    <p class="deal">{formatPrice(data.priceCents, 'GBP')}</p>
    {#if data.askingCents > data.priceCents}
      <p class="was">Listed was {formatPrice(data.askingCents, 'GBP')}</p>
    {/if}
    <p class="guest">Shipping next, then card payment with our provider.</p>
  </div>

  <form onsubmit={submit} class="card">
    <h2>Shipping</h2>
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
</section>

<style>
  .offer-checkout {
    padding: 40px 0 64px;
    max-width: 640px;
  }

  .ticket {
    background: var(--haggle-paper);
    border: 1px dashed var(--haggle-rule);
    border-radius: 12px;
    padding: 28px 24px 22px;
    margin-bottom: 24px;
    text-align: center;
  }

  .ribbon {
    display: inline-block;
    padding: 4px 12px;
    background: var(--accent);
    color: #fff;
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 12px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  h1 {
    margin: 16px 0 8px;
    font-size: 22px;
  }

  .deal {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 42px;
    letter-spacing: -0.03em;
    line-height: 1;
  }

  .was {
    text-decoration: line-through;
    color: var(--text-muted);
    margin-top: 6px;
  }

  .guest {
    color: var(--text-secondary);
    margin-top: 12px;
    font-size: 14px;
  }

  form {
    padding: 20px;
  }
</style>
