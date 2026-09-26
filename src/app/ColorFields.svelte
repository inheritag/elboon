<script lang="ts">
  import PhotoDropzone from './PhotoDropzone.svelte';

  type ColorDraft = { name: string; hex: string; stock: number; existing: string[] };

  let {
    initial = []
  }: {
    initial?: { name: string; hex: string; imageUrls: string[]; stockQty: number }[];
  } = $props();

  let colors = $state<ColorDraft[]>([]);
  let primed = $state(false);
  $effect.pre(() => {
    if (primed) return;
    colors =
      initial.length > 0
        ? initial.map((color) => ({
            name: color.name,
            hex: color.hex,
            stock: color.stockQty,
            existing: color.imageUrls
          }))
        : [];
    primed = true;
  });

  function add() {
    colors = [...colors, { name: '', hex: '#e31c25', stock: 0, existing: [] }];
  }

  function remove(index: number) {
    colors = colors.filter((_, i) => i !== index);
  }
</script>

<div class="colors">
  <div class="head">
    <p class="field-label">Colours</p>
    <button type="button" class="link" onclick={add}>Add a colour</button>
  </div>
  <p class="hint">Optional. Shoppers pick a colour, like on Amazon. Stock and photos can differ per colour.</p>

  {#each colors as _, i}
    <fieldset class="row">
      <legend>Colour {i + 1}</legend>
      <div class="grid">
        <div class="field">
          <label for="colorName-{i}">Name</label>
          <input id="colorName-{i}" name="colorName" bind:value={colors[i].name} placeholder="Black" />
        </div>
        <div class="field">
          <label for="colorHex-{i}">Swatch</label>
          <input id="colorHex-{i}" name="colorHex" type="color" bind:value={colors[i].hex} />
        </div>
        <div class="field">
          <label for="colorStock-{i}">Stock</label>
          <input id="colorStock-{i}" name="colorStock" type="number" min="0" step="1" bind:value={colors[i].stock} />
        </div>
      </div>
      <div class="field">
        <p class="field-label">Photos for this colour</p>
        <PhotoDropzone name="colorImages_{i}" keepName="colorKeep_{i}" existing={colors[i].existing} />
      </div>
      <button type="button" class="link" onclick={() => remove(i)}>Remove colour</button>
    </fieldset>
  {/each}
</div>

<style>
  .head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
  }

  .field-label {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 6px;
  }

  .hint {
    font-size: 13px;
    color: var(--text-secondary);
    margin: 0 0 12px;
  }

  .row {
    border: 1px solid var(--border);
    padding: 14px;
    margin-bottom: 12px;
  }

  legend {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 0 6px;
  }

  .grid {
    display: grid;
    grid-template-columns: 1fr 88px 100px;
    gap: 0 12px;
  }

  input[type='color'] {
    height: 42px;
    padding: 4px;
    background: var(--bg-subtle);
    border: 1px solid var(--border);
    width: 100%;
  }

  .link {
    background: none;
    border: none;
    color: var(--accent);
    cursor: pointer;
    padding: 0;
    font: inherit;
    text-decoration: underline;
  }

  @media (max-width: 640px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
</style>
