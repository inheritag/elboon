<script lang="ts">
  let { name }: { name: 'user' | 'cart' | 'mail' | 'search' | 'logout' | 'close' } = $props();
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
  {:else if name === 'search'}
    <path
      fill="currentColor"
      d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
    />
  {:else if name === 'close'}
    <path
      fill="currentColor"
      d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
    />
  {:else if name === 'logout'}
    <path
      fill="currentColor"
      d="M17 8l-1.41 1.41L18.17 12H8v2h10.17l-2.58 2.59L17 18l5-5-5-5zM4 6h8V4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h8v-2H4V6z"
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
