<script lang="ts">
  import { enhance } from '$app/forms';
  import { parseColors, parseSizes } from '../../../../../domain/product';
  import CategoryFields from '../../../../CategoryFields.svelte';
  import NumberStepper from '../../../../NumberStepper.svelte';
  import OfferToggle from '../../../../OfferToggle.svelte';
  import PhotoDropzone from '../../../../PhotoDropzone.svelte';
  import VariantFields from '../../../../VariantFields.svelte';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  let categoryChoice = $state('');
  let primed = $state(false);
  let price = $state(0);
  let stockQty = $state(0);
  let lowStockThreshold = $state(3);
  let sizeNames = $state<string[]>([]);
  let colorCount = $state(0);
  let hasVariants = $derived(sizeNames.length > 0 || colorCount > 0);
  $effect.pre(() => {
    if (primed) return;
    categoryChoice = data.product.category;
    price = Number((data.product.price_cents / 100).toFixed(2));
    stockQty = data.product.stock_qty;
    lowStockThreshold = data.product.low_stock_threshold;
    sizeNames = parseSizes(data.product.sizes).map((size) => size.name);
    primed = true;
  });
</script>

<section class="container edit-product">
  <p class="back"><a href="/admin/products">Products</a></p>
  <h1>Edit {data.product.name}</h1>

  <form method="POST" enctype="multipart/form-data" use:enhance class="card">
    <div class="field"><label for="name">Name</label><input id="name" name="name" value={data.product.name} required /></div>
    <CategoryFields categories={data.categories} bind:value={categoryChoice} />
    <div class="field">
      <label for="price">Price</label>
      <NumberStepper id="price" name="price" min={0.01} step={0.01} required bind:value={price} />
    </div>
    <div class="field">
      <p class="field-label">Photos</p>
      <PhotoDropzone existing={data.product.image_urls} />
    </div>
    <VariantFields
      initialSizes={parseSizes(data.product.sizes)}
      initialColors={parseColors(data.product.variants)}
      bind:sizeNames
      bind:colorCount
    />
    {#if hasVariants}
      <input type="hidden" name="stockQty" value="0" />
    {:else}
      <p class="fallback">One version of this product. Set the SKU and stock here.</p>
      <div class="field">
        <label for="sku">SKU <span class="optional-tag">Optional</span></label>
        <input id="sku" name="sku" value={data.product.sku ?? ''} />
      </div>
      <div class="field">
        <label for="stockQty">Stock qty</label>
        <NumberStepper id="stockQty" name="stockQty" min={0} step={1} bind:value={stockQty} />
      </div>
    {/if}
    <div class="field">
      <label for="lowStockThreshold">Low-stock threshold</label>
      <NumberStepper
        id="lowStockThreshold"
        name="lowStockThreshold"
        min={0}
        step={1}
        bind:value={lowStockThreshold}
      />
    </div>
    <OfferToggle checked={data.product.offer_enabled} />
    <div class="field"><label for="description">Description</label><textarea id="description" name="description" rows="3">{data.product.description}</textarea></div>

    <button class="btn btn-primary" type="submit">Save changes</button>
    {#if form?.error}
      <p class="error-text">{form.error}</p>
    {/if}
  </form>
</section>

<style>
  .edit-product {
    padding: 32px 0 64px;
    max-width: 800px;
  }

  .back {
    margin-bottom: 8px;
  }

  .back a {
    color: var(--accent);
    text-decoration: underline;
  }

  form {
    padding: 28px;
  }

  .field-label {
    font-size: 14px;
    font-weight: 800;
    margin-bottom: 8px;
  }

  .fallback {
    margin: 0 0 14px;
    color: var(--text-secondary);
  }

  .optional-tag {
    margin-left: 6px;
    vertical-align: 1px;
  }
</style>
