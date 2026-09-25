<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Sign in · elboon</title>
</svelte:head>

<section class="fallback">
  <h1 class="sr-only">Sign in</h1>
  <p class="sr-only">Sign in, then continue to {data.redirectTo}.</p>
</section>
