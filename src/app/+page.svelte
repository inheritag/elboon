<script lang="ts">
  import { navigating } from '$app/state';
  import { formatPrice } from '../domain/product';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let loadingCatalog = $derived(navigating?.to?.url.pathname === '/');
  let categoryLabel = $derived(
    data.category ? (data.categories.find((row) => row.slug === data.category)?.label ?? data.category) : null
  );
  let showCategories = $derived(
    data.categories.length > 0 && (data.products.length > 0 || Boolean(data.category) || Boolean(data.q) || loadingCatalog)
  );
</script>

<section class="hero" data-hero>
  <div class="container">
    <p class="eyebrow">Offers accepted on selected items</p>
    <h1>Shop everything. <em>Haggle when it counts.</em></h1>
    <p class="lede">Pay as a guest. Courier delivery.</p>
  </div>
</section>

{#if showCategories}
<div class="category-bar">
  <nav class="categories container" aria-label="Categories">
    <a
      href={data.q ? `/?q=${encodeURIComponent(data.q)}` : '/'}
      class:active={!data.category}
      aria-current={!data.category ? 'page' : undefined}>All</a
    >
    {#each data.categories as category}
      <a
        href="/?category={category.slug}{data.q ? `&q=${encodeURIComponent(data.q)}` : ''}"
        class:active={data.category === category.slug}
        aria-current={data.category === category.slug ? 'page' : undefined}>{category.label}</a
      >
    {/each}
  </nav>
</div>
{/if}

<section class="grid container">
  {#if loadingCatalog}
    {#each Array(6) as _}
      <div class="card product-card skel" aria-hidden="true">
        <div class="image-placeholder"></div>
        <div class="product-card-body">
          <div class="skel-line"></div>
          <div class="skel-line short"></div>
        </div>
      </div>
    {/each}
  {:else}
    {#each data.products as product}
      <a class="card product-card" href="/product/{product.id}">
        <div class="thumb">
          {#if product.imageUrl}
            <img src={product.imageUrl} alt={product.name} />
          {:else}
            <div class="image-placeholder"></div>
          {/if}
        </div>
        <div class="product-card-body">
          <h3>{product.name}</h3>
          <p class="price">{formatPrice(product.priceCents, product.currency)}</p>
          {#if product.offerEnabled}
            <p class="offer-line">or make an offer</p>
          {/if}
          <div class="tags">
            {#if product.remainingQty !== null}
              <span class="badge badge-low-stock">Only {product.remainingQty} left</span>
            {/if}
          </div>
        </div>
      </a>
    {:else}
      <div class="empty">
        {#if data.q}
          <p>Nothing matches “{data.q}”{categoryLabel ? ` in ${categoryLabel}` : ''}.</p>
        {:else if data.category}
          <p>Nothing listed in {categoryLabel ?? 'this category'} yet.</p>
        {:else}
          <p>No products listed yet.</p>
        {/if}
        {#if data.category || data.q}
          <a class="btn btn-primary" href="/">Browse all</a>
        {/if}
      </div>
    {/each}
  {/if}
</section>

<style>
  .hero {
    padding: clamp(32px, 6vw, 72px) 0 clamp(20px, 4vw, 36px);
    background: var(--text-primary);
    color: var(--bg);
  }

  .eyebrow {
    display: inline-block;
    margin-bottom: 14px;
    padding: 5px 12px;
    background: var(--accent);
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .hero h1 {
    font-size: clamp(26px, 7vw, 64px);
    font-weight: 800;
    letter-spacing: -0.05em;
    line-height: 1.08;
    color: var(--bg);
  }

  .hero h1 em {
    font-style: normal;
    color: var(--bg);
    position: relative;
    display: inline-block;
  }

  .hero h1 em::after {
    content: '';
    position: absolute;
    left: 0;
    width: 0;
    bottom: 0.04em;
    height: 0.12em;
    background: var(--accent);
    animation: underline-draw var(--dur-slow) var(--ease-out) 80ms forwards;
  }

  @keyframes underline-draw {
    to {
      width: 100%;
    }
  }

  .lede {
    margin-top: 14px;
    color: color-mix(in srgb, var(--bg) 75%, transparent);
    font-size: 17px;
    max-width: 40ch;
  }

  .category-bar {
    position: sticky;
    top: var(--header-h);
    z-index: 20;
    background: color-mix(in srgb, var(--bg) 94%, transparent);
    border-bottom: 1px solid var(--border);
    backdrop-filter: blur(12px);
  }

  .categories {
    display: flex;
    gap: 8px;
    padding: 10px 0;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    touch-action: pan-x;
  }

  .categories::-webkit-scrollbar {
    display: none;
  }

  .categories::after {
    content: '';
    flex: 0 0 8px;
  }

  .categories a {
    position: relative;
    isolation: isolate;
    flex: 0 0 auto;
    padding: 8px 16px;
    border: 1px solid var(--border);
    border-radius: var(--chip-radius);
    background: #fff;
    white-space: nowrap;
    text-transform: capitalize;
    overflow: hidden;
    transition: border-color var(--dur) var(--ease-out), color var(--dur) var(--ease-out);
  }

  .categories a::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--accent);
    transform: scaleX(0);
    transform-origin: left center;
    transition: transform 200ms var(--ease-out);
    z-index: -1;
  }

  .categories a:hover {
    color: inherit;
    border-color: color-mix(in srgb, var(--border) 50%, var(--text-primary));
  }

  .categories a.active,
  .categories a.active:hover {
    color: #fff;
    border-color: var(--accent);
  }

  .categories a.active::before {
    transform: scaleX(1);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr));
    gap: clamp(12px, 3vw, 20px);
    padding: 16px 0 48px;
  }

  .product-card {
    position: relative;
    color: inherit;
    transition:
      transform var(--dur) var(--ease-out),
      box-shadow var(--dur) var(--ease-out);
  }

  .product-card:hover {
    color: inherit;
    transform: translateY(-3px);
    box-shadow: var(--shadow-hover);
  }

  .thumb {
    overflow: hidden;
    border-radius: var(--card-radius) var(--card-radius) 0 0;
  }

  .product-card img,
  .image-placeholder {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    background: var(--bg-subtle);
    transition: transform var(--dur) var(--ease-out);
  }

  .product-card:hover img {
    transform: scale(1.03);
  }

  .product-card-body {
    padding: 16px;
  }

  .product-card-body h3 {
    font-size: 17px;
  }

  .price {
    color: var(--text-secondary);
    margin: 4px 0 0;
  }

  .offer-line {
    margin-top: 4px;
    font-size: 13px;
    color: var(--text-secondary);
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
  }

  .empty {
    grid-column: 1 / -1;
    padding: 28px 0 48px;
    color: var(--text-secondary);
    max-width: 42ch;
  }

  .empty .btn {
    margin-top: 14px;
    width: auto;
  }

  .skel {
    pointer-events: none;
  }

  .skel .image-placeholder {
    background: var(--bg-subtle);
  }

  .skel-line {
    height: 14px;
    margin-top: 10px;
    background: var(--bg-subtle);
    border-radius: 4px;
  }

  .skel-line.short {
    width: 40%;
  }

  @media (min-width: 900px) {
    .hero h1 {
      white-space: nowrap;
    }
  }

  @media (max-width: 720px) {
    .hero {
      padding: 28px 0 24px;
    }

    .hero h1 {
      font-size: clamp(28px, 8.4vw, 40px);
    }

    .lede {
      font-size: 16px;
    }

    .empty .btn {
      width: 100%;
    }
  }

  @media (max-width: 520px) {
    .grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .product-card-body {
      padding: 12px;
    }

    .product-card-body h3 {
      font-size: 15px;
    }

    .empty {
      grid-column: 1 / -1;
    }
  }

  @media (forced-colors: active) {
    .hero h1,
    .lede {
      color: CanvasText;
    }

    .eyebrow {
      background: Canvas;
      color: CanvasText;
      border: 1px solid CanvasText;
    }

    .hero h1 em::after {
      background: CanvasText;
    }

    .category-bar {
      background: Canvas;
      border-bottom-color: CanvasText;
    }

    .categories a::before {
      display: none;
    }

    .categories a {
      background: Canvas;
      color: CanvasText;
      border: 1px solid CanvasText;
    }

    .categories a.active,
    .categories a.active:hover {
      color: CanvasText;
      border-width: 2px;
      font-weight: 800;
      text-decoration: underline;
      text-underline-offset: 3px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .hero h1 em::after {
      width: 100%;
      animation: none;
    }

    .product-card:hover {
      transform: none;
    }

    .product-card:hover img {
      transform: none;
    }
  }
</style>
