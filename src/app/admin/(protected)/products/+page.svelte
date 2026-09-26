<script lang="ts">
  import { enhance } from '$app/forms';
  import { formatPrice } from '../../../../domain/product';
  import { isLowStock } from '../../../../domain/stock';
  import ColorFields from '../../../ColorFields.svelte';
  import NumberStepper from '../../../NumberStepper.svelte';
  import OfferToggle from '../../../OfferToggle.svelte';
  import PhotoDropzone from '../../../PhotoDropzone.svelte';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  let categoryChoice = $state('__new__');
  let primed = $state(false);
  let price = $state<number | ''>('');
  let stockQty = $state(0);
  let lowStockThreshold = $state(3);
  $effect.pre(() => {
    if (primed) return;
    categoryChoice = data.categories[0]?.slug ?? '__new__';
    primed = true;
  });
</script>

<section class="container products-admin">
  <h1>Products</h1>
  <p class="lede">Upload catalogue items, set stock, and mark which ones accept offers.</p>

  <form method="POST" action="?/create" enctype="multipart/form-data" use:enhance class="card new-product-form">
    <h2>Upload product</h2>
    <div class="grid-2">
      <div class="field"><label for="name">Name</label><input id="name" name="name" required /></div>
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
      <div class="field listed">
        <label for="active">Listed for sale</label>
        <input id="active" name="active" type="checkbox" checked />
      </div>
    </div>
    <div class="field">
      <p class="field-label">Photos</p>
      <PhotoDropzone />
    </div>
    <ColorFields />
    <OfferToggle />
    <div class="field"><label for="description">Description</label><textarea id="description" name="description" rows="2"></textarea></div>
    <button class="btn btn-primary" type="submit">Add product</button>
    {#if form?.error}
      <p class="error-text">{form.error}</p>
    {/if}
  </form>

  <div class="table-scroll">
  <table class="product-table">
    <thead>
      <tr><th></th><th>Name</th><th>Price</th><th>Stock</th><th>Offers</th><th>Listed</th><th></th></tr>
    </thead>
    <tbody>
      {#each data.products as product}
        <tr>
          <td>
            {#if product.image_urls[0]}
              <img class="thumb" src={product.image_urls[0]} alt="" />
            {/if}
          </td>
          <td><a href="/admin/products/{product.id}">{product.name}</a></td>
          <td>{formatPrice(product.price_cents, product.currency)}</td>
          <td>
            {product.stock_qty}
            {#if isLowStock(product.stock_qty, product.low_stock_threshold)}
              <span class="badge badge-low-stock">{product.stock_qty} left</span>
            {/if}
          </td>
          <td>{product.offer_enabled ? 'Yes' : 'No'}</td>
          <td>
            <form method="POST" action="?/toggleActive" use:enhance>
              <input type="hidden" name="id" value={product.id} />
              <button class="link-button" type="submit">{product.active ? 'Yes' : 'No'}</button>
            </form>
          </td>
          <td>
            <form
              method="POST"
              action="?/delete"
              use:enhance={({ cancel }) => {
                if (!confirm('Delete this product from the shop?')) cancel();
              }}
            >
              <input type="hidden" name="id" value={product.id} />
              <button class="link-button" type="submit">Delete</button>
            </form>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
  </div>
</section>

<style>
  .products-admin {
    padding: 24px 0 48px;
  }

  .lede {
    color: var(--text-secondary);
    margin-bottom: 8px;
  }

  .new-product-form {
    padding: 20px;
    margin: 16px 0 32px;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 16px;
  }

  .field-label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 6px;
  }

  .listed input {
    width: auto;
  }

  @media (max-width: 640px) {
    .grid-2 {
      grid-template-columns: 1fr;
    }
  }

  .thumb {
    width: 40px;
    height: 40px;
    object-fit: cover;
    border-radius: 6px;
  }

  .product-table {
    width: 100%;
    border-collapse: collapse;
  }

  .product-table th,
  .product-table td {
    text-align: left;
    padding: 10px 12px;
    border-bottom: 1px solid var(--border);
    vertical-align: middle;
  }

  .link-button {
    background: none;
    border: none;
    color: var(--accent);
    cursor: pointer;
    padding: 0;
  }
</style>
