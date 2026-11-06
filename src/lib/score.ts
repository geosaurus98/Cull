import { DAY_MS, type Item } from './types';

/**
 * Cull score: higher = stronger candidate for getting rid of.
 *
 *   score = STALE_WEIGHT * staleness + COST_WEIGHT * costPerUseFactor   (0..100)
 *
 * - staleness: days since last used, linear, capped at STALE_CAP_DAYS (→ 0..1).
 *   This is the dominant term (75 of the 100 points).
 * - costPerUseFactor: purchasePrice / max(uses, 1) on a log scale, capped at
 *   COST_CAP per use (→ 0..1). Worth up to 25 points. Higher cost per use = worse value.
 * - Items with no price get 0 cost points, so they rank on staleness alone.
 */
export const STALE_WEIGHT = 75;
export const COST_WEIGHT = 25;
export const STALE_CAP_DAYS = 3 * 365;
export const COST_CAP = 1000;

export type ScoreInput = Pick<Item, 'lastUsedAt' | 'useLog' | 'purchasePrice'>;

export function daysSince(timestamp: number, now: number): number {
  return Math.max(0, (now - timestamp) / DAY_MS);
}

/** Price divided by number of recorded uses (min 1). Undefined if there is no price. */
export function costPerUse(item: Pick<Item, 'purchasePrice' | 'useLog'>): number | undefined {
  const price = item.purchasePrice;
  if (price === undefined || price === null || !Number.isFinite(price) || price < 0) return undefined;
  return price / Math.max(item.useLog.length, 1);
}

export function stalenessFactor(item: Pick<Item, 'lastUsedAt'>, now: number): number {
  return Math.min(daysSince(item.lastUsedAt, now), STALE_CAP_DAYS) / STALE_CAP_DAYS;
}

export function costFactor(item: Pick<Item, 'purchasePrice' | 'useLog'>): number {
  const cpu = costPerUse(item);
  if (cpu === undefined) return 0;
  return Math.min(Math.log10(1 + cpu) / Math.log10(1 + COST_CAP), 1);
}

export function cullScore(item: ScoreInput, now: number = Date.now()): number {
  return STALE_WEIGHT * stalenessFactor(item, now) + COST_WEIGHT * costFactor(item);
}

/**
 * Sort by cull score, highest first. Ties are broken deterministically:
 * least recently used first, then name (A→Z), then id.
 * Returns a new array; the input is not mutated.
 */
export function sortByCullScore<T extends ScoreInput & Pick<Item, 'name' | 'id'>>(
  items: readonly T[],
  now: number = Date.now(),
): T[] {
  return items
    .map((item) => ({ item, score: cullScore(item, now) }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.item.lastUsedAt - b.item.lastUsedAt ||
        a.item.name.localeCompare(b.item.name) ||
        (a.item.id < b.item.id ? -1 : a.item.id > b.item.id ? 1 : 0),
    )
    .map(({ item }) => item);
}
