<script lang="ts">
  import { goto } from '$app/navigation';
  import { formatPrice, stockFor } from '../../../domain/product';
  import { addToCart, originFromEvent } from '../../cart';
  import HagglePanel from '../../HagglePanel.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  function firstColor(): string | null {
    return data.product.colors.find((color) => colorFree(color.name) > 0)?.name ?? data.product.colors[0]?.name ?? null;
  }

  function firstSize(color: string | null): string | null {
    return (
      data.product.sizes.find((size) => freeFor(color, size.name) > 0)?.name ?? data.product.sizes[0]?.name ?? null
    );
  }

  let selectedImage = $state(0);
  let quantity = $state(1);
  let added = $state(false);
  let selectedColor = $state<string | null>(firstColor());
  let selectedSize = $state<string | null>(firstSize(firstColor()));

  function heldQty(color: string | null, size: string | null): number {
    return (
      data.holds.find(
        (hold) => (hold.color ?? null) === (color ?? null) && (hold.size ?? null) === (size ?? null)
      )?.held ?? 0
    );
  }

  function freeFor(color: string | null, size: string | null): number {
    return Math.max(0, stockFor(data.product, color, size) - heldQty(color, size));
  }

  function colorFree(name: string): number {
    if (data.product.sizes.length > 0) {
      return data.product.sizes.reduce((sum, size) => sum + freeFor(name, size.name), 0);
    }
    return freeFor(name, null);
  }

  let selected = $derived(data.product.colors.find((color) => color.name === selectedColor) ?? null);
  let images = $derived(selected && selected.imageUrls.length > 0 ? selected.imageUrls : data.product.imageUrls);
  let stockQty = $derived(freeFor(selectedColor, selectedSize));
  let inStock = $derived(stockQty > 0);
  let lowStock = $derived(stockQty > 0 && stockQty <= data.product.lowStockThreshold);
  let maxQty = $derived(Math.max(1, stockQty));

  function line() {
    return {
      productId: data.product.id,
      name: data.product.name,
      unitPriceCents: data.product.priceCents,
      imageUrl: images[0] ?? null,
      color: selectedColor,
      size: selectedSize
    };
  }

  function pickSize(name: string) {
    selectedSize = name;
    quantity = 1;
  }

  function pickColor(name: string) {
    selectedColor = name;
    selectedImage = 0;
    quantity = 1;
    if (data.product.sizes.length > 0) {
      const current = selectedSize;
      if (!current || freeFor(name, current) <= 0) {
        selectedSize = firstSize(name);
      }
    }
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
    <p class="category"><a href="/?category={data.product.category}">{data.categoryLabel}</a></p>
    <h1>{data.product.name}</h1>
    <p class="price">{formatPrice(data.product.priceCents, data.product.currency)}</p>

    {#if data.product.colors.length > 0}
      <div class="colours">
        <p class="colour-label">Colour: <strong>{selectedColor ?? 'Choose'}</strong></p>
        <div class="swatches" role="listbox" aria-label="Colour">
          {#each data.product.colors as color}
            <button
              type="button"
              class="swatch"
              class:active={selectedColor === color.name}
              class:gone={colorFree(color.name) <= 0}
              style="--swatch:{color.hex}"
              aria-label={color.name}
              aria-pressed={selectedColor === color.name}
              onclick={() => pickColor(color.name)}
            ></button>
          {/each}
        </div>
      </div>
    {/if}

    {#if data.product.sizes.length > 0}
      <div class="sizes">
        <p class="colour-label">Size: <strong>{selectedSize ?? 'Choose'}</strong></p>
        <div class="size-picks" role="listbox" aria-label="Size">
          {#each data.product.sizes as size}
            <button
              type="button"
              class="size-pick"
              class:active={selectedSize === size.name}
              class:gone={freeFor(selectedColor, size.name) <= 0}
              aria-pressed={selectedSize === size.name}
              onclick={() => pickSize(size.name)}>{size.name}</button
            >
          {/each}
        </div>
      </div>
    {/if}

    <div class="buy-box">
      {#if inStock}
        {#if lowStock}
          <p class="stock urgency">Only {stockQty} left</p>
        {:else}
          <p class="stock in">In stock</p>
        {/if}
      {:else}
        <p class="stock out">Out of stock</p>
      {/if}
      <p class="dispatch">Courier delivery.</p>

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
        color={selectedColor}
        size={selectedSize}
        imageUrl={images[0] ?? null}
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
        <a class="related-card" href="/product/{product.id}">
          <div class="related-media">
            {#if product.imageUrl}
              <img src={product.imageUrl} alt={product.name} />
            {:else}
              <div class="related-placeholder"></div>
            {/if}
            {#if product.offerEnabled}
              <span class="offer-stamp">Offer</span>
            {/if}
          </div>
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
    gap: clamp(28px, 5vw, 56px);
    padding: clamp(28px, 5vw, 48px) 0;
    align-items: start;
  }

  .gallery img,
  .image-placeholder {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    border-radius: 0;
    background: var(--bg-subtle);
  }

  .thumbs {
    display: flex;
    gap: 10px;
    margin-top: 14px;
    flex-wrap: wrap;
  }

  .thumb {
    width: 56px;
    height: 56px;
    padding: 0;
    border: 2px solid var(--border);
    border-radius: 0;
    overflow: hidden;
    background: var(--bg-subtle);
    cursor: pointer;
  }

  .thumb.active {
    border-color: var(--ink);
    box-shadow: inset 0 0 0 1px var(--ink);
  }

  .thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 0;
  }

  .category {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--text-secondary);
    margin-bottom: 8px;
  }

  .price {
    font-size: 22px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 8px 0 16px;
  }

  .colours,
  .sizes {
    margin: 0 0 22px;
  }

  .colour-label {
    font-size: 14px;
    margin-bottom: 8px;
  }

  .swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .swatch {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--swatch);
    border: 1px solid color-mix(in srgb, var(--text-primary) 35%, transparent);
    cursor: pointer;
    padding: 0;
  }

  .swatch.active {
    outline: 2px solid var(--ink);
    outline-offset: 2px;
  }

  .swatch.gone,
  .size-pick.gone {
    opacity: 0.35;
  }

  .size-picks {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .size-pick {
    min-width: 44px;
    padding: 8px 14px;
    border: 1px solid var(--border);
    border-radius: 0;
    background: #fff;
    color: var(--text-primary);
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }

  .size-pick.active {
    border-color: var(--ink);
    box-shadow: inset 0 0 0 1px var(--ink);
    color: var(--text-primary);
    font-weight: 700;
  }

  .buy-box {
    border: none;
    padding: 4px 0 0;
    background: none;
    margin-top: 4px;
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
    justify-content: flex-start;
    gap: 16px;
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
    border-radius: 0;
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
    background: var(--border);
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
    margin-top: 36px;
    padding-top: 28px;
    border-top: 1px solid var(--border);
  }

  .about h2 {
    font-size: 18px;
    margin-bottom: 8px;
  }

  .description {
    color: var(--text-secondary);
  }

  .related {
    padding: 16px 0 72px;
  }

  .related h2 {
    margin-bottom: 4px;
  }

  .related-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 160px), 1fr));
    gap: 12px;
    margin-top: 20px;
  }

  .related-card {
    color: inherit;
  }

  .related-media {
    position: relative;
    overflow: hidden;
  }

  .related-card:hover {
    color: inherit;
  }

  .offer-stamp {
    position: absolute;
    top: 8px;
    left: 8px;
    z-index: 1;
    background: var(--accent);
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    padding: 4px 7px;
  }

  .related-card img,
  .related-placeholder {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    background: var(--bg-subtle);
  }

  .related-body {
    padding: 10px 0 0;
  }

  .related-body h3 {
    font-family: var(--font-body);
    font-size: 14px;
    font-weight: 500;
    letter-spacing: -0.01em;
    line-height: 1.35;
  }

  .related-body p {
    font-weight: 700;
    font-size: 14px;
    margin-top: 4px;
    letter-spacing: -0.02em;
  }

  @media (forced-colors: active) {
    .thumb.active {
      outline: 2px solid Highlight;
      outline-offset: 1px;
      box-shadow: none;
    }

    .size-pick.active {
      border: 2px solid Highlight;
      font-weight: 800;
    }

    .stock.in,
    .stock.out,
    .urgency {
      color: CanvasText;
    }

    .buy-box {
      border: 2px solid CanvasText;
    }

    .offer-stamp {
      background: Canvas;
      color: CanvasText;
      border: 1px solid CanvasText;
    }
  }

  @media (max-width: 720px) {
    .product-detail {
      grid-template-columns: 1fr;
    }

    .price {
      font-size: 24px;
    }

    .step {
      width: 44px;
      height: 44px;
    }
  }
</style>
