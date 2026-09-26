import { parseColors, type ProductColor } from '../domain/product';
import { saveProductImages } from './uploads';

function kept(form: FormData, field: string): string[] {
  return form
    .getAll(field)
    .filter((value): value is string => typeof value === 'string')
    .filter((value) => value.startsWith('/products/') || value.startsWith('/uploads/'));
}

export async function colorsFromForm(form: FormData): Promise<ProductColor[]> {
  const names = form.getAll('colorName').map(String);
  const hexes = form.getAll('colorHex').map(String);
  const stocks = form.getAll('colorStock').map(String);
  const colors: ProductColor[] = [];

  for (let i = 0; i < names.length; i++) {
    const name = names[i].trim();
    if (!name) continue;
    const hex = hexes[i] ?? '#111111';
    const uploaded = await saveProductImages(form, `colorImages_${i}`);
    colors.push({
      name,
      hex: /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#111111',
      imageUrls: [...kept(form, `colorKeep_${i}`), ...uploaded],
      stockQty: Math.max(0, Number(stocks[i]) || 0)
    });
  }

  return colors;
}

export { parseColors };
