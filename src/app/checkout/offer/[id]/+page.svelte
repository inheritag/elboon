<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { formatPrice } from '../../../../domain/product';
  import ShippingFields from '../../../ShippingFields.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let fullName = $state('');
  let phone = $state('');
  let line1 = $state('');
  let city = $state('');
  let postcode = $state('');
  let country = $state('');
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
    country = data.shipping?.country ?? '';
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

  </div>

  <form onsubmit={submit} class="card">
    <h2>Shipping</h2>
    <ShippingFields bind:fullName bind:phone bind:line1 bind:city bind:postcode bind:country>
      <p class="ship">Shipping is free. <a href="/policies">Delivery and returns</a>.</p>
    </ShippingFields>
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

  .ship {
    margin: 0 0 16px;
    color: var(--text-secondary);
  }

  .ship a {
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .ticket {
    background: var(--haggle-paper);
    border: none;
    border-top: 1px solid var(--haggle-rule);
    border-bottom: 1px solid var(--haggle-rule);
    border-radius: 0;
    padding: 28px 0 22px;
    margin-bottom: 24px;
    text-align: left;
  }

  .ribbon {
    display: inline-block;
    padding: 4px 12px;
    background: var(--ink);
    color: #fff;
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 11px;
    letter-spacing: 0.08em;
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

  form {
    padding: 20px;
  }
</style>
