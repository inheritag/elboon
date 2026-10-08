<script lang="ts">
  import type { ProductSize } from '../domain/product';
  import ColorFields from './ColorFields.svelte';
  import SizeFields from './SizeFields.svelte';

  type ColorInitial = {
    name: string;
    hex: string;
    imageUrls: string[];
    stockQty: number;
    sku?: string | null;
    sizeStocks?: { name: string; stockQty: number; sku?: string | null }[];
  };

  let {
    initialSizes = [],
    initialColors = [],
    sizeNames = $bindable<string[]>([]),
    colorCount = $bindable(0)
  }: {
    initialSizes?: ProductSize[];
    initialColors?: ColorInitial[];
    sizeNames?: string[];
    colorCount?: number;
  } = $props();
</script>

<section class="variants" aria-labelledby="variants-heading">
  <header class="variants-head">
    <h2 id="variants-heading">Colours and sizes</h2>
    <p>
      Optional. Add these only when the product comes in more than one version. Leave both empty and set stock on the
      product itself.
    </p>
  </header>
  <div class="panes">
    <div class="pane">
      <SizeFields initial={initialSizes} bind:names={sizeNames} showStock={colorCount === 0} />
    </div>
    <div class="pane">
      <ColorFields initial={initialColors} sizes={sizeNames} bind:count={colorCount} />
    </div>
  </div>
  {#if sizeNames.length > 0 && colorCount > 0}
    <p class="together">Stock is counted for each colour and size, inside the colour card.</p>
  {/if}
</section>

<style>
  .variants {
    container-type: inline-size;
    margin: 4px 0 var(--space-lg);
    padding: 22px 22px 20px;
    border-radius: var(--radius-lg);
    background: color-mix(in srgb, var(--bg-subtle) 72%, var(--surface));
    border: 1px solid var(--border);
  }

  .variants-head h2 {
    font-size: 22px;
  }

  .variants-head p {
    margin-top: 8px;
    max-width: 62ch;
    color: var(--text-secondary);
  }

  .panes {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
    margin-top: 20px;
  }

  .pane {
    min-width: 0;
    padding: 18px 18px 16px;
    border-radius: var(--radius-md);
    background: var(--surface);
    border: 1px solid var(--border);
  }

  .together {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
    color: var(--text-secondary);
    font-size: 14px;
  }

  @container (min-width: 680px) {
    .panes {
      grid-template-columns: 1fr 1fr;
      align-items: start;
      gap: 18px;
    }
  }
</style>
