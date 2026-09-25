<script lang="ts">
  import { page } from '$app/state';

  let { children } = $props();

  const links = [
    { href: '/admin', label: 'To do' },
    { href: '/admin/products', label: 'Products' },
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
    gap: 8px;
    padding: 16px 0;
    border-bottom: 1px solid var(--border);
    font-weight: 600;
    flex-wrap: wrap;
    align-items: center;
  }

  .admin-nav a {
    padding: 6px 12px;
  }

  .admin-nav a.current {
    background: var(--accent-light);
    color: var(--accent);
    box-shadow: inset 0 -2px 0 var(--accent);
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
