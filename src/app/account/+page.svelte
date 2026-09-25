<script lang="ts">
  import { enhance } from '$app/forms';
  import OfferCard from '../OfferCard.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<section class="container account">
  <header class="top">
    <div>
      <h1>Your account</h1>
      <p class="email">{data.profile.email}</p>
    </div>
    <form method="POST" action="?/logout" use:enhance>
      <button class="btn btn-secondary" type="submit">Sign out</button>
    </form>
  </header>

  <section class="block">
    <h2>Offers</h2>
    <p class="lede">Accepted and countered offers can be checked out at the agreed price.</p>
    {#each data.offers as offer}
      <OfferCard {offer} />
    {:else}
      <p class="muted">No offers yet.</p>
      <a class="btn btn-primary" href="/">Browse products</a>
    {/each}
  </section>

  <section class="block">
    <h2>Saved shipping</h2>
    {#if data.profile.shippingAddress}
      <div class="card address">
        <p>{data.profile.shippingAddress.fullName}</p>
        <p>{data.profile.shippingAddress.phone}</p>
        <p>{data.profile.shippingAddress.line1}, {data.profile.shippingAddress.city}</p>
        <p>{data.profile.shippingAddress.postcode}, {data.profile.shippingAddress.country}</p>
      </div>
    {:else}
      <p class="muted">No saved address yet. It is stored the next time you check out.</p>
    {/if}
  </section>
</section>

<style>
  .account {
    max-width: 640px;
    padding: 40px 0 64px;
  }

  .top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 32px;
    flex-wrap: wrap;
  }

  .email {
    color: var(--text-secondary);
  }

  .top .btn {
    width: auto;
  }

  .block {
    margin-bottom: 32px;
  }

  .block h2 {
    font-size: 22px;
    margin-bottom: 6px;
  }

  .lede,
  .muted {
    color: var(--text-secondary);
    margin-bottom: 12px;
  }

  .address {
    padding: 16px 20px;
  }

  .block .btn-primary {
    width: auto;
  }
</style>
