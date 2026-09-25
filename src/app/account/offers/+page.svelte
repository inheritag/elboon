<script lang="ts">
  import OfferCard from '../../OfferCard.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<section class="container offers">
  <p class="back"><a href="/account">Your account</a></p>
  <h1>Your offers</h1>
  <p>Accepted and countered offers can be checked out at the agreed price.</p>

  {#each data.offers as offer}
    <OfferCard {offer} />
  {:else}
    <div class="empty">
      <p>No offers yet.</p>
      <a class="btn btn-primary" href="/">Browse products</a>
    </div>
  {/each}
</section>

<style>
  .offers {
    max-width: 640px;
    padding: 40px 0 64px;
  }

  .back {
    margin-bottom: 8px;
  }

  .back a {
    color: var(--accent);
    text-decoration: underline;
  }

  .empty {
    margin-top: 20px;
    color: var(--text-secondary);
  }

  .empty .btn {
    margin-top: 14px;
    width: auto;
  }
</style>
