<script lang="ts">
  import { navigating } from '$app/state';
  import { formatPrice } from '../domain/product';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let loadingCatalog = $derived(navigating?.to?.url.pathname === '/');
  let categoryLabel = $derived(data.categoryLabel ?? data.category);
  let showCategories = $derived(
    data.categories.length > 0 && (data.total > 0 || Boolean(data.category) || Boolean(data.q) || loadingCatalog)
  );

  function catalogHref(opts: { category?: string | null; q?: string; page?: number } = {}): string {
    const category = opts.category === undefined ? data.category : opts.category;
    const q = opts.q === undefined ? data.q : opts.q;
    const page = opts.page ?? 1;
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (q) params.set('q', q);
    if (page > 1) params.set('page', String(page));
    const query = params.toString();
    return query ? `/?${query}` : '/';
  }
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
      href={catalogHref({ category: null, page: 1 })}
      class:active={!data.category}
      aria-current={!data.category ? 'page' : undefined}>All</a
    >
    {#each data.nav.top as category}
      <a
        href={catalogHref({ category: category.slug, page: 1 })}
        class:active={data.trail.includes(category.slug)}
        aria-current={data.category === category.slug ? 'page' : undefined}>{category.label}</a
      >
    {/each}
  </nav>
  {#each data.nav.levels as level}
    <nav class="categories container sub" aria-label={level.allLabel}>
      <a
        href={catalogHref({ category: level.parentSlug, page: 1 })}
        class:active={data.category === level.parentSlug}
        aria-current={data.category === level.parentSlug ? 'page' : undefined}>{level.allLabel}</a
      >
      {#each level.items as category}
        <a
          href={catalogHref({ category: category.slug, page: 1 })}
          class:active={data.trail.includes(category.slug)}
          aria-current={data.category === category.slug ? 'page' : undefined}>{category.label}</a
        >
      {/each}
    </nav>
  {/each}
</div>
{/if}

<section class="grid container">
  {#if data.total > 0 && !loadingCatalog}
    <p class="count">
      {data.total}
      {data.total === 1 ? 'item' : 'items'}{#if data.pages > 1}
        · page {data.page} of {data.pages}{/if}
    </p>
  {/if}
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
          {#if product.offerEnabled}
            <span class="offer-stamp">Offer</span>
          {/if}
        </div>
        <div class="product-card-body">
          <h3>{product.name}</h3>
          <p class="price">{formatPrice(product.priceCents, product.currency)}</p>
          {#if product.colors.length > 0}
            <p class="dots" aria-label="Colours">
              {#each product.colors as color}
                <span class="dot" style="background:{color.hex}" title={color.name}></span>
              {/each}
            </p>
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
          <p>Nothing for sale yet.</p>
        {/if}
        {#if data.category || data.q}
          <a class="btn btn-primary" href="/">Browse all</a>
        {/if}
      </div>
    {/each}
    {#if data.pages > 1}
      <nav class="pager" aria-label="Catalogue pages">
        {#if data.page > 1}
          <a href={catalogHref({ page: data.page - 1 })}>Previous</a>
        {:else}
          <span class="dead">Previous</span>
        {/if}
        {#if data.page < data.pages}
          <a href={catalogHref({ page: data.page + 1 })}>Next</a>
        {:else}
          <span class="dead">Next</span>
        {/if}
      </nav>
    {/if}
  {/if}
</section>

<style>
  .hero {
    padding: clamp(48px, 8vw, 96px) 0 clamp(52px, 7vw, 84px);
    background: var(--ink);
    color: var(--on-ink);
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
    border-radius: 999px;
  }

  .hero h1 {
    font-size: clamp(26px, 7vw, 64px);
    font-weight: 800;
    letter-spacing: -0.05em;
    line-height: 1.08;
    color: var(--on-ink);
  }

  .hero h1 em {
    font-style: italic;
    font-weight: 560;
    color: var(--accent);
  }

  .lede {
    margin-top: 16px;
    color: var(--on-ink-muted);
    font-size: 18px;
    max-width: 42ch;
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
    gap: 10px;
    padding: 16px 0 14px;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    touch-action: pan-x;
  }

  .categories.sub {
    padding-top: 0;
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
    padding: 9px 16px;
    border: 1.5px solid var(--border);
    border-radius: var(--chip-radius);
    background: var(--surface);
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
    gap: clamp(18px, 2.6vw, 28px);
    padding: 28px 0 72px;
  }

  .count {
    grid-column: 1 / -1;
    margin: 0;
    font-size: 13px;
    color: var(--text-secondary);
  }

  .pager {
    grid-column: 1 / -1;
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding-top: 8px;
    font-size: 14px;
    font-weight: 600;
  }

  .pager a {
    color: var(--accent);
    text-decoration: underline;
  }

  .pager .dead {
    color: var(--text-muted);
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
    position: relative;
    overflow: hidden;
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
    padding: 16px 18px 18px;
  }

  .product-card-body h3 {
    font-family: var(--font-body);
    font-size: 14px;
    font-weight: 500;
    letter-spacing: -0.01em;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .price {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 16px;
    color: var(--text-primary);
    margin: 4px 0 0;
    letter-spacing: -0.02em;
  }

  .offer-stamp {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 1;
    transform: rotate(8deg);
    background: var(--accent);
    color: #fff;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 4px 8px;
    border-radius: 4px 10px 4px 10px;
    box-shadow: 0 6px 16px color-mix(in srgb, var(--accent) 40%, transparent);
  }

  .dots {
    display: flex;
    gap: 5px;
    margin-top: 8px;
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 1px solid color-mix(in srgb, var(--text-primary) 25%, transparent);
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
      font-size: 13px;
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

    .hero h1 em {
      color: CanvasText;
    }

    .offer-stamp {
      background: Canvas;
      color: CanvasText;
      border: 1px solid CanvasText;
      box-shadow: none;
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
    .product-card:hover {
      transform: none;
    }

    .product-card:hover img {
      transform: none;
    }
  }
</style>
