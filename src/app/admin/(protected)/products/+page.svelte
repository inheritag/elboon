<script lang="ts">
  import { enhance } from '$app/forms';
  import { categoryPath } from '../../../../domain/catalog';
  import { formatPrice } from '../../../../domain/product';
  import CategoryFields from '../../../CategoryFields.svelte';
  import NumberStepper from '../../../NumberStepper.svelte';
  import OfferToggle from '../../../OfferToggle.svelte';
  import PhotoDropzone from '../../../PhotoDropzone.svelte';
  import VariantFields from '../../../VariantFields.svelte';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  let categoryChoice = $state('__new__');
  let primed = $state(false);
  let price = $state<number | ''>('');
  let stockQty = $state(0);
  let lowStockThreshold = $state(3);
  let sizeNames = $state<string[]>([]);
  let colorCount = $state(0);
  let hasVariants = $derived(sizeNames.length > 0 || colorCount > 0);
  let find = $state('');
  let showUpload = $state(false);
  let visible = $derived(
    data.products.filter((product) => {
      const needle = find.trim().toLowerCase();
      if (!needle) return true;
      return `${product.name} ${product.category} ${categoryPath(product.category, data.categories)} ${(data.stock[product.id]?.skus ?? []).join(' ')}`
        .toLowerCase()
        .includes(needle);
    })
  );
  $effect.pre(() => {
    if (primed) return;
    categoryChoice = data.categories[0]?.slug ?? '__new__';
    showUpload = data.listed.listingCount === 0;
    primed = true;
  });
  $effect(() => {
    if (form?.error) showUpload = true;
  });
</script>

<section class="container products-admin">
  <div class="products-head">
    <div>
      <h1>Products</h1>
      {#if data.listed.listingCount === 0}
        <p class="lede">Nothing listed yet.</p>
      {:else}
        <p class="lede">
          {data.listed.listingCount}
          {data.listed.listingCount === 1 ? 'item' : 'items'} listed · worth
          {formatPrice(data.listed.worthCents, data.listed.currency)} · {data.listed.unitCount}
          {data.listed.unitCount === 1 ? 'unit' : 'units'} at listed prices.
        </p>
      {/if}
    </div>
    <button type="button" class="btn btn-primary add-btn" onclick={() => (showUpload = !showUpload)}>
      {showUpload ? 'Close' : 'Add product'}
    </button>
  </div>

  {#if showUpload}
  <form
    method="POST"
    action="?/create"
    enctype="multipart/form-data"
    use:enhance={() => {
      return async ({ result, update }) => {
        await update();
        if (result.type === 'success') showUpload = false;
      };
    }}
    class="card new-product-form"
  >
    <h2>Upload product</h2>
    <div class="grid-2">
      <div class="field"><label for="name">Name</label><input id="name" name="name" required /></div>
      <CategoryFields categories={data.categories} bind:value={categoryChoice} />
      <div class="field">
        <label for="price">Price</label>
        <NumberStepper id="price" name="price" min={0.01} step={0.01} required bind:value={price} />
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
    <VariantFields bind:sizeNames bind:colorCount />
    {#if hasVariants}
      <input type="hidden" name="stockQty" value="0" />
    {:else}
      <p class="fallback">One version of this product. Set the SKU and stock here.</p>
      <div class="grid-2">
        <div class="field">
          <label for="sku">SKU <span class="optional-tag">Optional</span></label>
          <input id="sku" name="sku" />
        </div>
        <div class="field">
          <label for="stockQty">Stock qty</label>
          <NumberStepper id="stockQty" name="stockQty" min={0} step={1} bind:value={stockQty} />
        </div>
      </div>
    {/if}
    <OfferToggle />
    <div class="field"><label for="description">Description</label><textarea id="description" name="description" rows="2"></textarea></div>
    <button class="btn btn-primary" type="submit">Add product</button>
    {#if form?.error}
      <p class="error-text">{form.error}</p>
    {/if}
  </form>
  {/if}

  <div class="table-scroll">
  <div class="find-row field">
    <label class="sr-only" for="find">Find in catalogue</label>
    <input id="find" type="search" placeholder="Find in catalogue" bind:value={find} />
    {#if find.trim()}
      <p class="find-count">{visible.length} of {data.products.length}</p>
    {/if}
  </div>
  <table class="product-table">
    <thead>
      <tr><th></th><th>Name</th><th>Price</th><th>Stock</th><th>Offers</th><th>Listed</th><th></th></tr>
    </thead>
    <tbody>
      {#each visible as product}
        <tr>
          <td>
            {#if product.image_urls[0]}
              <img class="thumb" src={product.image_urls[0]} alt="" />
            {/if}
          </td>
          <td><a href="/admin/products/{product.id}">{product.name}</a></td>
          <td>{formatPrice(product.price_cents, product.currency)}</td>
          <td>
            {#if data.stock[product.id]}
              {data.stock[product.id].available} free
              {#if data.stock[product.id].held > 0}
                <span class="muted">· {data.stock[product.id].held} held</span>
              {/if}
              {#if data.stock[product.id].out}
                <span class="badge badge-low-stock">Out</span>
              {:else if data.stock[product.id].low}
                <span class="badge badge-low-stock">Low</span>
              {/if}
            {:else}
              {product.stock_qty}
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
    padding: 32px 0 64px;
  }

  .products-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    flex-wrap: wrap;
    margin-bottom: 28px;
  }

  .add-btn {
    width: auto;
  }

  .lede {
    color: var(--text-secondary);
    margin-bottom: 0;
  }

  .find-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  .find-row input {
    max-width: 280px;
    border-radius: 999px;
  }

  .find-count {
    margin: 0;
    font-size: 13px;
    color: var(--text-secondary);
  }

  .new-product-form {
    padding: 28px;
    margin: 8px 0 40px;
  }

  .new-product-form h2 {
    margin-bottom: 18px;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 20px;
  }

  .field-label {
    display: block;
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
    border-radius: 10px;
  }

  .product-table {
    width: 100%;
    border-collapse: collapse;
  }

  .product-table th,
  .product-table td {
    text-align: left;
    padding: 16px 14px;
    border-bottom: 1px solid var(--border);
    vertical-align: middle;
  }

  .muted {
    color: var(--text-secondary);
    font-size: 13px;
  }

  .link-button {
    background: none;
    border: none;
    color: var(--accent);
    cursor: pointer;
    padding: 0;
  }
</style>
