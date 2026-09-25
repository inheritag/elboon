<script lang="ts">
  import { haggleDefaultCents, haggleFloorCents, readHaggle } from '../domain/haggle';
  import { formatPrice } from '../domain/product';
  import { addToCart, originFromEvent } from './cart';
  import HaggleMeter from './HaggleMeter.svelte';

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
  <div class="ribbon">Haggle</div>
  <p class="asking">Listed at {formatPrice(askingCents, currency)}</p>

  {#if status === 'sent'}
    <div class="sent">
      <p class="bid">{formatPrice(bidCents, currency)}</p>
      <p>Offer sent. We’ll email {email} if we accept or counter.</p>
      {#if !signedInEmail}
        <p class="fine">
          <a href="/account/signup?redirectTo=/account/offers&email={encodeURIComponent(email)}">Create an account</a>
          so the deal is waiting when you come back.
        </p>
      {:else}
        <p class="fine"><a href="/account/offers">See it under Your offers</a></p>
      {/if}
    </div>
  {:else}
    <label class="bid-label" for="haggle-amount">Your offer</label>
    <div class="bid-row">
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
    </div>

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
        <p class="asking">We’ll send updates to {signedInEmail}.</p>
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
        <p class="error-text">Couldn’t send. Try again.</p>
      {/if}
    </form>
  {/if}
</section>

<style>
  .haggle {
    position: relative;
    margin-top: 28px;
    padding: 28px 22px 22px;
    background: var(--haggle-paper);
    color: var(--haggle-ink);
    border: 1px dashed var(--haggle-rule);
    border-radius: 12px;
  }

  .ribbon {
    position: absolute;
    top: -11px;
    left: 18px;
    padding: 4px 12px;
    background: var(--accent);
    color: #fff;
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .asking {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 8px;
  }

  .bid-label {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }

  .bid {
    display: block;
    width: 100%;
    border: none;
    background: transparent;
    font-family: var(--font-display);
    font-weight: 800;
    font-size: clamp(28px, 8vw, 42px);
    letter-spacing: -0.03em;
    line-height: 1;
    color: var(--haggle-ink);
    padding: 0;
    margin: 4px 0 8px;
  }

  .bid:focus {
    outline: none;
  }

  .throw {
    width: 100%;
  }

  .sent .bid {
    margin-bottom: 12px;
  }

  .fine {
    margin-top: 10px;
    font-size: 14px;
    color: var(--text-secondary);
  }

  .fine a {
    color: var(--accent);
    text-decoration: underline;
  }
</style>
