<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData, PageData } from './$types';

  let { form, data }: { form: ActionData; data: PageData } = $props();
</script>

<section class="container auth">
  <h1>Sign in</h1>
  <p>After you sign in we send you back to where you were, including your cart.</p>

  <form method="POST" use:enhance class="card">
    <input type="hidden" name="redirectTo" value={data.redirectTo} />
    <div class="field">
      <label for="email">Email</label>
      <input id="email" name="email" type="email" value={form?.email ?? data.email} required />
    </div>
    <div class="field">
      <label for="password">Password</label>
      <input id="password" name="password" type="password" required />
    </div>
    <button class="btn btn-primary" type="submit">Sign in</button>
    {#if form?.error}
      <p class="error-text">{form.error}</p>
    {/if}
  </form>

  <p class="switch">
    New here? <a href="/account/signup?redirectTo={encodeURIComponent(data.redirectTo)}">Create an account</a>
    or <a href="/checkout">continue as guest</a>.
  </p>
</section>

<style>
  .auth {
    max-width: 480px;
    padding: 40px 0 64px;
  }

  form {
    padding: 20px;
    margin: 16px 0;
  }

  .switch {
    color: var(--text-secondary);
  }

  .switch a {
    color: var(--accent);
    text-decoration: underline;
  }
</style>
