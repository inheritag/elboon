<script lang="ts">
  import './app.css';
  import { cart, cartBump, cartFly } from './cart';
  import Icon from './Icon.svelte';

  let { children, data } = $props();

  let cartCount = $derived($cart.reduce((n, l) => n + l.quantity, 0));
  let bumping = $state(false);
  let flyTo = $state<{ x: number; y: number } | null>(null);
  let cartLink: HTMLAnchorElement | null = $state(null);

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
</script>

<div class="shell">
  <header class="site-header">
    <div class="container header-inner">
      <a href="/" class="logo"><span class="logo-mark">e.</span> elboon</a>
      <nav>
        {#if data.customer}
          <a class="nav-item" href="/account"><Icon name="user" /> <span class="nav-label">Account</span></a>
        {:else}
          <a class="nav-item" href="/account/login"><Icon name="user" /> <span class="nav-label">Sign in</span></a>
        {/if}
        <a href="/cart" class="nav-item cart-link" class:bumping bind:this={cartLink} id="nav-cart">
          <Icon name="cart" /> <span class="nav-label">Cart</span>
          <span class="count">{cartCount}</span>
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

  <footer class="site-footer">
    <div class="container footer-inner">
      <nav>
        <a href="/privacy">Privacy</a>
        <a href="/account">Account</a>
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
    background: color-mix(in srgb, var(--bg) 88%, transparent);
    border-bottom: 1px solid var(--border);
    backdrop-filter: blur(10px);
  }

  .header-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 88px;
  }

  .logo {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 28px;
    letter-spacing: -0.03em;
  }

  .logo:hover {
    color: inherit;
  }

  .logo-mark {
    color: var(--accent);
  }

  nav {
    display: flex;
    gap: 20px;
    align-items: center;
  }

  .nav-item {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    border: 2px solid currentColor;
    padding: 8px 12px;
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
  }

  .cart-link.bumping {
    animation: cart-pop 450ms ease;
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
    animation: fly-cart 600ms cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
  }

  .fly :global(svg) {
    width: 20px;
    height: 20px;
  }

  @keyframes cart-pop {
    0% {
      transform: scale(1);
    }
    35% {
      transform: scale(1.18);
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
    border-top: 1px solid var(--border);
    color: var(--text-muted);
    font-size: 13px;
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

  .site-footer a:hover {
    color: var(--text-primary);
  }

  @media (max-width: 720px) {
    .header-inner {
      height: 64px;
    }

    .logo {
      font-size: 22px;
    }

    nav {
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
