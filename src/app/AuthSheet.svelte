<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/state';
  import type { ActionResult } from '@sveltejs/kit';
  import { authHref, authModeFrom, closeAuthHref } from './auth-href';
  import Icon from './Icon.svelte';

  let dialog: HTMLDialogElement | null = $state(null);
  let error = $state('');
  let submitting = $state(false);

  let mode = $derived(authModeFrom(page.url) ?? 'login');
  let redirectTo = $derived(
    page.url.searchParams.get('redirectTo') ||
      (page.url.pathname.startsWith('/account/') ? '/account' : closeAuthHref(page.url))
  );
  let emailPrefill = $derived(page.url.searchParams.get('email') ?? '');
  let guest = $derived(redirectTo === '/checkout' || redirectTo.startsWith('/checkout'));

  $effect(() => {
    const form = page.form as { error?: string } | null;
    if (form?.error) error = form.error;
  });

  $effect(() => {
    const node = dialog;
    if (!node) return;
    if (!node.open) node.showModal();
    const first = node.querySelector<HTMLInputElement>('input:not([type=hidden])');
    first?.focus();
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  });

  function close() {
    void goto(closeAuthHref(page.url), { replaceState: true, noScroll: true });
  }

  function switchMode(next: 'login' | 'signup') {
    error = '';
    void goto(authHref(page.url, next, { redirectTo, email: emailPrefill }), {
      replaceState: true,
      noScroll: true,
      keepFocus: true
    });
  }

  function handle() {
    error = '';
    submitting = true;
    return async ({ result }: { result: ActionResult }) => {
      submitting = false;
      if (result.type === 'failure') {
        const data = result.data as { error?: string } | undefined;
        error = data?.error ?? (mode === 'signup' ? 'Could not create the account' : 'Could not sign in');
        return;
      }
      if (result.type === 'redirect') {
        await invalidateAll();
        await goto(result.location, { replaceState: true, invalidateAll: true });
      }
    };
  }
</script>

<dialog
  bind:this={dialog}
  class="sheet"
  aria-labelledby="auth-title"
  oncancel={(event) => {
    event.preventDefault();
    close();
  }}
  onclick={(event) => {
    if (event.target === dialog) close();
  }}
>
  <button class="close" type="button" aria-label="Close" onclick={close}>
    <Icon name="close" />
  </button>
  {#if mode === 'signup'}
    <h2 id="auth-title">Create an account</h2>
    <p>Saves shipping details and offers. You can still pay as a guest.</p>
    <form method="POST" action="/account/signup" use:enhance={handle}>
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <div class="field">
        <label for="auth-name">Name</label>
        <input id="auth-name" name="fullName" />
      </div>
      <div class="field">
        <label for="auth-email">Email</label>
        <input id="auth-email" name="email" type="email" value={emailPrefill} required />
      </div>
      <div class="field">
        <label for="auth-password">Password</label>
        <input id="auth-password" name="password" type="password" minlength="8" required />
      </div>
      <button class="btn btn-primary" type="submit" disabled={submitting}>
        {submitting ? 'Creating…' : 'Create account'}
      </button>
      {#if error}
        <p class="error-text">{error}</p>
      {/if}
    </form>
    <p class="switch">
      Already have one?
      <button type="button" class="text-link" onclick={() => switchMode('login')}>Sign in</button>
    </p>
  {:else}
    <h2 id="auth-title">Sign in</h2>
    <p>Saves shipping details and your offers.</p>
    <form method="POST" action="/account/login" use:enhance={handle}>
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <div class="field">
        <label for="auth-email">Email</label>
        <input id="auth-email" name="email" type="email" value={emailPrefill} required />
      </div>
      <div class="field">
        <label for="auth-password">Password</label>
        <input id="auth-password" name="password" type="password" required />
      </div>
      <button class="btn btn-primary" type="submit" disabled={submitting}>
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>
      {#if error}
        <p class="error-text">{error}</p>
      {/if}
    </form>
    <p class="switch">
      New here?
      <button type="button" class="text-link" onclick={() => switchMode('signup')}>Create an account</button>
    </p>
  {/if}

  {#if guest}
    <a class="btn btn-secondary" href="/checkout">Continue as guest</a>
  {/if}
</dialog>

<style>
  dialog.sheet {
    position: relative;
    width: min(420px, calc(100vw - 32px));
    max-height: 90dvh;
    overflow-y: auto;
    margin: auto;
    padding: 28px 48px 20px 22px;
    border: 2px solid var(--border);
    border-radius: var(--card-radius);
    background: #fff;
    color: var(--text-primary);
    box-shadow: none;
  }

  .close {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 36px;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: none;
    color: var(--text-primary);
    cursor: pointer;
  }

  .close:hover {
    color: var(--accent);
  }

  dialog.sheet::backdrop {
    background: color-mix(in srgb, var(--text-primary) 55%, transparent);
  }

  h2 {
    font-size: 26px;
    margin-bottom: 8px;
  }

  p {
    color: var(--text-secondary);
    margin-bottom: 16px;
  }

  form {
    margin-bottom: 12px;
  }

  .switch {
    font-size: 14px;
    margin-bottom: 8px;
  }

  .text-link {
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    color: var(--accent);
    text-decoration: underline;
    cursor: pointer;
  }

  .sheet .btn {
    width: 100%;
    margin-top: 4px;
  }

  @media (forced-colors: active) {
    dialog.sheet {
      background: Canvas;
      color: CanvasText;
      border: 2px solid CanvasText;
    }

    dialog.sheet::backdrop {
      background: Canvas;
    }

    .close {
      color: CanvasText;
      border: 1px solid CanvasText;
    }
  }
</style>
