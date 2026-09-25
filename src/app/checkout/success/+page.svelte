<script lang="ts">
  import { onMount } from 'svelte';
  import { clearCart } from '../../cart';

  onMount(() => clearCart());
</script>

<section class="container success">
  <h1>Order confirmed</h1>
  <p>
    Payment received. A logistics partner will contact you to arrange delivery. We don’t ship from our own
    warehouse.
  </p>
  <a class="btn btn-primary" href="/">Continue shopping</a>
</section>

<style>
  .success {
    max-width: 520px;
    padding: 80px 0;
    text-align: center;
  }

  .success p {
    color: var(--text-secondary);
    margin: 12px 0 24px;
  }
</style>
