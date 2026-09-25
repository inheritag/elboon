<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<section class="container account">
  <h1>Your account</h1>
  <p>{data.profile.email}</p>

  <nav class="links">
    <a href="/account/offers">Your offers</a>
    <a href="/cart">Your cart</a>
  </nav>

  {#if data.profile.shippingAddress}
    <div class="card address">
      <h2>Saved shipping</h2>
      <p>{data.profile.shippingAddress.fullName}</p>
      <p>{data.profile.shippingAddress.phone}</p>
      <p>{data.profile.shippingAddress.line1}, {data.profile.shippingAddress.city}</p>
      <p>{data.profile.shippingAddress.postcode}, {data.profile.shippingAddress.country}</p>
    </div>
  {:else}
    <p class="muted">No saved address yet. It is stored the next time you check out.</p>
  {/if}

  <form method="POST" action="?/logout" use:enhance>
    <button class="btn btn-secondary" type="submit">Sign out</button>
  </form>
</section>

<style>
  .account {
    max-width: 560px;
    padding: 40px 0 64px;
  }

  .links {
    display: flex;
    gap: 16px;
    margin: 16px 0 24px;
  }

  .links a {
    color: var(--accent);
    text-decoration: underline;
  }

  .address {
    padding: 16px 20px;
    margin-bottom: 20px;
  }

  .muted {
    color: var(--text-secondary);
    margin-bottom: 20px;
  }
</style>
