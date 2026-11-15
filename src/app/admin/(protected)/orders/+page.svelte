<script lang="ts">
  import { enhance } from '$app/forms';
  import { formatPrice } from '../../../../domain/product';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let toSend = $derived(
    data.orders.filter((order) => order.payment_status === 'paid' && order.logistics_status === 'awaiting_partner')
  );
  let sent = $derived(data.orders.filter((order) => order.logistics_status === 'handed_off'));
  let unpaid = $derived(data.orders.filter((order) => order.payment_status !== 'paid'));
</script>

<section class="container orders-admin">
  <h1>Orders</h1>
  {#if form?.error}<p class="error-text">{form.error}</p>{/if}
  {#if form?.emailed}<p class="muted">Acknowledgement sent.</p>{/if}

  <h2>To send ({toSend.length})</h2>
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
      {#if order.carrier_ref}
        <p class="when">
          Booked with Royal Mail{#if order.tracking_number} · {order.tracking_number}{/if}
        </p>
      {/if}
      <div class="ticket-actions">
        <form method="POST" action="?/handoff" use:enhance>
          <input type="hidden" name="id" value={order.id} />
          <button class="btn btn-primary" type="submit">Mark as sent</button>
        </form>
        <form method="POST" action="?/acknowledge" use:enhance>
          <input type="hidden" name="id" value={order.id} />
          <button class="btn btn-secondary" type="submit">Email acknowledgement</button>
        </form>
      </div>
    </article>
  {:else}
    <p class="muted">Nothing to send.</p>
  {/each}

  {#if sent.length > 0}
    <h2>Sent ({sent.length})</h2>
    {#each sent as order}
      <p class="muted">
        {new Date(order.created_at).toLocaleString('en-GB')} · {order.shipping_address.fullName} ·
        {formatPrice(order.total_cents, 'GBP')}{#if order.tracking_number} · {order.tracking_number}{/if}
      </p>
      <form method="POST" action="?/acknowledge" use:enhance>
        <input type="hidden" name="id" value={order.id} />
        <button class="text-btn" type="submit">Email acknowledgement</button>
      </form>
    {/each}
  {/if}

  {#if unpaid.length > 0}
    <h2>Not paid ({unpaid.length})</h2>
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
    margin: 40px 0 16px;
  }

  .ticket {
    padding: 20px 22px;
    margin-bottom: 16px;
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

  .ticket-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 14px;
  }

  .text-btn {
    margin: 0 0 12px;
    padding: 0;
    border: none;
    background: none;
    color: var(--ink);
    font: inherit;
    font-size: 14px;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
</style>
