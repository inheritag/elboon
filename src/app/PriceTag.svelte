<script lang="ts">
  import { formatPrice } from '../domain/product';

  let {
    cents,
    currency = 'GBP',
    wasCents = null,
    percent = 0,
    prefix = ''
  }: {
    cents: number;
    currency?: string;
    wasCents?: number | null;
    percent?: number;
    prefix?: string;
  } = $props();

  let cut = $derived(wasCents != null && percent > 0);
</script>

<span class="tag">
  {#if cut && wasCents != null}
    <span class="off">−{percent}%</span>
    <span class="was"><span class="sr-only">Was </span>{formatPrice(wasCents, currency)}</span>
    <span class="now">
      {#if prefix}{prefix} {/if}<span class="sr-only">Now </span>{formatPrice(cents, currency)}
    </span>
  {:else}
    <span class="now">{#if prefix}{prefix} {/if}{formatPrice(cents, currency)}</span>
  {/if}
</span>

<style>
  .tag {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 6px;
  }

  .now,
  .was,
  .off {
    white-space: nowrap;
  }

  .now {
    font-weight: 600;
    color: var(--text-primary);
  }

  .was {
    font-size: 0.85em;
    font-weight: 400;
    color: var(--text-secondary);
    text-decoration: line-through;
  }

  .off {
    font-size: 0.85em;
    font-weight: 600;
    color: var(--accent);
  }

  @media (forced-colors: active) {
    .now,
    .was {
      color: CanvasText;
    }

    .off {
      color: CanvasText;
      text-decoration: underline;
      text-underline-offset: 2px;
    }
  }
</style>
