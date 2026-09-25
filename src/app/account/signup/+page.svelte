<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData, PageData } from './$types';

  let { form, data }: { form: ActionData; data: PageData } = $props();
</script>

<section class="container auth">
  <h1>Create an account</h1>
  <p>Optional. Guest checkout still works. An account remembers shipping and your offers.</p>

  <form method="POST" use:enhance class="card">
    <input type="hidden" name="redirectTo" value={data.redirectTo} />
    <div class="field">
      <label for="fullName">Name</label>
      <input id="fullName" name="fullName" value={form?.fullName ?? ''} />
    </div>
    <div class="field">
      <label for="email">Email</label>
      <input id="email" name="email" type="email" value={form?.email ?? data.email} required />
    </div>
    <div class="field">
      <label for="password">Password</label>
      <input id="password" name="password" type="password" minlength="8" required />
    </div>
    <button class="btn btn-primary" type="submit">Create account</button>
    {#if form?.error}
      <p class="error-text">{form.error}</p>
    {/if}
  </form>

  <p class="switch">
    Already have one? <a href="/account/login?redirectTo={encodeURIComponent(data.redirectTo)}">Sign in</a>
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
