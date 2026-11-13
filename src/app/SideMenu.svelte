<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { categoryTrail, childrenOf, type CategoryRecord } from '../domain/catalog';
  import { authHref } from './auth-href';
  import Icon from './Icon.svelte';
  import SupportForm from './SupportForm.svelte';

  let {
    modal = false,
    docked = false,
    customer,
    admin,
    categories,
    cartCount,
    onClose
  }: {
    /** Phone drawer is open over the page. */
    modal?: boolean;
    /** Laptop tray is sitting in the side column. */
    docked?: boolean;
    customer: { email: string; fullName: string } | null;
    admin: boolean;
    categories: CategoryRecord[];
    cartCount: number;
    onClose: () => void;
  } = $props();

  let expanded = $state<string[]>([]);
  let supportOpen = $state(false);
  let closeBtn = $state<HTMLButtonElement | null>(null);
  let panel = $state<HTMLElement | null>(null);
  let seen = '';
  let seeded = false;

  let category = $derived(page.url.searchParams.get('category'));
  let onShop = $derived(page.url.pathname === '/');
  let shown = $derived(modal || docked);

  $effect(() => {
    const current = page.url.pathname + page.url.search;
    if (seen && seen !== current && modal) onClose();
    seen = current;
  });

  $effect(() => {
    if (!shown) {
      seeded = false;
      supportOpen = false;
      return;
    }
    if (seeded) return;
    seeded = true;
    const selected = page.url.searchParams.get('category');
    if (!selected) return;
    expanded = [...new Set([...expanded, ...categoryTrail(selected, categories)])];
  });

  $effect(() => {
    if (!docked) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !panel?.contains(document.activeElement)) return;
      event.preventDefault();
      shut();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  $effect(() => {
    if (!modal) return;
    closeBtn?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        shut();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const items = [...panel.querySelectorAll<HTMLElement>('a, button, input, textarea, select')].filter(
        (el) => !el.hasAttribute('disabled') && el.tabIndex !== -1 && !el.closest('.trap')
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  });

  function shut() {
    onClose();
  }

  function leave() {
    if (modal) onClose();
  }

  function toggle(slug: string) {
    expanded = expanded.includes(slug) ? expanded.filter((item) => item !== slug) : [...expanded, slug];
  }

  function openAuth(event: MouseEvent, mode: 'login' | 'signup') {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    leave();
    const href = authHref(page.url, mode, mode === 'signup' ? { redirectTo: '/account' } : undefined);
    void goto(href, { noScroll: true, keepFocus: true });
  }
</script>

{#if modal}
  <button class="scrim" type="button" tabindex="-1" aria-label="Close menu" onclick={shut}></button>
{/if}
  <div
    id="side-menu"
    class="drawer"
    bind:this={panel}
    role={modal ? 'dialog' : 'navigation'}
    aria-modal={modal ? 'true' : undefined}
    aria-label="Menu"
  >
    <div class="drawer-top">
      <a href="/" class="mark" onclick={leave}><span class="mark-e">e.</span> elboon</a>
      <button type="button" class="close" bind:this={closeBtn} aria-label="Close menu" onclick={shut}>
        <Icon name="close" />
      </button>
    </div>

    <section class="group">
      <p class="label">Account</p>
      {#if customer}
        {#if customer.fullName.trim()}<p class="who">{customer.fullName}</p>{/if}
        <p class="email">{customer.email}</p>
        <a class="item" href="/account" onclick={leave}>Account</a>
        <a class="item" href="/account/offers" onclick={leave}>Offers</a>
        <a class="item" href="/account/orders" onclick={leave}>Orders</a>
        <form method="POST" action="/account?/logout">
          <button class="item" type="submit">Sign out</button>
        </form>
      {:else}
        <a class="item" href={authHref(page.url, 'login')} onclick={(event) => openAuth(event, 'login')}>Sign in</a>
        <a class="item" href={authHref(page.url, 'signup', { redirectTo: '/account' })} onclick={(event) => openAuth(event, 'signup')}>Create account</a>
      {/if}
      {#if admin}
        <a class="item" href="/admin" onclick={leave}>Admin</a>
        <form method="POST" action="/admin/logout">
          <button class="item" type="submit">Log out</button>
        </form>
      {/if}
    </section>

    <section class="group">
    <p class="label">Shop</p>
    <a class="item" href="/cart" onclick={leave}>Cart{cartCount > 0 ? ` (${cartCount})` : ''}</a>
    <nav aria-label="Categories">
      <a
        class="cat-link"
        href="/"
        class:current={onShop && !category}
        aria-current={onShop && !category ? 'page' : undefined}
        onclick={leave}>All</a>
      {#snippet nodes(parent: string | null, depth: number)}
        {#each childrenOf(parent, categories) as row (row.slug)}
          {@const kids = childrenOf(row.slug, categories)}
          <div class="cat" style="--depth: {depth}">
            <a
              href="/?category={row.slug}"
              class:current={category === row.slug}
              aria-current={category === row.slug ? 'page' : undefined}
              onclick={leave}>{row.label}</a>
            {#if kids.length > 0}
              <button
                type="button"
                aria-expanded={expanded.includes(row.slug)}
                aria-label="{expanded.includes(row.slug) ? 'Hide' : 'Show'} {row.label}"
                onclick={() => toggle(row.slug)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" class:open={expanded.includes(row.slug)}>
                  <path d="M8 10l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" />
                </svg>
              </button>
            {/if}
          </div>
          {#if kids.length > 0 && expanded.includes(row.slug)}
            {@render nodes(row.slug, depth + 1)}
          {/if}
        {/each}
      {/snippet}
      {@render nodes(null, 0)}
    </nav>
    </section>

    <section class="group">
    <p class="label">Help</p>
    <a class="item" href="/policies" onclick={leave}>Delivery & returns</a>
    <a class="item" href="/privacy" onclick={leave}>Privacy</a>
    <button
      type="button"
      class="item support-toggle"
      aria-expanded={supportOpen}
      onclick={() => (supportOpen = !supportOpen)}
    >
      Customer support
      <svg viewBox="0 0 24 24" aria-hidden="true" class:open={supportOpen}>
        <path d="M8 10l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" />
      </svg>
    </button>
    {#if supportOpen}
      <div class="support">
        <SupportForm initialEmail={customer?.email ?? ''} />
      </div>
    {/if}
    </section>
  </div>

<style>
  .scrim {
    position: fixed;
    inset: 0;
    z-index: 60;
    border: none;
    padding: 0;
    background: rgb(17 17 17 / 45%);
    cursor: pointer;
  }

  .drawer {
    position: fixed;
    z-index: 70;
    top: 0;
    bottom: 0;
    left: 0;
    width: min(360px, 100%);
    overflow-y: auto;
    padding: calc(12px + env(safe-area-inset-top)) 20px calc(28px + env(safe-area-inset-bottom));
    background: #fff;
    color: var(--ink);
    border-right: 1px solid var(--ink);
    font-family: 'Instrument Sans', var(--font-body);
    font-size: 14px;
    font-weight: 400;
    line-height: 1.35;
    letter-spacing: 0;
    animation: slide-in var(--dur) var(--ease-out);
  }

  .drawer-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 44px;
    margin: 0 -20px;
    padding: 0 8px 0 20px;
    border-bottom: 1px solid var(--border);
  }

  .mark {
    font-family: var(--font-body);
    font-weight: 700;
    font-size: 22px;
    letter-spacing: -0.05em;
    color: inherit;
    text-decoration: none;
    text-transform: lowercase;
  }

  .mark-e {
    text-decoration: underline;
    text-decoration-color: var(--pop);
    text-decoration-thickness: 2px;
    text-underline-offset: 3px;
  }

  .close:focus-visible,
  .cat button:focus-visible,
  .item:focus-visible,
  .scrim:focus-visible {
    outline: 2px solid var(--ink);
    outline-offset: 2px;
  }

  .close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border: none;
    background: none;
    color: inherit;
    cursor: pointer;
  }

  .close :global(.icon) {
    width: 22px;
    height: 22px;
  }

  .group {
    margin-top: 18px;
  }

  .label {
    margin: 0;
    padding: 2px 0 8px;
    border-bottom: 1px solid var(--border);
    color: var(--text-secondary);
    font-size: 14px;
    font-weight: 400;
    line-height: 1.35;
  }

  .who,
  .email {
    font-size: 14px;
    font-weight: 400;
    line-height: 1.35;
  }

  .who {
    padding-top: 8px;
  }

  .email {
    padding: 2px 0 8px;
    border-bottom: 1px solid var(--border);
    color: var(--text-secondary);
    word-break: break-word;
  }

  .item,
  .cat a,
  .cat-link {
    display: flex;
    align-items: center;
    width: 100%;
    min-height: 40px;
    padding: 0;
    border: none;
    border-bottom: 1px solid var(--border);
    background: none;
    color: var(--ink);
    font: inherit;
    font-size: 14px;
    font-weight: 400;
    line-height: 1.35;
    text-align: left;
    text-decoration: none;
    cursor: pointer;
  }

  .cat,
  .cat-link {
    display: flex;
    align-items: center;
  }

  .cat {
    border-bottom: 1px solid var(--border);
  }

  .cat a,
  .cat-link {
    flex: 1;
    min-width: 0;
    padding-left: calc(var(--depth, 0) * 14px);
  }

  .cat a {
    border-bottom: none;
  }

  .cat a.current,
  .cat-link.current {
    font-weight: 500;
    text-decoration: underline;
    text-decoration-color: var(--pop);
    text-decoration-thickness: 2px;
    text-underline-offset: 4px;
  }

  .cat button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    flex: none;
    margin-right: -10px;
    border: none;
    background: none;
    color: inherit;
    cursor: pointer;
  }

  .cat svg,
  .support-toggle svg {
    width: 16px;
    height: 16px;
    transition: transform var(--dur-fast) var(--ease-out);
  }

  .cat svg.open,
  .support-toggle svg.open {
    transform: rotate(180deg);
  }

  .support-toggle {
    justify-content: space-between;
  }

  .support {
    padding: 12px 0 4px;
    border-bottom: 1px solid var(--border);
    font-family: var(--font-body);
  }

  @media (min-width: 1280px) {
    .drawer {
      position: static;
      z-index: auto;
      width: auto;
      inset: auto;
      animation: none;
      border: none;
      min-height: 100%;
      padding: 0 20px 28px;
    }

    .drawer-top {
      min-height: 64px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .drawer,
    .cat svg,
    .support-toggle svg {
      animation: none;
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .scrim {
      background: Canvas;
    }

    .drawer {
      background: Canvas;
      color: CanvasText;
      border-color: CanvasText;
    }

    .item,
    .cat a,
    .cat-link,
    .mark,
    .label,
    .email {
      color: CanvasText;
    }

    .drawer-top,
    .group,
    .label,
    .email,
    .item,
    .cat,
    .cat-link,
    .support {
      border-color: CanvasText;
    }

    .cat a.current,
    .cat-link.current,
    .mark-e {
      text-decoration-color: CanvasText;
    }
  }

  @keyframes slide-in {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: none;
    }
  }
</style>
