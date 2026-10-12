<script lang="ts">
  import { goto } from '$app/navigation';
  import { navigating } from '$app/state';
  import { formatPrice } from '../domain/product';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let loadingCatalog = $derived(navigating?.to?.url.pathname === '/');
  let categoryLabel = $derived(data.categoryLabel ?? data.category);
  let showCategories = $derived(
    data.categories.length > 0 && (data.total > 0 || Boolean(data.category) || Boolean(data.q) || loadingCatalog)
  );
  let showCampaign = $derived(!data.category && !data.q && data.page === 1 && !loadingCatalog && Boolean(data.hero));
  let sectionTitle = $derived(data.q ? 'Search' : data.category ? (categoryLabel ?? data.category) : 'Everything');

  function catalogHref(opts: { category?: string | null; q?: string; page?: number; sort?: string } = {}): string {
    const category = opts.category === undefined ? data.category : opts.category;
    const q = opts.q === undefined ? data.q : opts.q;
    const sort = opts.sort === undefined ? data.sort : opts.sort;
    const page = opts.page ?? 1;
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (q) params.set('q', q);
    if (sort && sort !== 'featured') params.set('sort', sort);
    if (page > 1) params.set('page', String(page));
    const query = params.toString();
    return query ? `/?${query}` : '/';
  }

  function onSort(event: Event) {
    const value = (event.currentTarget as HTMLSelectElement).value;
    void goto(catalogHref({ sort: value, page: 1 }));
  }

  function priceOf(product: { priceCents: number; priceMaxCents: number; currency: string }): string {
    const price = formatPrice(product.priceCents, product.currency);
    return product.priceMaxCents > product.priceCents ? `From ${price}` : price;
  }
</script>

