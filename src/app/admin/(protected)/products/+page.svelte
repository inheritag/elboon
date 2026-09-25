<script lang="ts">
  import { enhance } from '$app/forms';
  import { CATEGORIES } from '../../../../domain/catalog';
  import { formatPrice } from '../../../../domain/product';
  import { isLowStock } from '../../../../domain/stock';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
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
        <select id="category" name="category" required>
          {#each CATEGORIES as category}
            <option value={category}>{category}</option>
          {/each}
        </select>
      </div>
      <div class="field"><label for="price">Price</label><input id="price" name="price" type="number" min="0.01" step="0.01" required /></div>
      <div class="field"><label for="stockQty">Stock qty</label><input id="stockQty" name="stockQty" type="number" min="0" value="0" /></div>
      <div class="field">
        <label for="lowStockThreshold">Low-stock threshold</label>
        <input id="lowStockThreshold" name="lowStockThreshold" type="number" min="0" value="3" />
      </div>
      <div class="field">
        <label for="images">Photos</label>
        <input id="images" name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple />
        <p class="hint">Front, side, extra views. One is fine.</p>
      </div>
      <div class="field">
        <label for="active">Listed for sale</label>
        <input id="active" name="active" type="checkbox" checked />
      </div>
      <div class="field">
        <label for="offerEnabled">Make-an-offer item</label>
        <input id="offerEnabled" name="offerEnabled" type="checkbox" />
      </div>
    </div>
    <div class="field"><label for="description">Description</label><textarea id="description" name="description" rows="2"></textarea></div>
    <button class="btn btn-primary" type="submit">Add product</button>
    {#if form?.error}
      <p class="error-text">{form.error}</p>
    {/if}
  </form>

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
</section>

<style>
  .products-admin {
    padding: 24px 0 48px;
  }

  .lede {
    color: var(--text-secondary);
    margin-bottom: 8px;
  }

  .hint {
    font-size: 13px;
    color: var(--text-muted);
    margin-top: 6px;
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
