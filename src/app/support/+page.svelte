<script lang="ts">
  import { page } from '$app/state';
  import SupportForm from '../SupportForm.svelte';

  let email = $derived(
    (page.data.customer as { email?: string } | null | undefined)?.email ?? ''
  );
</script>

<svelte:head>
  <title>Customer support · elboon</title>
</svelte:head>

<section class="container support">
  <h1>Customer support</h1>
  <p>Send a message and we will reply by email.</p>
  <SupportForm initialEmail={email} />
</section>

<style>
  .support {
    max-width: 640px;
    padding: 40px 0 64px;
  }

  h1 {
    margin-bottom: 8px;
  }

  p {
    margin-bottom: 22px;
    color: var(--text-secondary);
  }
</style>
