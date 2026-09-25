<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { scale } from 'svelte/transition';
  import './app.css';
  import AuthSheet from './AuthSheet.svelte';
  import { authHref, authModeFrom } from './auth-href';
  import { cart, cartBump, cartFly } from './cart';
  import Icon from './Icon.svelte';

  let { children, data } = $props();

  let cartCount = $derived($cart.reduce((n, l) => n + l.quantity, 0));
  let bumping = $state(false);
  let flyTo = $state<{ x: number; y: number } | null>(null);
  let cartLink: HTMLAnchorElement | null = $state(null);
  let headerEl: HTMLElement | null = $state(null);
  let leftHero = $state(page.url.pathname !== '/' && page.status < 400);

  $effect(() => {
    if ($cartBump === 0) return;
    bumping = true;
    const t = setTimeout(() => (bumping = false), 500);
    return () => clearTimeout(t);
  });

  $effect(() => {
    const fly = $cartFly;
    if (!fly || !cartLink) return;
    const dest = cartLink.getBoundingClientRect();
    flyTo = { x: dest.left + dest.width / 2, y: dest.top + dest.height / 2 };
    const t = setTimeout(() => (flyTo = null), 650);
    return () => clearTimeout(t);
  });

  $effect(() => {
    if (!headerEl) return;
    const set = () => {
      document.documentElement.style.setProperty('--header-h', `${headerEl!.offsetHeight}px`);
    };
    set();
    const ro = new ResizeObserver(set);
    ro.observe(headerEl);
    return () => ro.disconnect();
  });

  $effect(() => {
    void page.url.pathname;
    void page.status;
    const hero = document.querySelector('[data-hero]');
    if (!hero) {
      leftHero = true;
      return;
    }
    leftHero = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        leftHero = !entry.isIntersecting;
      },
      { threshold: 0 }
    );
    io.observe(hero);
    return () => io.disconnect();
  });

  let query = $derived(page.url.searchParams.get('q') ?? '');
  let signInHref = $derived(authHref(page.url, 'login'));
  let accountHref = $derived(
    data.customer ? '/account' : data.admin ? '/admin' : authHref(page.url, 'login', { redirectTo: '/account' })
  );
  let accountLabel = $derived(data.customer || data.admin ? 'Account' : 'Sign in');
  let showAuth = $derived(!data.customer && authModeFrom(page.url) !== null);

  function openSheet(event: MouseEvent, href: string) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    void goto(href, { noScroll: true, keepFocus: true });
  }
</script>

