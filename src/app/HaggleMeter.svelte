<script lang="ts">
  import { readHaggle } from '../domain/haggle';

  let {
    offerCents = $bindable(),
    askingCents,
    minCents = 0,
    interactive = false
  }: {
    offerCents: number;
    askingCents: number;
    minCents?: number;
    currency?: string;
    interactive?: boolean;
  } = $props();

  let read = $derived(readHaggle(offerCents, askingCents));
  let fill = $derived(Math.max(6, Math.min(100, (offerCents / Math.max(askingCents, 1)) * 100)));
</script>

<div class="meter" data-tone={read.tone} class:interactive>
  <div class="track">
    <div class="fill" style="width: {fill}%"></div>
    {#if interactive}
      <input
        class="range"
        type="range"
        min={minCents}
        max={askingCents}
        step="50"
        bind:value={offerCents}
        aria-label="Your offer"
      />
    {:else}
      <div class="knob" style="left: {fill}%"></div>
    {/if}
  </div>
  <p class="callout"><strong>{read.label}</strong> · {read.percentOfAsk}% of listed</p>
</div>

<style>
  .meter {
    margin: 4px 0 16px;
  }

  .track {
    position: relative;
    height: 14px;
    border-radius: 0;
    background: #e6e6e6;
    border: 1px solid var(--haggle-rule);
  }

  .fill {
    height: 100%;
    border-radius: 0;
    background: #111;
    pointer-events: none;
    transition: width 160ms ease, background 160ms ease;
  }

  .knob {
    position: absolute;
    top: 50%;
    width: 22px;
    height: 22px;
    margin-left: -11px;
    margin-top: -11px;
    border-radius: 50%;
    background: #fff;
    border: 3px solid #111;
    box-shadow: none;
    pointer-events: none;
  }

  .range {
    position: absolute;
    inset: -8px 0;
    width: 100%;
    margin: 0;
    background: none;
    appearance: none;
    cursor: pointer;
  }

  .range::-webkit-slider-runnable-track {
    height: 14px;
    background: transparent;
  }

  .range::-webkit-slider-thumb {
    appearance: none;
    width: 22px;
    height: 22px;
    margin-top: -4px;
    border-radius: 50%;
    background: #fff;
    border: 3px solid #111;
    box-shadow: none;
  }

  .range::-moz-range-track {
    height: 14px;
    background: transparent;
    border: none;
  }

  .range::-moz-range-thumb {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #fff;
    border: 3px solid #111;
    box-shadow: none;
  }

  .callout {
    margin-top: 10px;
    font-size: 14px;
    color: var(--haggle-ink);
  }

  .meter[data-tone='lowball'] .fill {
    background: #666;
  }
  .meter[data-tone='lowball'] .knob,
  .meter[data-tone='lowball'] .range::-webkit-slider-thumb,
  .meter[data-tone='lowball'] .range::-moz-range-thumb {
    border-color: #666;
  }

  @media (forced-colors: active) {
    .track {
      background: Canvas;
      border: 2px solid CanvasText;
    }

    .fill {
      background: Highlight;
    }

    .knob,
    .range::-webkit-slider-thumb,
    .range::-moz-range-thumb {
      background: Canvas;
      border: 3px solid CanvasText;
    }
  }
</style>
