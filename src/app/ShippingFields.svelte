<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { AddressSuggestion } from '../domain/address';
  import CountryField from './CountryField.svelte';

  let {
    fullName = $bindable(''),
    phone = $bindable(''),
    line1 = $bindable(''),
    city = $bindable(''),
    postcode = $bindable(''),
    country = $bindable(''),
    children
  }: {
    fullName?: string;
    phone?: string;
    line1?: string;
    city?: string;
    postcode?: string;
    country?: string;
    children?: Snippet;
  } = $props();

  let suggestions = $state<AddressSuggestion[]>([]);
  let open = $state(false);
  let active = $state(0);
  let revealed = $state(false);
  let addressInput = $state<HTMLInputElement | null>(null);
  let requestId = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  $effect(() => {
    if (city.trim() || postcode.trim() || country.trim()) revealed = true;
  });

  $effect(() => {
    addressInput?.setCustomValidity(revealed ? '' : 'Choose an address, or enter it manually.');
  });

  function scheduleLookup() {
    open = true;
    clearTimeout(timer);
    const q = line1.trim();
    if (q.length < 3) {
      suggestions = [];
      open = false;
      return;
    }
    timer = setTimeout(() => void lookup(q), 280);
  }

  async function lookup(q: string) {
    const id = ++requestId;
    try {
      const response = await fetch(`/checkout/address?q=${encodeURIComponent(q)}`);
      if (!response.ok || id !== requestId) return;
      const body = (await response.json()) as { suggestions?: AddressSuggestion[] };
      if (id !== requestId) return;
      suggestions = body.suggestions ?? [];
      active = 0;
      open = suggestions.length > 0;
    } catch {
      if (id === requestId) suggestions = [];
    }
  }

  function pick(suggestion: AddressSuggestion) {
    line1 = suggestion.line1;
    city = suggestion.city;
    postcode = suggestion.postcode;
    country = suggestion.country;
    revealed = true;
    suggestions = [];
    open = false;
  }

  function enterManually() {
    revealed = true;
    open = false;
    queueMicrotask(() => document.getElementById('city')?.focus());
  }

  function onKeydown(event: KeyboardEvent) {
    if (!open || suggestions.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      active = (active + 1) % suggestions.length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      active = (active - 1 + suggestions.length) % suggestions.length;
    } else if (event.key === 'Enter') {
      event.preventDefault();
      pick(suggestions[active] ?? suggestions[0]);
    } else if (event.key === 'Escape') {
      open = false;
    }
  }
</script>

<div class="field">
  <label for="fullName">Full name</label>
  <input id="fullName" name="name" autocomplete="shipping name" bind:value={fullName} required />
</div>
<div class="field">
  <label for="phone">Phone</label>
  <input id="phone" name="phone" type="tel" autocomplete="shipping tel" bind:value={phone} required />
</div>
<div class="field">
  <label for="line1">Address</label>
  <div class="lookup">
    <input
      id="line1"
      name="address"
      placeholder={revealed ? '' : 'Search for your address'}
      autocomplete={revealed ? 'shipping address-line1' : 'off'}
      role="combobox"
      aria-autocomplete="list"
      aria-expanded={open}
      aria-controls="address-suggestions"
      aria-activedescendant={open ? `address-option-${active}` : undefined}
      bind:this={addressInput}
      bind:value={line1}
      oninput={scheduleLookup}
      onkeydown={onKeydown}
      onblur={() => (open = false)}
      required
    />
    {#if open}
      <ul id="address-suggestions" class="list" role="listbox">
        {#each suggestions as suggestion, i}
          <li role="presentation">
            <button
              id="address-option-{i}"
              type="button"
              role="option"
              aria-selected={i === active}
              onmousedown={(event) => event.preventDefault()}
              onclick={() => pick(suggestion)}
            >
              {suggestion.label}
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>
{#if !revealed}
  <button class="manual" type="button" onclick={enterManually}>Enter address manually</button>
{/if}
{#if revealed}
  <div class="fields-2">
    <div class="field">
      <label for="city">City</label>
      <input id="city" name="city" autocomplete="shipping address-level2" bind:value={city} required />
    </div>
    <div class="field">
      <label for="postcode">Postcode</label>
      <input id="postcode" name="postcode" autocomplete="shipping postal-code" bind:value={postcode} required />
    </div>
  </div>
  <CountryField bind:value={country} />
{/if}
{#if children}
  {@render children()}
{/if}

<style>
  .lookup {
    position: relative;
  }

  .list {
    position: absolute;
    z-index: 4;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    margin: 0;
    padding: 0;
    list-style: none;
    background: var(--surface);
    border: 1px solid var(--ink);
    max-height: 240px;
    overflow: auto;
  }

  .list button {
    display: block;
    width: 100%;
    padding: 10px 12px;
    border: 0;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-primary);
    font: inherit;
    font-size: 14px;
    line-height: 1.35;
    text-align: left;
    cursor: pointer;
  }

  .list li:last-child button {
    border-bottom: 0;
  }

  .list button[aria-selected='true'],
  .list button:hover {
    background: var(--bg-subtle);
  }

  .manual {
    display: block;
    width: fit-content;
    margin: 0 0 18px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    font-size: 14px;
    font-weight: 600;
    text-align: left;
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }

  .manual:focus-visible {
    outline: 2px solid var(--ink);
    outline-offset: 2px;
  }
</style>
