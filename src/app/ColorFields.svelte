<script lang="ts">
  import PhotoDropzone from './PhotoDropzone.svelte';

  type ColorDraft = {
    name: string;
    hex: string;
    stock: number;
    existing: string[];
    sku: string;
    sizeStocks: Record<string, number>;
    sizeSkus: Record<string, string>;
  };

  let {
    initial = [],
    sizes = [],
    count = $bindable(0)
  }: {
    initial?: {
      name: string;
      hex: string;
      imageUrls: string[];
      stockQty: number;
      sku?: string | null;
      sizeStocks?: { name: string; stockQty: number; sku?: string | null }[];
    }[];
    sizes?: string[];
    count?: number;
  } = $props();

  let colors = $state<ColorDraft[]>([]);
  let primed = $state(false);
  $effect.pre(() => {
    if (primed) return;
    colors = initial.map((color) => ({
      name: color.name,
      hex: color.hex,
      stock: color.stockQty,
      existing: color.imageUrls,
      sku: color.sku ?? '',
      sizeStocks: Object.fromEntries((color.sizeStocks ?? []).map((entry) => [entry.name, entry.stockQty])),
      sizeSkus: Object.fromEntries((color.sizeStocks ?? []).map((entry) => [entry.name, entry.sku ?? '']))
    }));
    count = colors.length;
    primed = true;
  });

  $effect(() => {
    count = colors.length;
    for (const color of colors) {
      for (const size of sizes) {
        if (typeof color.sizeStocks[size] !== 'number') color.sizeStocks[size] = 0;
        if (typeof color.sizeSkus[size] !== 'string') color.sizeSkus[size] = '';
      }
    }
  });

  function add() {
    colors = [
      ...colors,
      {
        name: '',
        hex: '#c9846a',
        stock: 0,
        existing: [],
        sku: '',
        sizeStocks: Object.fromEntries(sizes.map((size) => [size, 0])),
        sizeSkus: Object.fromEntries(sizes.map((size) => [size, '']))
      }
    ];
  }

  function remove(index: number) {
    colors = colors.filter((_, i) => i !== index);
  }
</script>

<div class="colors">
  <div class="head">
    <p class="field-label" id="colours-label">Colours</p>
    <span class="optional-tag">Optional</span>
  </div>
  <p class="hint" id="colours-hint">A name and a swatch. Photos can differ for each colour.</p>
  {#if colors.length === 0}
    <div class="empty">
      <p>No colours yet.</p>
      <button type="button" class="quiet-add" onclick={add}>Add a colour</button>
    </div>
  {:else}
    {#each colors as _, i}
      <fieldset class="row" aria-label="Colour {i + 1}">
        <div class="row-head">
          <p>Colour {i + 1}</p>
          <button type="button" class="remove" onclick={() => remove(i)}>Remove</button>
        </div>
        <div class="identity">
          <div class="field">
            <label for="colorHex-{i}">Swatch</label>
            <input id="colorHex-{i}" name="colorHex" type="color" bind:value={colors[i].hex} />
          </div>
          <div class="field">
            <label for="colorName-{i}">Name</label>
            <input id="colorName-{i}" name="colorName" bind:value={colors[i].name} placeholder="Black" />
          </div>
        </div>
        {#if sizes.length === 0}
          <div class="details">
            <div class="field">
              <label for="colorSku-{i}">SKU</label>
              <input id="colorSku-{i}" name="colorSku" bind:value={colors[i].sku} placeholder="Optional" />
            </div>
            <div class="field">
              <label for="colorStock-{i}">Stock</label>
              <input id="colorStock-{i}" name="colorStock" type="number" min="0" step="1" bind:value={colors[i].stock} />
            </div>
          </div>
        {:else}
          <input type="hidden" name="colorSku" value="" />
          <input type="hidden" name="colorStock" value="0" />
        {/if}
        {#if sizes.length > 0}
          <div class="size-stocks">
            <p class="field-label">Stock for each size</p>
            <div class="size-grid">
              {#each sizes as size, s}
                <div class="field">
                  <label for="colorSize-{i}-{s}">{size}</label>
                  <input
                    id="colorSize-{i}-{s}"
                    name="colorSizeStock_{i}"
                    type="number"
                    min="0"
                    step="1"
                    bind:value={colors[i].sizeStocks[size]}
                    aria-label="Stock for {colors[i].name} {size}"
                  />
                  <input
                    name="colorSizeSku_{i}"
                    bind:value={colors[i].sizeSkus[size]}
                    placeholder="SKU, optional"
                    aria-label="SKU for {colors[i].name} {size}"
                  />
                </div>
              {/each}
            </div>
          </div>
        {/if}
        <div class="field photos">
          <p class="field-label">Photos for this colour</p>
          <PhotoDropzone name="colorImages_{i}" keepName="colorKeep_{i}" existing={colors[i].existing} />
        </div>
      </fieldset>
    {/each}
    <button type="button" class="quiet-add" onclick={add}>Add another colour</button>
  {/if}
</div>

<style>
  .head {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .field-label {
    font-size: 15px;
    font-weight: 800;
    margin: 0;
  }

  .hint,
  .empty p {
    margin: 8px 0 14px;
    color: var(--text-secondary);
    font-size: 14px;
  }

  .empty {
    padding: 8px 0 4px;
  }

  .row {
    min-inline-size: 0;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 16px 16px 8px;
    margin: 0 0 16px;
    background: color-mix(in srgb, var(--bg) 55%, var(--surface));
  }

  .row-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
  }

  .row-head p {
    font-family: var(--font-display);
    font-size: 18px;
    font-weight: 560;
  }

  .identity,
  .details {
    display: grid;
    gap: 16px;
    align-items: end;
  }

  .identity {
    grid-template-columns: 72px minmax(0, 1fr);
  }

  .details {
    grid-template-columns: minmax(0, 1fr) 120px;
    margin-bottom: 8px;
  }

  .identity .field,
  .details .field,
  .size-grid .field {
    margin-bottom: 0;
  }

  .size-stocks {
    margin: 18px 0 8px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
  }

  .size-stocks .field-label {
    margin-bottom: 12px;
  }

  .size-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 16px;
  }

  .size-grid input + input {
    margin-top: 8px;
  }

  .photos {
    margin-top: 18px;
  }

  input[type='color'] {
    appearance: none;
    width: 48px;
    height: 48px;
    padding: 0;
    border: 1.5px solid var(--border);
    border-radius: 50%;
    background: none;
    cursor: pointer;
    overflow: hidden;
  }

  input[type='color']::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  input[type='color']::-webkit-color-swatch {
    border: none;
    border-radius: 50%;
  }

  input[type='color']::-moz-color-swatch {
    border: none;
    border-radius: 50%;
  }

  input[type='color']:focus-visible {
    outline: 2px solid var(--ink);
    outline-offset: 3px;
  }

  .remove {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 6px 0;
    font: inherit;
    font-size: 13px;
    font-weight: 800;
  }

  .remove:hover {
    color: var(--ink);
  }

  .quiet-add {
    margin-top: 2px;
  }

  @media (max-width: 640px) {
    .details {
      grid-template-columns: 1fr;
    }
  }
</style>
