<script lang="ts">
  import { enhance } from '$app/forms';
  import { parseColors } from '../../../../../domain/product';
  import ColorFields from '../../../../ColorFields.svelte';
  import NumberStepper from '../../../../NumberStepper.svelte';
  import OfferToggle from '../../../../OfferToggle.svelte';
  import PhotoDropzone from '../../../../PhotoDropzone.svelte';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  let categoryChoice = $state('');
  let primed = $state(false);
  let price = $state(0);
  let stockQty = $state(0);
  let lowStockThreshold = $state(3);
  $effect.pre(() => {
    if (primed) return;
    categoryChoice = data.product.category;
    price = Number((data.product.price_cents / 100).toFixed(2));
    stockQty = data.product.stock_qty;
    lowStockThreshold = data.product.low_stock_threshold;
    primed = true;
  });
</script>

<section class="container edit-product">
  <p class="back"><a href="/admin/products">Products</a></p>
  <h1>Edit {data.product.name}</h1>

  <form method="POST" enctype="multipart/form-data" use:enhance class="card">
    <div class="field">
      <p class="field-label">Photos</p>
      <p class="hint">Uncheck a photo to remove it. Drop more below.</p>
      <PhotoDropzone existing={data.product.image_urls} />
    </div>
    <ColorFields initial={parseColors(data.product.variants)} />

    <div class="field"><label for="name">Name</label><input id="name" name="name" value={data.product.name} required /></div>
    <div class="field">
      <label for="category">Category</label>
      <select id="category" name="category" required bind:value={categoryChoice}>
        {#each data.categories as category}
          <option value={category.slug}>{category.label}</option>
        {/each}
        <option value="__new__">Add category…</option>
      </select>
      {#if categoryChoice === '__new__'}
        <input name="newCategory" required placeholder="New category name" />
      {/if}
    </div>
    <div class="field">
      <label for="price">Price</label>
      <NumberStepper id="price" name="price" min={0.01} step={0.01} required bind:value={price} />
    </div>
    <div class="field">
      <label for="stockQty">Stock qty</label>
      <NumberStepper id="stockQty" name="stockQty" min={0} step={1} bind:value={stockQty} />
    </div>
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
    padding: 24px 0 48px;
    max-width: 560px;
  }

  .back {
    margin-bottom: 8px;
  }

  .back a {
    color: var(--accent);
    text-decoration: underline;
  }

  form {
    padding: 20px;
  }

  .field-label {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 6px;
  }

  .hint {
    font-size: 13px;
    color: var(--text-secondary);
    margin: 0 0 10px;
  }
</style>
