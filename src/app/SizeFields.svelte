<script lang="ts">
  import { CLOTHING_SIZES, type ProductSize } from '../domain/product';

  let {
    initial = [],
    names = $bindable<string[]>([]),
    showStock = true
  }: {
    initial?: ProductSize[];
    names?: string[];
    showStock?: boolean;
  } = $props();

  let stocks = $state<number[]>([]);
  let skus = $state<string[]>([]);
  let custom = $state('');
  let primed = $state(false);
  $effect.pre(() => {
    if (primed) return;
    names = initial.map((size) => size.name);
    stocks = initial.map((size) => size.stockQty);
    skus = initial.map((size) => size.sku ?? '');
    primed = true;
  });

  function sync(next: string[], nextStocks?: number[], nextSkus?: string[]) {
    names = next;
    stocks = next.map((_, index) => nextStocks?.[index] ?? stocks[index] ?? 0);
    skus = next.map((_, index) => nextSkus?.[index] ?? skus[index] ?? '');
  }

  function addName(label: string) {
    const name = label.trim();
    if (!name) return;
    if (names.some((item) => item.toLowerCase() === name.toLowerCase())) return;
    sync([...names, name], [...stocks, 0]);
  }

  function togglePreset(preset: string) {
    const index = names.findIndex((item) => item.toLowerCase() === preset.toLowerCase());
    if (index >= 0) {
      remove(index);
      return;
    }
    addName(preset);
  }

  function remove(index: number) {
    sync(
      names.filter((_, i) => i !== index),
      stocks.filter((_, i) => i !== index),
      skus.filter((_, i) => i !== index)
    );
  }

  function addCustom() {
    addName(custom);
    custom = '';
  }
</script>

<div class="sizes">
  <div class="head">
    <p class="field-label" id="sizes-label">Sizes</p>
    <span class="optional-tag">Optional</span>
  </div>
  <p class="hint">Pick the ones you sell, or type your own. Skip this for one size.</p>
  <div class="presets" role="group" aria-labelledby="sizes-label">
    {#each CLOTHING_SIZES as preset}
      <button
        type="button"
        class="chip"
        class:on={names.some((name) => name.toLowerCase() === preset.toLowerCase())}
        aria-pressed={names.some((name) => name.toLowerCase() === preset.toLowerCase())}
        onclick={() => togglePreset(preset)}>{preset}</button
      >
    {/each}
  </div>
  <div class="custom">
    <label class="sr-only" for="size-custom">Custom size</label>
    <input
      id="size-custom"
      bind:value={custom}
      placeholder="90 cm, 1.5 m, 32…"
      onkeydown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          addCustom();
        }
      }}
    />
    <button type="button" class="quiet-add" onclick={addCustom}>Add size</button>
  </div>

  {#if !showStock && names.length > 0}
    <p class="moved">Stock for these sizes is set on each colour.</p>
  {/if}

  <ul class="rows">
    {#each names as name, i}
      <li class="row" class:simple={!showStock}>
        <div class="cell">
          <label for="sizeName-{i}">Size</label>
          <input id="sizeName-{i}" name="sizeName" bind:value={names[i]} placeholder="M" />
        </div>
        {#if showStock}
          <div class="cell">
            <label for="sizeSku-{i}">SKU</label>
            <input id="sizeSku-{i}" name="sizeSku" bind:value={skus[i]} placeholder="Optional" />
          </div>
          <div class="cell">
            <label for="sizeStock-{i}">Stock</label>
            <input
              id="sizeStock-{i}"
              name="sizeStock"
              type="number"
              min="0"
              step="1"
              bind:value={stocks[i]}
            />
          </div>
        {:else}
          <input type="hidden" name="sizeSku" value="" />
          <input type="hidden" name="sizeStock" value="0" />
        {/if}
        <button type="button" class="remove" onclick={() => remove(i)}>Remove</button>
      </li>
    {/each}
  </ul>
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
  .moved {
    margin: 8px 0 14px;
    color: var(--text-secondary);
    font-size: 14px;
  }

  .moved {
    margin-bottom: 12px;
  }

  .presets {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 14px;
  }

  .chip {
    border: 1.5px solid var(--border);
    border-radius: 0;
    background: var(--surface);
    color: var(--text-primary);
    padding: 8px 14px;
    font: inherit;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
  }

  .chip.on {
    border-color: var(--ink);
    background: var(--ink);
    color: #fff;
  }

  .custom {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    margin-bottom: 16px;
  }

  .custom input {
    flex: 1 1 160px;
    max-width: 240px;
    padding: 10px 12px;
    border: 1.5px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface);
    color: var(--text-primary);
    font: inherit;
  }

  .rows {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .row.simple {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 12px;
    align-items: end;
    padding: 12px;
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--bg) 55%, var(--surface));
    border: 1px solid var(--border);
  }

  .cell label {
    display: block;
    margin-bottom: 6px;
    font-size: 12px;
    font-weight: 800;
    color: var(--text-secondary);
  }

  .row input {
    width: 100%;
    padding: 10px 12px;
    border: 1.5px solid var(--border);
    border-radius: 0;
    background: var(--surface);
    color: var(--text-primary);
    font: inherit;
  }

  .remove {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 10px 2px;
    font: inherit;
    font-size: 13px;
    font-weight: 800;
  }

  .remove:hover {
    color: var(--accent);
  }

  @media (max-width: 420px) {
    .row:not(.simple) {
      grid-template-columns: 1fr;
    }
  }
</style>
