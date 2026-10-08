import { parseColors, parseSku, type ProductColor, type ProductSize } from '../domain/product';
import { saveProductImages } from './uploads';

function kept(form: FormData, field: string): string[] {
  return form
    .getAll(field)
    .filter((value): value is string => typeof value === 'string')
    .filter((value) => value.startsWith('/products/') || value.startsWith('/uploads/'));
}

export function sizeNamesFromForm(form: FormData): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  for (const raw of form.getAll('sizeName')) {
    const name = String(raw).trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }
  return names;
}

export function sizesFromForm(form: FormData): ProductSize[] {
  const names = sizeNamesFromForm(form);
  const stocks = form.getAll('sizeStock').map(String);
  const skus = form.getAll('sizeSku').map(String);
  return names.map((name, index) => ({
    name,
    stockQty: Math.max(0, Number(stocks[index]) || 0),
    sku: parseSku(skus[index])
  }));
}

export async function colorsFromForm(form: FormData): Promise<ProductColor[]> {
  const names = form.getAll('colorName').map(String);
  const hexes = form.getAll('colorHex').map(String);
  const stocks = form.getAll('colorStock').map(String);
  const sizeNames = sizeNamesFromForm(form);
  const colors: ProductColor[] = [];

  for (let i = 0; i < names.length; i++) {
    const name = names[i].trim();
    if (!name) continue;
    const hex = hexes[i] ?? '#111111';
    const uploaded = await saveProductImages(form, `colorImages_${i}`);
    const sizeStocks =
      sizeNames.length > 0
        ? sizeNames.map((sizeName, index) => ({
            name: sizeName,
            stockQty: Math.max(0, Number(form.getAll(`colorSizeStock_${i}`)[index]) || 0),
            sku: parseSku(form.getAll(`colorSizeSku_${i}`)[index])
          }))
        : [];
    const stockQty =
      sizeStocks.length > 0
        ? sizeStocks.reduce((sum, size) => sum + size.stockQty, 0)
        : Math.max(0, Number(stocks[i]) || 0);
    colors.push({
      name,
      hex: /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#111111',
      imageUrls: [...kept(form, `colorKeep_${i}`), ...uploaded],
      stockQty,
      sku: sizeStocks.length > 0 ? null : parseSku(form.getAll('colorSku')[i]),
      sizeStocks
    });
  }

  return colors;
}

export { parseColors };
