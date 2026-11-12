<script lang="ts">
  import { page } from '$app/state';

  let { children } = $props();

  const links = [
    { href: '/admin', label: 'To do' },
    { href: '/admin/products', label: 'Products' },
    { href: '/admin/stock', label: 'Stock' },
    { href: '/admin/offers', label: 'Offers' },
    { href: '/admin/orders', label: 'Orders' }
  ];

  function active(href: string): boolean {
    if (href === '/admin') return page.url.pathname === '/admin';
    return page.url.pathname.startsWith(href);
  }
</script>

<div class="admin-shell">
  <nav class="admin-nav container" aria-label="Seller desk">
    {#each links as link}
      <a href={link.href} class:current={active(link.href)} aria-current={active(link.href) ? 'page' : undefined}
        >{link.label}</a
      >
    {/each}
  </nav>
  {@render children()}
</div>

<style>
  .admin-nav {
    display: flex;
    gap: 0;
    padding: 8px 0 0;
    border-bottom: 1px solid var(--border);
    font-weight: 400;
    flex-wrap: wrap;
    align-items: center;
  }

  .admin-nav a {
    padding: 14px 0 12px;
    margin-right: 28px;
    border-radius: 0;
    border-bottom: 1px solid transparent;
    color: var(--text-secondary);
    font-size: 14px;
  }

  .admin-nav a.current {
    background: none;
    color: var(--ink);
    font-weight: 600;
    border-bottom-color: var(--ink);
  }

  @media (forced-colors: active) {
    .admin-nav a.current {
      background: Canvas;
      color: CanvasText;
      outline: 2px solid CanvasText;
      outline-offset: -2px;
      text-decoration: underline;
    }
  }
</style>
