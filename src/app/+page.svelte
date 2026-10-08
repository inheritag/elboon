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
  let showCampaign = $derived(!data.category && !data.q && !loadingCatalog && Boolean(data.hero));
  let showLooks = $derived(showCampaign && data.tiles.length > 0);
  let showTextNav = $derived(showCategories && (!showCampaign || data.tiles.length === 0));

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

{#if showLooks}
  <nav class="looks container" aria-label="Categories">
    {#each data.tiles as tile}
      <a href={catalogHref({ category: tile.slug, page: 1 })} class:plain={!tile.imageUrl}>
        {#if tile.imageUrl}
          <img src={tile.imageUrl} alt="" />
        {/if}
        <span>{tile.label}</span>
      </a>
    {/each}
  </nav>
{/if}

{#if showTextNav}
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
  {#if data.total > 0 && !loadingCatalog && !showCampaign}
    <p class="count">
      {data.total}
      {data.total === 1 ? 'item' : 'items'}{#if data.pages > 1}
        · page {data.page} of {data.pages}{/if}
    </p>
  {/if}
  {#if loadingCatalog}
    {#each Array(6) as _}
      <div class="product-card skel" aria-hidden="true">
        <div class="image-placeholder"></div>
        <div class="product-card-body">
          <div class="skel-line"></div>
          <div class="skel-line short"></div>
        </div>
      </div>
    {/each}
  {:else}
    {#each data.products as product}
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
  .campaign {
    position: relative;
    display: block;
    color: #fff;
    background: #111;
  }

  .campaign:hover {
    color: #fff;
  }

  .campaign img {
    width: 100%;
    height: clamp(300px, 34vw, 440px);
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

  .looks {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 8px;
    padding-top: 8px;
    padding-bottom: 8px;
  }

  .looks a {
    position: relative;
    display: block;
    color: #fff;
    background: #111;
  }

  .looks a:hover {
    color: #fff;
  }

  .looks img,
  .looks a.plain {
    width: 100%;
    aspect-ratio: 3 / 4;
    object-fit: cover;
  }

  .looks a.plain {
    background: var(--bg-subtle);
    color: var(--text-primary);
  }

  .looks a.plain:hover {
    color: var(--text-primary);
  }

  .looks span {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 36px 12px 12px;
    background: linear-gradient(transparent, rgb(0 0 0 / 62%));
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .looks a.plain span {
    background: none;
    color: var(--text-primary);
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
    flex: 0 0 auto;
    padding: 14px 0;
    margin-right: 22px;
    border: none;
    border-bottom: 2px solid transparent;
    border-radius: 0;
    background: none;
    white-space: nowrap;
    text-transform: capitalize;
    font-size: 14px;
    font-weight: 600;
  }

  .categories a:hover {
    color: inherit;
  }

  .categories a.active,
  .categories a.active:hover {
    color: var(--text-primary);
    border-bottom-color: var(--ink);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr));
    gap: 28px 12px;
    padding: 20px 0 72px;
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
    color: var(--text-primary);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .pager .dead {
    color: var(--text-muted);
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

  @media (min-width: 901px) {
    .looks img,
    .looks a.plain {
      aspect-ratio: 4 / 5;
    }
  }

  @media (max-width: 900px) {
    .looks {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 720px) {
    .campaign img {
      height: 420px;
    }

    .looks {
      grid-template-columns: repeat(2, minmax(0, 1fr));
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