{#snippet sortControl()}
  <label class="sort">
    <span class="sr-only">Sort</span>
    <select aria-label="Sort" value={data.sort} onchange={onSort}>
      <option value="featured">Featured</option>
      <option value="price-asc">Price: low to high</option>
      <option value="price-desc">Price: high to low</option>
      <option value="name">Name</option>
    </select>
  </label>
{/snippet}

{#snippet card(product: PageData['products'][number])}
  <a class="product-card" href="/product/{product.id}">
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
      <p class="price">{priceOf(product)}</p>
      {#if product.choices.length > 0}
        <p class="choices">
          {product.choices.slice(0, 4).join(' · ')}{#if product.choices.length > 4}
            +{product.choices.length - 4}{/if}
        </p>
      {/if}
      {#if product.colors.length > 0}
        <p class="dots" aria-label="Colours">
          {#each product.colors as color}
            <span class="dot" style="background:{color.hex}" title={color.name}></span>
          {/each}
        </p>
      {/if}
      {#if product.remainingQty !== null}
        <p class="badge badge-low-stock">Only {product.remainingQty} left</p>
      {/if}
    </div>
  </a>
{/snippet}

{#if showCampaign && data.hero}
  <a class="campaign" data-hero href={data.hero.href}>
    <img src={data.hero.imageUrl} alt="" />
    <div class="campaign-copy">
      <p>Offers on selected items</p>
      <h1>Shop everything. Haggle when it counts.</h1>
    </div>
  </a>
{:else if !data.category && !data.q && !loadingCatalog}
  <section class="hero-plain" data-hero>
    <div class="container">
      <p>Offers on selected items</p>
      <h1>Shop everything. Haggle when it counts.</h1>
    </div>
  </section>
{/if}

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

{#if loadingCatalog}
  <section class="shop container">
    <div class="grid">
      {#each Array(6) as _}
        <div class="product-card skel" aria-hidden="true">
          <div class="image-placeholder"></div>
          <div class="product-card-body">
            <div class="skel-line"></div>
            <div class="skel-line short"></div>
          </div>
        </div>
      {/each}
    </div>
  </section>
{:else if data.bands}
  {#if data.bands.length > 0}
    <div class="container sort-row">{@render sortControl()}</div>
  {/if}
  {#each data.bands as band}
    <section class="shop container">
      <div class="section-break" aria-hidden="true"><span></span></div>
      <div class="section-head">
        <h2>{band.label}</h2>
        <p class="count">{band.total} {band.total === 1 ? 'item' : 'items'}</p>
      </div>
      <div class="grid">
        {#each band.items as product}
          {@render card(product)}
        {/each}
      </div>
      {#if band.total > band.items.length}
        <a class="band-more" href={catalogHref({ category: band.slug, page: 1 })}>Shop all {band.label}</a>
      {/if}
    </section>
  {:else}
    <section class="shop container">
      <div class="empty"><p>Nothing for sale yet.</p></div>
    </section>
  {/each}
{:else}
  <section class="shop container">
    {#if data.total > 0}
      <div class="section-head">
        <h2>{sectionTitle}</h2>
        <div class="head-tools">
          <p class="count">
            {data.total}
            {data.total === 1 ? 'item' : 'items'}{#if data.pages > 1}
              · page {data.page} of {data.pages}{/if}
          </p>
          {@render sortControl()}
        </div>
      </div>
    {/if}
    <div class="grid">
      {#if data.products.length > 0}
        {#each data.products as product}
          {@render card(product)}
        {/each}
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
      {/if}
    </div>
    {#if data.pages > 1}
      <nav class="pager" aria-label="Catalogue pages">
        {#if data.page > 1}
          <a href={catalogHref({ page: data.page - 1 })}>Previous</a>
        {/if}
        <span class="page-no">Page {data.page} of {data.pages}</span>
        {#if data.page < data.pages}
          <a href={catalogHref({ page: data.page + 1 })}>Next</a>
        {/if}
      </nav>
    {/if}
  </section>
{/if}

<style>
  .campaign {
    position: relative;
    display: flex;
    justify-content: center;
    color: #fff;
    background: #111;
  }

  .campaign:hover {
    color: #fff;
  }

  .campaign img {
    width: 100%;
    height: clamp(400px, 52vw, 520px);
    max-height: 72vh;
    object-fit: cover;
    object-position: center 42%;
  }

  .campaign-copy {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    padding: clamp(28px, 5vw, 56px) clamp(16px, 4vw, 40px) clamp(24px, 4vw, 40px);
    background: linear-gradient(transparent, rgb(0 0 0 / 62%));
  }

  .campaign-copy p,
  .hero-plain p {
    margin-bottom: 10px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .campaign h1,
  .hero-plain h1 {
    max-width: 14ch;
    font-size: clamp(36px, 5.4vw, 68px);
    font-weight: 600;
    letter-spacing: -0.045em;
    line-height: 0.95;
    color: #fff;
  }

  .hero-plain {
    padding: clamp(48px, 8vw, 88px) 0 clamp(28px, 4vw, 40px);
  }

  .hero-plain p {
    color: var(--text-secondary);
  }

  .hero-plain h1 {
    color: var(--text-primary);
  }

  .section-head h2 {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    line-height: 1.2;
  }

  .category-bar {
    position: sticky;
    top: var(--header-h);
    z-index: 20;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
  }

  .categories {
    display: flex;
    gap: 0;
    padding: 4px 0 2px;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    touch-action: pan-x;
    scroll-snap-type: x proximity;
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
    flex: 0 0 auto;
    scroll-snap-align: start;
    padding: 12px 0 10px;
    margin-right: 28px;
    border: none;
    border-bottom: 2px solid transparent;
    border-radius: 0;
    background: none;
    white-space: nowrap;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-size: 12px;
    font-weight: 700;
  }

  .categories a:hover {
    color: inherit;
  }

  .categories a.active,
  .categories a.active:hover {
    color: var(--text-primary);
    border-bottom-color: var(--ink);
  }

  .shop {
    padding-top: 8px;
    padding-bottom: 72px;
  }

  .section-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 10px 16px;
    margin-top: 8px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border);
  }

  .head-tools,
  .sort-row {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 16px;
  }

  .sort-row {
    padding-top: 28px;
  }

  .sort {
    min-width: 0;
  }

  .sort select {
    max-width: 100%;
    height: 40px;
    padding: 0 12px;
    border: 1px solid var(--border);
    border-radius: 0;
    background: #fff;
    color: var(--text-primary);
    font: inherit;
    font-size: 13px;
    font-weight: 600;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr));
    gap: 28px 12px;
    padding-top: 22px;
  }

  .count {
    margin: 0;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0;
    text-transform: none;
    color: var(--text-secondary);
  }

  .pager {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-top: 28px;
    font-size: 14px;
    font-weight: 600;
  }

  .pager a {
    color: var(--text-primary);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .page-no {
    color: var(--text-secondary);
    font-weight: 500;
  }

  .band-more {
    display: inline-block;
    margin-top: 18px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .choices {
    margin: 4px 0 0;
    color: var(--text-secondary);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .product-card {
    position: relative;
    color: inherit;
  }

  .product-card:hover {
    color: inherit;
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
  }

  .product-card-body {
    padding: 10px 0 0;
  }

  .product-card-body h3 {
    font-family: var(--font-body);
    font-size: 14px;
    font-weight: 400;
    letter-spacing: -0.01em;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .price {
    font-weight: 700;
    font-size: 14px;
    color: var(--text-primary);
    margin: 4px 0 0;
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

  @media (max-width: 1100px) {
    .categories {
      mask-image: linear-gradient(90deg, #000 calc(100% - 36px), transparent);
    }
  }

  @media (min-width: 1100px) {
    .campaign img {
      height: clamp(400px, 34vw, 520px);
      max-height: 62vh;
    }

    .grid {
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    }
  }

  /* Square product photos must not stretch into a thin strip on a wide monitor. */
  @media (min-width: 1680px) {
    .campaign {
      background: var(--bg);
    }

    .campaign img,
    .campaign-copy {
      width: min(100%, var(--max-width));
    }

    .campaign img {
      height: min(560px, 58vh);
    }

    .campaign-copy {
      left: 50%;
      right: auto;
      transform: translateX(-50%);
    }

    .grid {
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    }
  }

  @media (max-width: 720px) {
    .empty .btn {
      width: 100%;
    }
  }

  @media (max-width: 640px) {
    .head-tools {
      flex: 1 1 220px;
      justify-content: flex-end;
    }
  }

  @media (max-width: 520px) {
    .grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .product-card-body {
      padding: 8px 0 0;
    }

    .product-card-body h3 {
      font-size: 13px;
    }

    .empty {
      grid-column: 1 / -1;
    }
  }

  @media (forced-colors: active) {
    .campaign h1,
    .campaign-copy p,
    .hero-plain h1,
    .hero-plain p {
      color: CanvasText;
    }

    .campaign {
      border: 1px solid CanvasText;
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

    .categories a {
      background: Canvas;
      color: CanvasText;
      border: none;
      border-bottom: 2px solid transparent;
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
  }
</style>
