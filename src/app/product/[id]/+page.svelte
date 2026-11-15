<script lang="ts">
  import { goto } from '$app/navigation';
  import { salePrice } from '../../../domain/price';
  import { stockFor } from '../../../domain/product';
  import { addToCart, originFromEvent } from '../../cart';
  import PriceTag from '../../PriceTag.svelte';
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

  let showPicks = $derived(
    data.product.colors.length > 0 ||
      data.product.sizes.length > 0 ||
      (data.options.length > 1 && data.product.sizes.length === 0)
  );
  let selected = $derived(data.product.colors.find((color) => color.name === selectedColor) ?? null);
  let images = $derived(selected && selected.imageUrls.length > 0 ? selected.imageUrls : data.product.imageUrls);
  let stockQty = $derived(freeFor(selectedColor, selectedSize));
  let inStock = $derived(stockQty > 0);
  let lowStock = $derived(stockQty > 0 && stockQty <= data.product.lowStockThreshold);
  let maxQty = $derived(Math.max(1, stockQty));
  let sale = $derived(salePrice(data.product.priceCents, data.product.discountPercent));

  function line() {
    return {
      productId: data.product.id,
      name: data.displayName,
      unitPriceCents: sale.priceCents,
      wasCents: sale.wasCents,
      discountPercent: sale.discountPercent,
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
    <div class="photo-frame">
      <div class="photo-clip">
        {#if images[selectedImage]}
          <img src={images[selectedImage]} alt={data.displayName} />
        {:else}
          <div class="image-placeholder"></div>
        {/if}
      </div>
    </div>
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
    <h1>{data.displayName}</h1>
    <p class="price-row">
      <span class="price">
        <PriceTag
          cents={sale.priceCents}
          currency={data.product.currency}
          wasCents={sale.wasCents}
          percent={sale.discountPercent}
        />
      </span>
      {#if data.product.offerEnabled}<span class="offer-word">Offer</span>{/if}
    </p>

    {#if showPicks}
    <div class="picks">
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

    {#if data.options.length > 1 && data.product.sizes.length === 0}
      <div class="sizes">
        <p class="colour-label">{data.optionHeading}</p>
        <div class="size-picks" role="list">
          {#each data.options as option}
            <a
              class="size-pick"
              class:active={option.id === data.product.id}
              href="/product/{option.id}"
              aria-current={option.id === data.product.id ? 'page' : undefined}>{option.label}</a
            >
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
        <p class="stock out"><span aria-hidden="true">🚫</span>{' '}Temporarily out of stock</p>
      {/if}
      <p class="dispatch">Free delivery. <a href="/policies">Delivery and returns</a>.</p>

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
        <button class="buy-now" type="button" onclick={buyNow}>Buy now</button>
      {/if}
    </div>

    {#if data.product.offerEnabled}
      <HagglePanel
        productId={data.product.id}
        productName={data.displayName}
        askingCents={sale.priceCents}
        wasCents={sale.wasCents}
        discountPercent={sale.discountPercent}
        currency={data.product.currency}
        signedInEmail={data.customer?.email ?? null}
        color={selectedColor}
        size={selectedSize}
        imageUrl={images[0] ?? null}
      />
    {/if}

  </div>
</article>

{#if data.product.description.trim()}
  <section class="container about">
    <h2>About this item</h2>
    <p class="description">{data.product.description}</p>
  </section>
{/if}

{#if data.related.length > 0}
  <section class="container related">
    <h2>You might also like</h2>
    <div class="related-grid">
      {#each data.related as product}
        <a class="related-card" href="/product/{product.id}">
          <div class="related-media photo-frame">
            <div class="photo-clip">
              {#if product.imageUrl}
                <img src={product.imageUrl} alt={product.name} />
                {#if product.altImageUrl}
                  <img class="alt" src={product.altImageUrl} alt="" />
                {/if}
              {:else}
                <div class="related-placeholder"></div>
              {/if}
            </div>
          </div>
          <div class="related-body">
            <h3>{product.name}</h3>
            <p class="meta">
              <span class="price">
                <PriceTag
                  cents={product.priceCents}
                  currency={product.currency}
                  wasCents={product.wasCents}
                  percent={product.discountPercent}
                />
              </span>
              {#if product.offerEnabled}<span class="offer-word">Offer</span>{/if}
            </p>
            {#if product.sizes.length > 0}
              <p class="choices">
                {product.sizes.slice(0, 4).map((size) => size.name).join(' · ')}{#if product.sizes.length > 4}
                  +{product.sizes.length - 4}{/if}
              </p>
            {/if}
            {#if product.colors.length > 0}
              <p class="dots" aria-label="Colours">
                {#each product.colors as color}
                  <span class="dot" style="background:{color.hex}" title={color.name}></span>
                {/each}
              </p>
            {/if}
            {#if product.outOfStock}
              <p class="badge badge-out"><span aria-hidden="true">🚫</span>{' '}Temporarily out of stock</p>
            {:else if product.remainingQty !== null}
              <p class="badge badge-low-stock">Only {product.remainingQty} left</p>
            {/if}
          </div>
        </a>
      {/each}
    </div>
  </section>
{/if}

<style>
  .product-detail {
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;
    padding: 20px 0 48px;
    align-items: start;
  }

  .info {
    max-width: 380px;
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

  .info h1 {
    font-size: 18px;
    font-weight: 600;
    line-height: 1.35;
    letter-spacing: -0.02em;
    color: var(--ink);
  }

  .category {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--text-secondary);
    margin-bottom: 8px;
  }

  .price-row {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin: 12px 0 20px;
  }

  .price {
    font-size: 20px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--ink);
    margin: 0;
  }

  .offer-word {
    color: var(--accent);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .picks {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 28px;
  }

  .colours,
  .sizes {
    margin: 0;
  }

  .colour-label {
    font-size: 13px;
    font-weight: 400;
    margin-bottom: 8px;
  }

  .colour-label strong {
    font-weight: 600;
  }

  .swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
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
    gap: 8px;
  }

  .size-pick {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 44px;
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid var(--border);
    border-radius: 0;
    background: #fff;
    color: var(--text-primary);
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    text-align: center;
  }

  .size-pick.active {
    outline: 2px solid var(--ink);
    outline-offset: 2px;
    color: var(--text-primary);
    font-weight: 600;
  }

  .buy-box {
    border: none;
    padding: 0;
    background: none;
    margin: 0;
  }

  .stock {
    font-size: 13px;
    font-weight: 600;
    color: var(--ink);
    margin-bottom: 0;
  }

  .stock.out {
    color: var(--text-secondary);
  }

  .dispatch {
    font-size: 13px;
    font-weight: 400;
    color: var(--text-secondary);
    margin-bottom: 16px;
  }

  .dispatch a {
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .qty {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 16px;
    margin-bottom: 16px;
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
    width: 44px;
    height: 44px;
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
    min-width: 44px;
    height: 44px;
    line-height: 44px;
    text-align: center;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  .buy-box .btn {
    width: 100%;
    margin-top: 0;
  }

  .buy-now {
    display: inline-block;
    width: auto;
    margin-top: 12px;
    padding: 0;
    border: none;
    background: none;
    font: inherit;
    font-size: 14px;
    font-weight: 600;
    color: var(--ink);
    text-align: left;
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }

  .buy-now:hover {
    color: var(--ink);
  }

  .buy-now:focus-visible {
    outline: 2px solid var(--ink);
    outline-offset: 2px;
  }

  .buy-box .btn.added {
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
    padding-top: 48px;
    padding-bottom: 0;
  }

  .about h2,
  .related h2 {
    margin-bottom: 20px;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .description {
    max-width: 68ch;
    font-size: 15px;
    font-weight: 400;
    line-height: 1.6;
    color: var(--text-secondary);
  }

  .related {
    padding: 48px 0 64px;
  }

  .related-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 36px 16px;
    margin-top: 0;
  }

  .related-card {
    color: inherit;
  }

  .related-media {
    position: relative;
  }

  .related-card:hover {
    color: inherit;
  }

  .related-card img,
  .related-placeholder {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    background: var(--bg-subtle);
  }

  .related-body {
    padding: 12px 0 0;
  }

  .related-body h3 {
    font-family: var(--font-body);
    font-size: 14px;
    font-weight: 600;
    letter-spacing: -0.015em;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
    min-height: 2.7em;
  }

  .related-body .meta {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
    margin-top: 8px;
  }

  .related-body .price {
    font-size: 14px;
    font-weight: 600;
    margin: 0;
  }

  .choices {
    margin: 8px 0 0;
    color: var(--text-secondary);
    font-size: 12px;
    font-weight: 400;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dots {
    display: flex;
    gap: 6px;
    margin-top: 8px;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: 1px solid color-mix(in srgb, var(--text-primary) 25%, transparent);
  }

  .related-body .badge {
    margin-top: 8px;
    font-size: 12px;
    font-weight: 600;
    color: var(--ink);
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

    .stock {
      color: CanvasText;
    }

    .buy-now {
      color: CanvasText;
    }

    .offer-word {
      color: CanvasText;
      text-decoration: underline;
    }
  }

  @media (max-width: 1279px) {
    .gallery {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .gallery .photo-frame {
      width: min(100%, 70dvh, 560px);
    }

    .info {
      max-width: 560px;
    }
  }

  @media (min-width: 1280px) {
    .product-detail {
      grid-template-columns: minmax(0, 640px) 380px;
      gap: 56px;
      padding: 36px 0 64px;
      justify-content: center;
    }

    .info h1 {
      font-size: 20px;
    }

    .related-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 48px 24px;
    }
  }

  @media (min-width: 1536px) {
    .related-grid {
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    }
  }
</style>
