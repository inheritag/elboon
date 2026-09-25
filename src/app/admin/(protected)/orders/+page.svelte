<script lang="ts">
  import { enhance } from '$app/forms';
  import { formatPrice } from '../../../../domain/product';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let toSend = $derived(
    data.orders.filter((order) => order.payment_status === 'paid' && order.logistics_status === 'awaiting_partner')
  );
  let sent = $derived(data.orders.filter((order) => order.logistics_status === 'handed_off'));
  let unpaid = $derived(data.orders.filter((order) => order.payment_status !== 'paid'));
</script>

<section class="container orders-admin">
  <h1>Orders</h1>

  <h2>To send ({toSend.length})</h2>
  <p class="lede">Paid. Copy the address and items, then mark as handed to the logistics partner.</p>
  {#each toSend as order}
    <article class="card ticket">
      <p class="when">{new Date(order.created_at).toLocaleString('en-GB')} · {formatPrice(order.total_cents, 'GBP')}</p>
      <p>
        <strong>{order.shipping_address.fullName}</strong><br />
        {order.shipping_address.phone}<br />
        <a href="mailto:{order.customer_email}">{order.customer_email}</a><br />
        {order.shipping_address.line1}{order.shipping_address.line2 ? `, ${order.shipping_address.line2}` : ''}<br />
        {order.shipping_address.city}, {order.shipping_address.postcode}<br />
        {order.shipping_address.country}
      </p>
      <ul>
        {#each order.items as item}
          <li>{item.productName} × {item.quantity}</li>
        {/each}
      </ul>
      <form method="POST" action="?/handoff" use:enhance>
        <input type="hidden" name="id" value={order.id} />
        <button class="btn btn-primary" type="submit">Handed to partner</button>
      </form>
    </article>
  {:else}
    <p class="muted">Nothing to send.</p>
  {/each}

  {#if sent.length > 0}
    <h2>Sent ({sent.length})</h2>
    {#each sent as order}
      <p class="muted">
        {new Date(order.created_at).toLocaleString('en-GB')} · {order.shipping_address.fullName} ·
        {formatPrice(order.total_cents, 'GBP')}
      </p>
    {/each}
  {/if}

  {#if unpaid.length > 0}
    <h2>Not paid ({unpaid.length})</h2>
    <p class="lede">Checkout started, payment not finished. Do not ship these.</p>
    {#each unpaid as order}
      <p class="muted">
        {new Date(order.created_at).toLocaleString('en-GB')} · {order.customer_email} ·
        {formatPrice(order.total_cents, 'GBP')}
      </p>
    {/each}
  {/if}
</section>

<style>
  .orders-admin {
    padding: 24px 0 48px;
    max-width: 720px;
  }

  h2 {
    font-size: 18px;
    margin: 28px 0 8px;
  }

  .lede {
    color: var(--text-secondary);
    margin-bottom: 12px;
  }

  .ticket {
    padding: 16px 20px;
    margin-bottom: 12px;
  }

  .when {
    font-size: 13px;
    color: var(--text-muted);
    margin-bottom: 8px;
  }

  ul {
    margin: 10px 0 14px;
    padding-left: 18px;
  }

  .muted {
    color: var(--text-secondary);
    font-size: 14px;
    margin: 4px 0;
  }
</style>
