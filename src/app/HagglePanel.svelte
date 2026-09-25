<script lang="ts">
  import { page } from '$app/state';
  import { haggleDefaultCents, haggleFloorCents, readHaggle } from '../domain/haggle';
  import { formatPrice } from '../domain/product';
  import { authHref } from './auth-href';
  import { addToCart, originFromEvent } from './cart';
  import HaggleMeter from './HaggleMeter.svelte';
  import OfferThread from './OfferThread.svelte';

  let {
    productId,
    productName,
    askingCents,
    currency = 'GBP',
    signedInEmail = null
  }: {
    productId: string;
    productName: string;
    askingCents: number;
    currency?: string;
    signedInEmail?: string | null;
  } = $props();

  let floorCents = $derived(haggleFloorCents(askingCents));
  let bidCents = $state(0);
  let primed = $state(false);
  let email = $state('');
  let status = $state<'idle' | 'submitting' | 'sent' | 'error'>('idle');

  $effect.pre(() => {
    if (!primed) {
      bidCents = haggleDefaultCents(askingCents);
      email = signedInEmail ?? '';
      primed = true;
    }
  });

  let read = $derived(readHaggle(bidCents, askingCents));
  let atAsking = $derived(read.tone === 'asking');
  let bidPounds = $derived((bidCents / 100).toFixed(2));

  function onTyped(event: Event) {
    const value = Number((event.currentTarget as HTMLInputElement).value);
    if (!Number.isFinite(value)) return;
    bidCents = Math.min(askingCents, Math.max(floorCents, Math.round(value * 100)));
  }

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (atAsking) return;
    status = 'submitting';
    const response = await fetch('/offers', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        productId,
        customerEmail: email,
        offerPriceCents: bidCents
      })
    });
    if (response.ok) {
      const payload = (await response.json()) as { email?: string };
      if (payload.email) email = payload.email;
      status = 'sent';
    } else {
      status = 'error';
    }
  }
</script>

<section class="haggle" data-tone={read.tone}>
  <OfferThread step={status === 'sent' ? 2 : 1} />

  <div class="prices">
    <div class="col listed">
      <span class="label">Listed</span>
      <strong>{formatPrice(askingCents, currency)}</strong>
    </div>
    <div class="col proposed">
      <span class="label">Your offer</span>
      {#if status === 'sent'}
        <strong>{formatPrice(bidCents, currency)}</strong>
      {:else}
        <label class="bid-label" for="haggle-amount">Your offer</label>
        <input
          id="haggle-amount"
          class="bid"
          type="number"
          min={floorCents / 100}
          max={askingCents / 100}
          step="0.5"
          value={bidPounds}
          oninput={onTyped}
          required
        />
      {/if}
    </div>
  </div>

  {#if status === 'sent'}
    <p class="sent">Offer sent. We will email {email} if we accept or counter.</p>
    {#if !signedInEmail}
      <p class="fine">
        <a href={authHref(page.url, 'signup', { redirectTo: '/account/offers', email })}>Create an account</a>
        to track it.
      </p>
    {:else}
      <p class="fine"><a href="/account">See it under Your offers</a></p>
    {/if}
  {:else}
    <HaggleMeter
      bind:offerCents={bidCents}
      {askingCents}
      minCents={floorCents}
      {currency}
      interactive
    />

    <form onsubmit={submit}>
      {#if !signedInEmail}
        <div class="field">
          <label for="haggle-email">Email</label>
          <input id="haggle-email" type="email" bind:value={email} required placeholder="you@email.com" />
        </div>
      {:else}
        <p class="note">Updates go to {signedInEmail}.</p>
      {/if}

      {#if atAsking}
        <button
          class="btn btn-primary throw"
          type="button"
          onclick={(event) =>
            addToCart(
              { productId, name: productName, unitPriceCents: askingCents },
              1,
              originFromEvent(event)
            )}
        >
          Add to cart at listed price
        </button>
      {:else}
        <button class="btn btn-primary throw" type="submit" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Sending…' : 'Send offer'}
        </button>
      {/if}

      {#if status === 'error'}
        <p class="error-text">Could not send. Try again.</p>
      {/if}
    </form>
  {/if}
</section>

<style>
  .haggle {
    margin-top: 28px;
    padding: 22px;
    background: var(--haggle-paper);
    color: var(--haggle-ink);
    border: 1px dashed var(--haggle-rule);
    border-radius: 12px;
  }

  .prices {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
    align-items: end;
  }

  .col {
    min-width: 0;
  }

  .proposed {
    animation: slide-in var(--dur) var(--ease-out);
  }

  @keyframes slide-in {
    from {
      opacity: 0;
      transform: translateX(-10px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  .label {
    display: block;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-secondary);
    margin-bottom: 4px;
  }

  .listed strong,
  .proposed strong,
  .bid {
    display: block;
    width: 100%;
    border: none;
    background: transparent;
    font-family: var(--font-display);
    font-weight: 800;
    font-size: clamp(26px, 6vw, 36px);
    letter-spacing: -0.03em;
    line-height: 1;
    color: var(--haggle-ink);
    padding: 0;
  }

  .listed strong {
    color: var(--text-secondary);
  }

  .bid:focus {
    outline: none;
  }

  .bid-label {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }

  .throw {
    width: 100%;
  }

  .note,
  .sent,
  .fine {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 12px;
  }

  .fine a {
    color: var(--accent);
    text-transform: none;
    letter-spacing: 0;
    text-decoration: underline;
  }

  @media (forced-colors: active) {
    .haggle {
      background: Canvas;
      color: CanvasText;
      border: 2px dashed CanvasText;
    }

    .listed strong,
    .proposed strong,
    .bid {
      color: CanvasText;
    }

    .listed strong {
      text-decoration: underline;
      text-underline-offset: 4px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .proposed {
      animation: none;
    }
  }
</style>