<div class="shell">
  <header class="site-header" class:compact={leftHero} bind:this={headerEl}>
    <div class="container header-inner">
      <a href="/" class="logo"><span class="logo-mark">e.</span> elboon</a>
      <form class="search" action="/" method="get" role="search">
        <label class="sr-only" for="q">Find products</label>
        <span class="search-icon"><Icon name="search" /></span>
        <input id="q" name="q" type="search" placeholder="Find products" value={query} />
      </form>
      <nav>
        <a
          class="nav-item"
          href={data.customer || data.admin ? accountHref : signInHref}
          onclick={(event) => {
            if (data.customer || data.admin) return;
            openSheet(event, signInHref);
          }}
          ><Icon name="user" /> <span class="nav-label">{accountLabel}</span></a
        >
        {#if data.admin}
          <form method="POST" action="/admin/logout">
            <button class="nav-item nav-logout" type="submit">
              <Icon name="logout" /> <span class="nav-label">Log out</span>
            </button>
          </form>
        {/if}
        <a href="/cart" class="nav-item cart-link" class:bumping bind:this={cartLink} id="nav-cart">
          <Icon name="cart" /> <span class="nav-label">Cart</span>
          {#if cartCount > 0}
            <span class="count" in:scale={{ duration: 140, start: 0.72 }}>{cartCount}</span>
          {/if}
        </a>
      </nav>
    </div>
    {#if !page.url.pathname.startsWith('/admin')}
      <p class="preview-note">Preview. Not taking orders yet.</p>
    {/if}
  </header>

  {#if $cartFly && flyTo}
    <span
      class="fly"
      style="--sx:{$cartFly.fromX}px; --sy:{$cartFly.fromY}px; --ex:{flyTo.x}px; --ey:{flyTo.y}px"
      aria-hidden="true"><Icon name="cart" /></span
    >
  {/if}

  <main>
    {@render children()}
  </main>

  {#if showAuth}
    <AuthSheet />
  {/if}

  <footer class="site-footer">
    <div class="container footer-inner">
      <nav>
        <a href="/privacy">Privacy</a>
        <a
          href={accountHref}
          onclick={(event) => {
            if (data.customer || data.admin) return;
            openSheet(event, accountHref);
          }}>Account</a
        >
        <a href="/cart">Cart</a>
      </nav>
    </div>
  </footer>
</div>

<style>
  .shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  main {
    flex: 1;
  }

  .site-header {
    position: sticky;
    top: 0;
    z-index: 30;
    color: var(--text-primary);
    background: color-mix(in srgb, var(--bg) 92%, transparent);
    border-bottom: 1px solid transparent;
    backdrop-filter: blur(14px);
    transition: border-color var(--dur) var(--ease-out), background var(--dur) var(--ease-out);
  }

  .site-header.compact {
    background: color-mix(in srgb, var(--bg) 88%, transparent);
    border-bottom-color: var(--border);
  }

  .header-inner {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 16px;
    height: 88px;
  }

  .site-header a {
    color: inherit;
  }

  .logo {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 28px;
    letter-spacing: -0.03em;
    color: inherit;
  }

  .logo:hover {
    color: inherit;
  }

  .logo-mark {
    color: var(--accent);
  }

  .search {
    position: relative;
    max-width: 380px;
    width: 100%;
    justify-self: center;
  }

  .search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-secondary);
    pointer-events: none;
  }

  .search input {
    width: 100%;
    height: 42px;
    padding: 0 12px 0 38px;
    border: 1px solid var(--border);
    border-radius: var(--card-radius);
    background: #fff;
    color: var(--text-primary);
    font-family: var(--font-body);
    font-size: 15px;
  }

  .search input:focus {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  nav {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .nav-item {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    border: 2px solid currentColor;
    padding: 8px 12px;
    background: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }

  .nav-logout {
    font-weight: inherit;
  }

  .cart-link {
    display: inline-flex;
    align-items: center;
    gap: 7px;
  }

  .count {
    display: inline-flex;
    min-width: 1.4em;
    justify-content: center;
    padding: 1px 6px;
    border-radius: 0;
    background: var(--accent);
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    border: 1px solid var(--accent);
  }

  @media (forced-colors: active) {
    .count {
      background: Highlight;
      color: HighlightText;
      border: 1px solid CanvasText;
    }

    .search input {
      background: Field;
      color: FieldText;
      border: 1px solid CanvasText;
    }

    .preview-note {
      color: CanvasText;
      border-top-color: CanvasText;
    }
  }

  .cart-link.bumping .count {
    animation: cart-pop var(--dur-fast) var(--ease-out);
  }

  .fly {
    position: fixed;
    left: 0;
    top: 0;
    z-index: 80;
    width: 20px;
    height: 20px;
    color: var(--text-primary);
    pointer-events: none;
    animation: fly-cart 600ms var(--ease-out) forwards;
  }

  .fly :global(svg) {
    width: 20px;
    height: 20px;
  }

  @keyframes cart-pop {
    0% {
      transform: scale(0.72);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes fly-cart {
    0% {
      transform: translate(calc(var(--sx) - 12px), calc(var(--sy) - 12px)) scale(1);
      opacity: 1;
    }
    100% {
      transform: translate(calc(var(--ex) - 12px), calc(var(--ey) - 12px)) scale(0.4);
      opacity: 0;
    }
  }

  .preview-note {
    margin: 0;
    padding: 8px 16px;
    border-top: 1px solid var(--border);
    text-align: center;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .site-footer {
    border-top: 1px solid var(--border);
    color: var(--text-secondary);
    font-size: 14px;
    font-weight: 500;
    margin-top: 24px;
    padding-bottom: env(safe-area-inset-bottom);
  }

  .footer-inner {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 16px;
    min-height: 64px;
    flex-wrap: wrap;
  }

  .site-footer nav {
    gap: 16px;
  }

  .site-footer a {
    color: var(--text-secondary);
  }

  .site-footer a:hover {
    color: var(--text-primary);
  }

  @media (max-width: 720px) {
    .header-inner {
      grid-template-columns: 1fr auto;
      grid-template-areas:
        'logo nav'
        'search search';
      height: auto;
      padding: 10px 0 12px;
      gap: 10px;
    }

    .logo {
      grid-area: logo;
      font-size: 22px;
    }

    .search {
      grid-area: search;
      max-width: none;
      justify-self: stretch;
    }

    nav {
      grid-area: nav;
      gap: 8px;
      flex-shrink: 0;
    }

    .nav-item {
      padding: 8px 10px;
    }

    .nav-label {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
    }

    .footer-inner {
      justify-content: center;
      min-height: 56px;
    }
  }
</style>
