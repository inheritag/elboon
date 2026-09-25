<script lang="ts">
  import { goto } from '$app/navigation';
  import { formatPrice } from '../../../domain/product';
  import { addToCart, originFromEvent } from '../../cart';
  import HagglePanel from '../../HagglePanel.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let selectedImage = $state(0);
  let quantity = $state(1);
  let added = $state(false);

  let inStock = $derived(data.product.stockQty > 0);
  let lowStock = $derived(data.product.stockQty <= data.product.lowStockThreshold);
  let maxQty = $derived(Math.max(1, data.product.stockQty));
  let images = $derived(data.product.imageUrls);

  function line() {
    return {
      productId: data.product.id,
      name: data.product.name,
      unitPriceCents: data.product.priceCents,
      imageUrl: data.product.imageUrls[0] ?? null
    };
  }

  function qty(): number {
    return Math.min(Math.max(1, quantity), maxQty);
  }

  function bump(delta: number) {
    quantity = Math.min(Math.max(1, quantity + delta), maxQty);
  }

  function add(event: Event) {
    addToCart(line(), qty(), originFromEvent(event));
    added = true;
    setTimeout(() => (added = false), 1400);
  }

  async function buyNow() {
    addToCart(line(), qty());
    await goto('/checkout');
  }
</script>

<article class="container product-detail">
  <div class="gallery">
    {#if images[selectedImage]}
      <img src={images[selectedImage]} alt={data.product.name} />
    {:else}
      <div class="image-placeholder"></div>
    {/if}
    {#if images.length > 1}
      <div class="thumbs">
        {#each images as url, i}
          <button
            class="thumb"
            class:active={selectedImage === i}
            type="button"
            onclick={() => (selectedImage = i)}
            aria-label="View image {i + 1}"
          >
            <img src={url} alt="" />
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <div class="info">
    <p class="category"><a href="/?category={data.product.category}">{data.product.category}</a></p>
    <h1>{data.product.name}</h1>
    <p class="price">{formatPrice(data.product.priceCents, data.product.currency)}</p>

    <div class="buy-box">
      {#if inStock}
        {#if lowStock}
          <p class="stock urgency">Only {data.product.stockQty} left</p>
        {:else}
          <p class="stock in">In stock</p>
        {/if}
      {:else}
        <p class="stock out">Out of stock</p>
      {/if}
      <p class="dispatch">Delivered by a logistics partner. We don’t ship from our own warehouse.</p>

      {#if inStock}
        <div class="qty">
          <span class="qty-label" id="qty-label">Quantity</span>
          <div class="stepper" role="group" aria-labelledby="qty-label">
            <button type="button" class="step" onclick={() => bump(-1)} disabled={quantity <= 1} aria-label="Decrease quantity">
              -
            </button>
            <span class="count" aria-live="polite">{quantity}</span>
            <button type="button" class="step" onclick={() => bump(1)} disabled={quantity >= maxQty} aria-label="Increase quantity">
              +
            </button>
          </div>
        </div>

        <button class="btn btn-primary" class:added type="button" onclick={add}>
          {added ? 'Added to cart' : 'Add to cart'}
        </button>
        <button class="btn btn-secondary buy-now" type="button" onclick={buyNow}>Buy now</button>
      {/if}
    </div>

    {#if data.product.offerEnabled}
      <HagglePanel
        productId={data.product.id}
        productName={data.product.name}
        askingCents={data.product.priceCents}
        currency={data.product.currency}
        signedInEmail={data.customer?.email ?? null}
      />
    {/if}

    <section class="about">
      <h2>About this item</h2>
      <p class="description">{data.product.description}</p>
    </section>
  </div>
</article>

{#if data.related.length > 0}
  <section class="container related">
    <h2>You might also like</h2>
    <div class="related-grid">
      {#each data.related as product}
        <a class="card related-card" href="/product/{product.id}">
          {#if product.imageUrl}
            <img src={product.imageUrl} alt={product.name} />
          {:else}
            <div class="related-placeholder"></div>
          {/if}
          <div class="related-body">
            <h3>{product.name}</h3>
            <p>{formatPrice(product.priceCents, product.currency)}</p>
          </div>
        </a>
      {/each}
    </div>
  </section>
{/if}

<style>
  .product-detail {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    padding: 32px 0;
    align-items: start;
  }

  .gallery img,
  .image-placeholder {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    border-radius: var(--radius-lg);
    background: var(--bg-subtle);
  }

  .thumbs {
    display: flex;
    gap: 8px;
    margin-top: 10px;
    flex-wrap: wrap;
  }

  .thumb {
    width: 56px;
    height: 56px;
    padding: 0;
    border: 2px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    background: #fff;
    cursor: pointer;
  }

  .thumb.active {
    border-color: var(--accent);
  }

  .thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 0;
  }

  .category {
    font-size: 13px;
    font-weight: 600;
    text-transform: capitalize;
    color: var(--accent);
    margin-bottom: 6px;
  }

  .price {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 800;
    color: var(--text-primary);
    margin: 8px 0 16px;
  }

  .buy-box {
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 16px 18px 18px;
    box-shadow: var(--shadow-sm);
  }

  .stock {
    font-weight: 700;
    margin-bottom: 4px;
  }

  .stock.in {
    color: var(--haggle-green);
  }

  .stock.out {
    color: var(--accent);
  }

  .urgency {
    color: var(--accent);
  }

  .dispatch {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 14px;
  }

  .qty {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 12px;
  }

  .qty-label {
    font-size: 14px;
    font-weight: 600;
  }

  .stepper {
    display: inline-flex;
    align-items: center;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  .step {
    width: 36px;
    height: 36px;
    border: none;
    background: var(--bg-subtle);
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    color: var(--text-primary);
  }

  .step:hover:not(:disabled) {
    background: #eee;
  }

  .step:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .count {
    min-width: 36px;
    text-align: center;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .buy-box .btn {
    width: 100%;
    margin-top: 8px;
  }

  .buy-box .btn.added {
    background: var(--haggle-green);
    animation: added-pop 400ms ease;
  }

  @keyframes added-pop {
    0% {
      transform: scale(1);
    }
    40% {
      transform: scale(1.04);
    }
    100% {
      transform: scale(1);
    }
  }

  .about {
    margin-top: 28px;
  }

  .about h2 {
    font-size: 18px;
    margin-bottom: 8px;
  }

  .description {
    color: var(--text-secondary);
  }

  .related {
    padding: 8px 0 48px;
  }

  .related-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 16px;
    margin-top: 12px;
  }

  .related-card {
    overflow: hidden;
    transition: transform 180ms ease, box-shadow 180ms ease;
  }

  .related-card:hover {
    color: inherit;
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .related-card img,
  .related-placeholder {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    background: var(--bg-subtle);
  }

  .related-body {
    padding: 12px 14px 16px;
  }

  .related-body h3 {
    font-size: 15px;
  }

  @media (max-width: 720px) {
    .product-detail {
      grid-template-columns: 1fr;
    }
  }
</style>
