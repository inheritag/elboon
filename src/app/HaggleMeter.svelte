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
  <p class="callout"><strong>{read.label}</strong> · {read.percentOfAsk}% of listed. {read.hint}</p>
</div>

<style>
  .meter {
    margin: 4px 0 16px;
  }

  .track {
    position: relative;
    height: 14px;
    border-radius: 999px;
    background: #ead8c0;
    border: 1px solid var(--haggle-rule);
  }

  .fill {
    height: 100%;
    border-radius: 999px;
    background: var(--accent);
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
    background: var(--bg-subtle);
    border: 3px solid var(--accent);
    box-shadow: var(--shadow-sm);
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
    background: var(--bg-subtle);
    border: 3px solid var(--accent);
    box-shadow: var(--shadow-sm);
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
    background: var(--bg-subtle);
    border: 3px solid var(--accent);
    box-shadow: var(--shadow-sm);
  }

  .callout {
    margin-top: 10px;
    font-size: 14px;
    color: var(--haggle-ink);
  }

  .meter[data-tone='lowball'] .fill {
    background: #9ca3af;
  }
  .meter[data-tone='lowball'] .knob,
  .meter[data-tone='lowball'] .range::-webkit-slider-thumb,
  .meter[data-tone='lowball'] .range::-moz-range-thumb {
    border-color: #6b7280;
  }
  .meter[data-tone='serious'] .fill {
    background: var(--haggle-gold);
  }
  .meter[data-tone='serious'] .knob,
  .meter[data-tone='serious'] .range::-webkit-slider-thumb,
  .meter[data-tone='serious'] .range::-moz-range-thumb {
    border-color: var(--haggle-gold);
  }
  .meter[data-tone='close'] .fill,
  .meter[data-tone='asking'] .fill {
    background: var(--haggle-green);
  }
  .meter[data-tone='close'] .knob,
  .meter[data-tone='asking'] .knob,
  .meter[data-tone='close'] .range::-webkit-slider-thumb,
  .meter[data-tone='asking'] .range::-webkit-slider-thumb,
  .meter[data-tone='close'] .range::-moz-range-thumb,
  .meter[data-tone='asking'] .range::-moz-range-thumb {
    border-color: var(--haggle-green);
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
