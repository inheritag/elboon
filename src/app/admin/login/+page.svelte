<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData, PageData } from './$types';

  let { form, data }: { form: ActionData; data: PageData } = $props();
</script>

<section class="container login">
  <h1>Admin login</h1>
  <form method="POST" use:enhance class="card">
    {#if data.devMode && data.devPassword}
      <p class="dev-hint">Dev mode password: <code>{data.devPassword}</code></p>
    {/if}
    <div class="field">
      <label for="password">Password</label>
      <input id="password" name="password" type="password" required />
    </div>
    <button class="btn btn-primary" type="submit">Log in</button>
    {#if form?.error}
      <p class="error-text">{form.error}</p>
    {/if}
  </form>
</section>

<style>
  .login {
    max-width: 360px;
    margin: 80px auto;
    padding: 0;
  }

  form {
    padding: 24px;
  }

  .dev-hint {
    font-size: 13px;
    color: var(--accent);
    margin-bottom: 16px;
  }
</style>
