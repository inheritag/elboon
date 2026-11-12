import { isCategorySlug } from '../domain/catalog';
import { getStore } from './store';

/** A new category can stand alone, or it can have a new subcategory under it. */
export async function categoryFromForm(form: FormData): Promise<string | { error: string }> {
  const selected = String(form.get('category') ?? '');
  const store = getStore();
  if (selected !== '__new__') {
    const known = new Set((await store.listCategories()).map((row) => row.slug));
    if (!isCategorySlug(selected) || !known.has(selected)) {
      return { error: 'Name, category and price are required' };
    }
    return selected;
  }

  const label = String(form.get('newCategory') ?? '').trim();
  const subcategory = String(form.get('newSubcategory') ?? '').trim();
  const parent = String(form.get('newCategoryParent') ?? '').trim() || null;
  if (!label) return { error: 'Enter a name for the new category' };

  try {
    const created = await store.createCategory(label, parent);
    if (!subcategory) return created.slug;
    return (await store.createCategory(subcategory, created.slug)).slug;
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not add category' };
  }
}