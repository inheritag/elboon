<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<section class="container edit-product">
  <p class="back"><a href="/admin/products">Products</a></p>
  <h1>Edit {data.product.name}</h1>

  <form method="POST" enctype="multipart/form-data" use:enhance class="card">
    {#if data.product.image_urls.length > 0}
      <p class="field-label">Photos</p>
      <p class="hint">Uncheck a photo to remove it.</p>
      <ul class="previews">
        {#each data.product.image_urls as url}
          <li>
            <img src={url} alt="" />
            <label>
              <input type="checkbox" name="keep" value={url} checked />
              Keep
            </label>
          </li>
        {/each}
      </ul>
    {/if}

    <div class="field">
      <label for="images">Add photos</label>
      <input id="images" name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple />
      <p class="hint">Front, side, extra views. One is fine.</p>
    </div>

    <div class="field"><label for="name">Name</label><input id="name" name="name" value={data.product.name} required /></div>
    <div class="field">
      <label for="category">Category</label>
      <select id="category" name="category" required>
        {#each data.categories as category}
          <option value={category.slug} selected={data.product.category === category.slug}>{category.label}</option>
        {/each}
      </select>
    </div>
    <div class="field">
      <label for="price">Price</label>
      <input id="price" name="price" type="number" min="0.01" step="0.01" value={(data.product.price_cents / 100).toFixed(2)} required />
    </div>
    <div class="field"><label for="stockQty">Stock qty</label><input id="stockQty" name="stockQty" type="number" min="0" value={data.product.stock_qty} /></div>
    <div class="field">
      <label for="lowStockThreshold">Low-stock threshold</label>
      <input id="lowStockThreshold" name="lowStockThreshold" type="number" min="0" value={data.product.low_stock_threshold} />
    </div>
    <div class="field">
      <label for="offerEnabled">Make-an-offer item</label>
      <input id="offerEnabled" name="offerEnabled" type="checkbox" checked={data.product.offer_enabled} />
    </div>
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
    color: var(--text-muted);
    margin: 0 0 10px;
  }

  .previews {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    list-style: none;
    margin-bottom: 16px;
  }

  .previews li {
    width: 96px;
  }

  .previews img {
    width: 96px;
    height: 96px;
    object-fit: cover;
    border-radius: var(--radius-sm);
    display: block;
    margin-bottom: 6px;
  }

  .previews label {
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
</style>
