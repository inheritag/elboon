<script lang="ts">
  import { goto, onNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { scale } from 'svelte/transition';
  import './app.css';
  import AuthSheet from './AuthSheet.svelte';
  import ComingSoonBanner from './ComingSoonBanner.svelte';
  import SideMenu from './SideMenu.svelte';
  import { authHref, authModeFrom } from './auth-href';
  import { cart, cartBump, cartFly } from './cart';
  import Icon from './Icon.svelte';

  let { children, data } = $props();

  let cartCount = $derived($cart.reduce((n, l) => n + l.quantity, 0));
  let bumping = $state(false);
  let flyTo = $state<{ x: number; y: number } | null>(null);
  let cartLink: HTMLAnchorElement | null = $state(null);
  let headerEl: HTMLElement | null = $state(null);
  let menuBtn = $state<HTMLButtonElement | null>(null);
  /** Laptop tray stays open until it is closed. A smaller window starts closed. */
  let dismissed = $state(false);
  let overlay = $state(false);
  let wide = $state(false);
  let adminPage = $derived(page.url.pathname.startsWith('/admin'));
  let trayOn = $derived(!adminPage && !dismissed);

  onMount(() => {
    const mq = window.matchMedia('(min-width: 1280px)');
    const sync = () => {
      wide = mq.matches;
      if (mq.matches) overlay = false;
    };
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  });

  function menuIsWide(): boolean {
    return window.matchMedia('(min-width: 1280px)').matches;
  }

  function toggleMenu() {
    if (menuIsWide()) dismissed = !dismissed;
    else overlay = !overlay;
  }

  function closeMenu() {
    if (menuIsWide()) dismissed = true;
    else overlay = false;
    requestAnimationFrame(() => menuBtn?.focus());
  }
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
    if (typeof document === 'undefined') return;
    const docked = trayOn && wide;
    if (!docked) {
      document.documentElement.style.setProperty('--footer-cover', '0px');
      return;
    }
    const footer = document.querySelector('.site-footer');
    if (!footer) return;
    const set = () => {
      const cover = Math.max(0, window.innerHeight - footer.getBoundingClientRect().top);
      document.documentElement.style.setProperty('--footer-cover', `${cover}px`);
    };
    set();
    window.addEventListener('scroll', set, { passive: true });
    window.addEventListener('resize', set);
    return () => {
      window.removeEventListener('scroll', set);
      window.removeEventListener('resize', set);
      document.documentElement.style.setProperty('--footer-cover', '0px');
    };
  });

  $effect(() => {
    if (!headerEl) return;
    const set = () => {
      document.documentElement.style.setProperty('--header-h', `${headerEl!.offsetHeight}px`);
      const banner = headerEl!.querySelector('.soon');
      document.documentElement.style.setProperty('--banner-h', `${banner?.getBoundingClientRect().height ?? 0}px`);
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

  onNavigate((navigation) => {
    if (typeof document === 'undefined' || !document.startViewTransition) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    return new Promise((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });

  function openSheet(event: MouseEvent, href: string) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    void goto(href, { noScroll: true, keepFocus: true });
  }
</script>

<div class="shell" class:tray-on={trayOn} class:overlay>
  <header class="site-header" class:compact={leftHero} bind:this={headerEl}>
    {#if !page.url.pathname.startsWith('/admin')}
      <ComingSoonBanner />
    {/if}
    <div class="container header-inner">
      <div class="brand">
        {#if !page.url.pathname.startsWith('/admin')}
          <button
            type="button"
            class="menu-btn"
            bind:this={menuBtn}
            aria-expanded={wide ? !dismissed : overlay}
            aria-controls="side-menu"
            onclick={toggleMenu}
          >
            <Icon name="menu" />
            <span class="sr-only">Menu</span>
          </button>
        {/if}
        <a href="/" class="logo"><span class="logo-mark">e.</span> elboon</a>
      </div>
      <form class="search" action="/" method="get" role="search">
        <label class="sr-only" for="q">Find products</label>
        <span class="search-icon"><Icon name="search" /></span>
        <input id="q" name="q" type="search" enterkeyhint="search" placeholder="Find products" value={query} />
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

  {#if !adminPage}
    <div class="tray-slot">
      <SideMenu
        modal={overlay}
        docked={wide && !dismissed}
        customer={data.customer}
        admin={data.admin}
        categories={data.categories}
        categoryMetrics={data.categoryMetrics}
        cartCount={cartCount}
        onClose={closeMenu}
      />
    </div>
  {/if}

  {#if showAuth}
    <AuthSheet />
  {/if}

  <footer class="site-footer">
    <div class="container footer-inner">
      <p class="footer-mark">elboon</p>
      <nav>
        <a href="/privacy">Privacy</a>
        <a href="/policies">Delivery & returns</a>
        <a href="/support">Support</a>
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
    min-width: 0;
  }

  .site-header {
    position: sticky;
    top: 0;
    z-index: 30;
    color: var(--text-primary);
    background: #fff;
    border-bottom: 1px solid var(--border);
    padding-top: env(safe-area-inset-top);
  }

  .site-header.compact {
    border-bottom-color: var(--border);
  }

  .header-inner {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 16px;
    height: 64px;
  }

  .site-header a {
    color: inherit;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 2px;
    min-width: 0;
  }

  .menu-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    margin-left: -10px;
    padding: 0;
    border: none;
    background: none;
    color: var(--ink);
    cursor: pointer;
  }

  .menu-btn :global(.icon) {
    width: 28px;
    height: 28px;
  }

  .menu-btn:hover {
    opacity: 0.55;
  }

  .menu-btn:focus-visible {
    outline: 2px solid var(--ink);
    outline-offset: 2px;
  }

  .logo {
    font-family: var(--font-body);
    font-weight: 700;
    font-size: 22px;
    letter-spacing: -0.05em;
    color: inherit;
    text-transform: lowercase;
  }

  .logo:hover {
    color: inherit;
  }

  .logo-mark {
    color: inherit;
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
    color: var(--text-primary);
    pointer-events: none;
  }

  .search input {
    width: 100%;
    height: 40px;
    padding: 0 12px 0 38px;
    border: none;
    border-radius: 0;
    background: var(--bg-subtle);
    color: var(--text-primary);
    font-family: var(--font-body);
    font-size: 14px;
  }

  .search input::placeholder {
    color: var(--text-muted);
  }

  .search input:focus {
    outline: 1px solid var(--ink);
    outline-offset: 0;
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
    border: none;
    border-radius: 0;
    padding: 8px 2px;
    background: none;
    color: var(--text-primary);
    font: inherit;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
  }

  .nav-item:hover {
    color: inherit;
    opacity: 0.55;
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
    background: var(--ink);
    color: var(--on-ink);
    font-size: 11px;
    font-weight: 700;
    border: none;
  }

  @media (forced-colors: active) {
    .site-footer {
      background: Canvas;
      color: CanvasText;
      border-top: 1px solid CanvasText;
    }

    .site-footer a,
    .site-footer a:hover {
      color: LinkText;
    }

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

  .site-footer {
    margin-top: 12px;
    padding-top: 72px;
    padding-bottom: calc(8px + env(safe-area-inset-bottom));
    background: linear-gradient(180deg, transparent, #111 64px);
    color: #fff;
    font-size: 13px;
    font-weight: 500;
  }

  .footer-mark {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .footer-inner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    min-height: 64px;
    flex-wrap: wrap;
  }

  .site-footer nav {
    gap: 16px;
  }

  .site-footer a {
    color: #fff;
  }

  .site-footer a:hover {
    color: #fff;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .tray-slot {
    display: none;
  }

  @media (min-width: 1280px) {
    .shell.tray-on {
      padding-left: 300px;
    }

    .shell.tray-on :global(.soon) {
      margin-left: -300px;
      width: calc(100% + 300px);
    }

    .shell.tray-on .menu-btn {
      display: none;
    }

    .shell.tray-on .tray-slot {
      display: block;
      position: fixed;
      z-index: 40;
      top: var(--banner-h, 33px);
      left: 0;
      bottom: var(--footer-cover, 0px);
      width: 300px;
      overflow: auto;
      background: #fff;
      border-right: 1px solid #111;
    }

    .shell.tray-on .site-footer {
      position: relative;
    }

    .shell.tray-on .site-footer::before {
      content: '';
      position: absolute;
      left: -300px;
      top: 0;
      bottom: 0;
      width: 300px;
      background: linear-gradient(180deg, transparent, #111 64px);
      pointer-events: none;
    }
  }

  @media (max-width: 1279px) {
    .shell.overlay .tray-slot {
      display: block;
    }
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

    .brand {
      grid-area: logo;
    }

    .logo {
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
      min-width: 44px;
      min-height: 44px;
      padding: 10px;
      justify-content: center;
    }

    .search input {
      height: 44px;
      font-size: 16px;
    }

    .nav-label {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
    }

    .footer-inner {
      flex-direction: column;
      justify-content: center;
      min-height: 72px;
      padding-bottom: 16px;
    }
  }

  @media (forced-colors: active) {
    .tray-slot {
      background: Canvas;
      border-color: CanvasText;
    }
  }
</style>
