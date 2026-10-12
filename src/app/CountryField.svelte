<script lang="ts">
  import { countryOptions } from '../domain/countries';

  let { value = $bindable(''), id = 'country' }: { value?: string; id?: string } = $props();
  let options = $derived(countryOptions(value));
</script>

<div class="field">
  <label for={id}>Country</label>
  <select {id} name="country" bind:value required>
    <option value="">Choose a country</option>
    {#each options as name}
      <option value={name}>{name}</option>
    {/each}
  </select>
</div>
