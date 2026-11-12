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
    <label class="parent-label" for="{id}-name">Category name</label>
    <input id="{id}-name" name="newCategory" required placeholder="Travel" />
    <label class="parent-label" for="{id}-sub">Subcategory</label>
    <input id="{id}-sub" name="newSubcategory" placeholder="Leave blank if it has none" />
    <label class="parent-label" for="{id}-parent">Put it under</label>
    <select id="{id}-parent" name="newCategoryParent">
      <option value="">No parent</option>
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
