<script lang="ts">
  import { salePrice } from '../domain/price';
  import NumberStepper from './NumberStepper.svelte';
  import PriceTag from './PriceTag.svelte';

  let {
    id = 'discount',
    name = 'discount',
    value = $bindable<number | ''>(0),
    price = 0
  }: {
    id?: string;
    name?: string;
    value?: number | '';
    price?: number | '';
  } = $props();

  let preview = $derived.by(() => {
    const pounds = typeof price === 'number' ? price : Number(price);
    const percent = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(pounds) || pounds <= 0) return null;
    const sale = salePrice(Math.round(pounds * 100), Number.isFinite(percent) ? percent : 0);
    return sale.wasCents != null ? sale : null;
  });
</script>

<div class="field">
  <label for={id}>Discount %</label>
  <NumberStepper {id} {name} min={0} max={90} step={1} bind:value />
  <p class="hint">Taken off the price. Shoppers see the old price crossed out.</p>
  {#if preview}
    <p class="preview">
      <PriceTag cents={preview.priceCents} wasCents={preview.wasCents} percent={preview.discountPercent} />
    </p>
  {/if}
</div>

<style>
  .hint {
    margin: 8px 0 0;
    color: var(--text-secondary);
    font-size: 13px;
  }

  .preview {
    margin: 10px 0 0;
  }
</style>
