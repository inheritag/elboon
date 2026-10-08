<script lang="ts">
  import { enhance } from '$app/forms';
  import { variantLabel } from '../../../../domain/product';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let find = $state('');
  let filter = $state<'all' | 'low' | 'out' | 'held'>('all');
  let primed = $state(false);
  $effect.pre(() => {
    if (primed) return;
    find = data.q;
    primed = true;
  });

  let visible = $derived(
    data.lines.filter((line) => {
      if (filter === 'low' && !line.low) return false;
      if (filter === 'out' && !line.out) return false;
      if (filter === 'held' && line.held <= 0) return false;
      const needle = find.trim().toLowerCase();
      if (!needle) return true;
      const hay = `${line.productName} ${line.color ?? ''} ${line.size ?? ''} ${line.sku ?? ''}`.toLowerCase();
      return hay.includes(needle);
    })
  );
</script>

<section class="container stock-admin">
  <h1>Stock</h1>
  {#if form?.error}
    <p class="error-text">{form.error}</p>
  {/if}

  <div class="toolbar">
    <div class="filters" role="group" aria-label="Stock filter">
      <button type="button" class:on={filter === 'all'} onclick={() => (filter = 'all')}>All ({data.lines.length})</button>
      <button type="button" class:on={filter === 'low'} onclick={() => (filter = 'low')}>Low ({data.lowCount})</button>
      <button type="button" class:on={filter === 'out'} onclick={() => (filter = 'out')}>Out ({data.outCount})</button>
      <button type="button" class:on={filter === 'held'} onclick={() => (filter = 'held')}>Held ({data.heldCount})</button>
    </div>
    <div class="field find-row">
      <label class="sr-only" for="find-stock">Find stock</label>
      <input id="find-stock" type="search" placeholder="Find name, SKU, size…" bind:value={find} />
    </div>
  </div>

  <div class="table-scroll">
    <table class="product-table">
      <thead>
        <tr>
          <th>Item</th>
          <th>SKU</th>
          <th>On hand</th>
          <th>Held</th>
          <th>Free</th>
          <th>Adjust</th>
        </tr>
      </thead>
      <tbody>
        {#each visible as line}
          <tr class:out={line.out} class:unlisted={!line.listed}>
            <td>
              <a href="/admin/products/{line.productId}">{variantLabel(line.productName, line.color, line.size)}</a>
              {#if !line.listed}
                <span class="muted">Unlisted</span>
              {/if}
              {#if line.out}
                <span class="badge badge-low-stock">Out</span>
              {:else if line.low}
                <span class="badge badge-low-stock">{line.available} free</span>
              {/if}
            </td>
            <td class="sku">{line.sku ?? '—'}</td>
            <td>{line.onHand}</td>
            <td>{line.held || '—'}</td>
            <td>{line.available}</td>
            <td>
              <div class="adjust">
                <form method="POST" action="?/set" use:enhance class="set">
                  <input type="hidden" name="id" value={line.productId} />
                  <input type="hidden" name="color" value={line.color ?? ''} />
                  <input type="hidden" name="size" value={line.size ?? ''} />
                  <input
                    name="qty"
                    type="number"
                    min="0"
                    step="1"
                    value={line.onHand}
                    aria-label="On hand for {variantLabel(line.productName, line.color, line.size)}"
                  />
                  <button class="link-button" type="submit">Save</button>
                </form>
                <form method="POST" action="?/receive" use:enhance class="set">
                  <input type="hidden" name="id" value={line.productId} />
                  <input type="hidden" name="color" value={line.color ?? ''} />
                  <input type="hidden" name="size" value={line.size ?? ''} />
                  <input
                    name="qty"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="+"
                    aria-label="Received for {variantLabel(line.productName, line.color, line.size)}"
                  />
                  <button class="link-button" type="submit">Add</button>
                </form>
              </div>
            </td>
          </tr>
        {:else}
          <tr>
            <td colspan="6" class="muted">Nothing matches.</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</section>

<style>
  .stock-admin {
    padding: 24px 0 48px;
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 20px;
    align-items: center;
    margin-bottom: 16px;
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .filters button {
    border: 1px solid var(--border);
    border-radius: 999px;
    background: var(--bg-subtle);
    color: var(--text-primary);
    padding: 6px 12px;
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }

  .filters button.on {
    border-color: var(--accent);
    color: var(--accent);
  }

  .find-row {
    margin: 0;
  }

  .find-row input {
    max-width: 280px;
    border-radius: 999px;
  }

  .product-table {
    width: 100%;
    border-collapse: collapse;
  }

  .product-table th,
  .product-table td {
    text-align: left;
    padding: 16px 14px;
    border-bottom: 1px solid var(--border);
    vertical-align: middle;
  }

  .sku {
    font-variant-numeric: tabular-nums;
    font-size: 13px;
    color: var(--text-secondary);
  }

  .muted {
    color: var(--text-secondary);
    font-size: 13px;
    margin-left: 8px;
  }

  .unlisted a {
    color: var(--text-secondary);
  }

  .adjust {
    display: grid;
    gap: 6px;
  }

  .set {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .set input {
    width: 72px;
    padding: 6px 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--bg-subtle);
    color: var(--text-primary);
    font: inherit;
  }

  .link-button {
    background: none;
    border: none;
    color: var(--accent);
    cursor: pointer;
    padding: 0;
    font: inherit;
  }

  @media (max-width: 720px) {
    .product-table th:nth-child(2),
    .product-table td:nth-child(2) {
      display: none;
    }
  }
</style>
