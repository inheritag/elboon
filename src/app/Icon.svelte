<script lang="ts">
  let { name }: { name: 'user' | 'cart' | 'mail' } = $props();
</script>

<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  {#if name === 'user'}
    <path
      fill="currentColor"
      d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4.42 0-8 2.24-8 5v3h16v-3c0-2.76-3.58-5-8-5z"
    />
  {:else if name === 'cart'}
    <path
      fill="currentColor"
      d="M7 18a2 2 0 1 0 2 2 2 2 0 0 0-2-2zm10 0a2 2 0 1 0 2 2 2 2 0 0 0-2-2zM1 2v2h2l3.6 7.59-1.35 2.44A2 2 0 0 0 7 16h12v-2H7.42a.25.25 0 0 1-.25-.25l.03-.12.9-1.63h7.45a2 2 0 0 0 1.75-1.03L21 6H5.21L4.27 4H1z"
    />
  {:else}
    <path
      fill="currentColor"
      d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5z"
    />
  {/if}
</svg>

<style>
  .icon {
    width: 1.05em;
    height: 1.05em;
    display: block;
    flex-shrink: 0;
  }
</style>
