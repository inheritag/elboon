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
  <nav class="admin-nav container">
    {#each links as link}
      <a href={link.href} class:current={active(link.href)}>{link.label}</a>
    {/each}
    <span class="spacer"></span>
    <a href="/">View shop</a>
    <form method="POST" action="/admin/logout">
      <button class="link-out" type="submit">Log out</button>
    </form>
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
  }

  .spacer {
    flex: 1;
  }

  .link-out {
    background: none;
    border: none;
    font: inherit;
    font-weight: 600;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 6px 12px;
  }
</style>
