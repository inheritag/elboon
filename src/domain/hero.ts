import { childrenOf, rootCategory, type CategoryRecord } from './catalog';

/** Used only to prefer a clearer photo. The banner does not enlarge up to this. */
export const COVER_MIN_WIDTH = 1400;
export const COVER_MIN_HEIGHT = 700;
/** Smaller than this stays off the banner. Shown at its own size, it would look soft. */
export const STAGE_MIN_EDGE = 480;

export interface HeroShot {
  id: string;
  category: string;
  imageUrl: string;
  width: number;
  height: number;
  available: boolean;
}

export interface HeroPick {
  id: string;
  imageUrl: string;
  href: string;
  width: number;
  height: number;
}

/**
 * One banner photo for this page load.
 * Unavailable items are left out, and so is a photo too small to show whole.
 * Departments take turns, the same way All does. A sharper photo is the more
 * likely draw inside its department. The same seed always returns the same photo.
 */
export function pickHero(shots: HeroShot[], categories: CategoryRecord[], seed: number): HeroPick | null {
  const usable = shots.filter(
    (shot) => shot.available && shot.width >= STAGE_MIN_EDGE && shot.height >= STAGE_MIN_EDGE
  );
  if (usable.length === 0) return null;

  const pool = bestPerProduct(usable);
  const byDepartment = new Map<string, HeroShot[]>();
  for (const shot of pool) {
    const slug = rootCategory(shot.category, categories)?.slug ?? shot.category;
    const rows = byDepartment.get(slug) ?? [];
    rows.push(shot);
    byDepartment.set(slug, rows);
  }

  const order = departmentOrder([...byDepartment.keys()], categories);
  const department = order[mod(seed, order.length)];
  const options = (byDepartment.get(department) ?? []).sort((a, b) => a.id.localeCompare(b.id));
  const chosen = options[weightedIndex(options.map(weight), mixSeed(seed))];
  return {
    id: chosen.id,
    imageUrl: chosen.imageUrl,
    href: `/product/${chosen.id}`,
    width: chosen.width,
    height: chosen.height
  };
}

function bestPerProduct(shots: HeroShot[]): HeroShot[] {
  const best = new Map<string, HeroShot>();
  for (const shot of shots) {
    const current = best.get(shot.id);
    if (!current || better(shot, current)) best.set(shot.id, shot);
  }
  return [...best.values()];
}

function better(next: HeroShot, current: HeroShot): boolean {
  const delta = sharpness(next) - sharpness(current);
  if (Math.abs(delta) > 1e-9) return delta > 0;
  return next.width * next.height > current.width * current.height;
}

/** How far the photo clears the banner. Under 1 means it would be enlarged. */
function sharpness(shot: HeroShot): number {
  return Math.min(shot.width / COVER_MIN_WIDTH, shot.height / COVER_MIN_HEIGHT);
}

function weight(shot: HeroShot): number {
  return Math.max(1, Math.round(sharpness(shot) * 100));
}

function departmentOrder(slugs: string[], categories: CategoryRecord[]): string[] {
  const rail = childrenOf(null, categories).map((category) => category.slug);
  const ordered = rail.filter((slug) => slugs.includes(slug));
  for (const slug of [...slugs].sort()) {
    if (!ordered.includes(slug)) ordered.push(slug);
  }
  return ordered;
}

function mod(seed: number, count: number): number {
  if (count <= 1) return 0;
  return Math.abs(Math.trunc(seed)) % count;
}

function mixSeed(seed: number): number {
  return Math.abs(Math.imul(Math.trunc(seed), 1664525) + 1013904223);
}

function weightedIndex(weights: number[], seed: number): number {
  const total = weights.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return mod(seed, weights.length);
  let cursor = mod(seed, total);
  for (let index = 0; index < weights.length; index += 1) {
    cursor -= weights[index];
    if (cursor < 0) return index;
  }
  return weights.length - 1;
}
