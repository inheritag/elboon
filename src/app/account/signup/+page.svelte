<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Create an account · elboon</title>
</svelte:head>

<section class="fallback">
  <h1 class="sr-only">Create an account</h1>
  <p class="sr-only">Create an account, then continue to {data.redirectTo}.</p>
</section>
