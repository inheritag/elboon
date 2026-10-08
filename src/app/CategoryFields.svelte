<script lang="ts">
  import { canNestUnder, flattenTree, type CategoryRecord } from '../domain/catalog';

  let {
    categories,
    value = $bindable(''),
    id = 'category'
  }: {
    categories: CategoryRecord[];
    value?: string;
    id?: string;
  } = $props();

  let options = $derived(flattenTree(categories));
  let parents = $derived(options.filter((row) => canNestUnder(null, row.slug, categories)));
</script>

<div class="field">
  <label for={id}>Category</label>
  <select {id} name="category" required bind:value>
    {#each options as option}
      <option value={option.slug}>{option.path}</option>
    {/each}
    <option value="__new__">Add category…</option>
  </select>
  {#if value === '__new__'}
    <input name="newCategory" required placeholder="Name" />
    <label class="parent-label" for="{id}-parent">Under</label>
    <select id="{id}-parent" name="newCategoryParent">
      <option value="">Top level</option>
      {#each parents as option}
        <option value={option.slug}>{option.path}</option>
      {/each}
    </select>
  {/if}
</div>

<style>
  .parent-label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    margin: 10px 0 6px;
  }
</style>
