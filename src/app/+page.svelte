<script lang="ts">
  import { CATEGORIES } from '../domain/catalog';
  import { formatPrice } from '../domain/product';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<section class="hero">
  <div class="container">
    <p class="eyebrow">Selected items take an offer</p>
    <h1>Shop everything. <em>Haggle when it counts.</em></h1>
    <p class="lede">Guest checkout. A logistics partner delivers. No account required.</p>
  </div>
</section>

<nav class="categories container" aria-label="Categories">
  <a href="/" class:active={!data.category}>All</a>
  {#each CATEGORIES as category}
    <a href="/?category={category}" class:active={data.category === category}>{category}</a>
  {/each}
</nav>

<section class="grid container">
  {#each data.products as product}
    <a class="card product-card" href="/product/{product.id}">
      {#if product.imageUrl}
        <img src={product.imageUrl} alt={product.name} />
      {:else}
        <div class="image-placeholder"></div>
      {/if}
      <div class="product-card-body">
        <h3>{product.name}</h3>
        <p class="price">{formatPrice(product.priceCents, product.currency)}</p>
        <div class="tags">
          {#if product.remainingQty !== null}
            <span class="badge badge-low-stock">Only {product.remainingQty} left</span>
          {/if}
          {#if product.offerEnabled}
            <span class="badge badge-haggle">Haggle</span>
          {/if}
        </div>
      </div>
    </a>
  {:else}
    <p class="empty">Nothing listed in this category yet.</p>
  {/each}
</section>

<style>
  .hero {
    padding: 72px 0 36px;
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
    font-size: clamp(36px, 6vw, 64px);
    font-weight: 800;
    letter-spacing: -0.05em;
    line-height: 1.05;
    white-space: nowrap;
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
    right: 0;
    bottom: 0.04em;
    height: 0.12em;
    background: var(--accent);
  }

  .lede {
    margin-top: 14px;
    color: color-mix(in srgb, var(--bg) 75%, transparent);
    font-size: 17px;
    max-width: 40ch;
  }

  .categories {
    display: flex;
    gap: 8px;
    padding: 8px 0 20px;
    overflow-x: auto;
  }

  .categories a {
    padding: 8px 16px;
    border: 2px solid var(--border);
    background: #fff;
    white-space: nowrap;
    text-transform: capitalize;
  }

  .categories a:hover {
    color: var(--accent);
    border-color: var(--accent);
  }

  .categories a.active,
  .categories a.active:hover {
    background: var(--accent);
    color: #fff;
    border-color: var(--accent);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 20px;
    padding: 4px 0 48px;
  }

  .product-card {
    position: relative;
    overflow: hidden;
    color: inherit;
  }

  .product-card:hover {
    color: inherit;
  }

  .product-card:hover h3 {
    color: var(--accent);
  }

  .product-card img,
  .image-placeholder {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    background: var(--bg-subtle);
  }

  .product-card-body {
    padding: 16px;
  }

  .product-card-body h3 {
    font-size: 17px;
  }

  .price {
    color: var(--text-secondary);
    margin: 4px 0 8px;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .empty {
    color: var(--text-secondary);
  }

  @media (max-width: 800px) {
    .hero h1 {
      white-space: normal;
    }
  }
</style>
