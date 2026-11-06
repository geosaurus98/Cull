import { describe, expect, it } from 'vitest';
import {
  COST_WEIGHT,
  STALE_CAP_DAYS,
  STALE_WEIGHT,
  costPerUse,
  cullScore,
  sortByCullScore,
} from './score';
import { DAY_MS } from './types';

const NOW = new Date('2026-06-01T12:00:00Z').getTime();
const daysAgo = (d: number) => NOW - d * DAY_MS;

function item(over: Partial<{ id: string; name: string; lastUsedAt: number; useLog: number[]; purchasePrice?: number }> = {}) {
  return { id: 'x', name: 'Thing', lastUsedAt: NOW, useLog: [] as number[], ...over };
}

describe('costPerUse', () => {
  it('is undefined with no price', () => {
    expect(costPerUse(item())).toBeUndefined();
  });
  it('divides by max(uses, 1)', () => {
    expect(costPerUse(item({ purchasePrice: 100 }))).toBe(100);
    expect(costPerUse(item({ purchasePrice: 100, useLog: [1, 2, 3, 4] }))).toBe(25);
  });
  it('treats a price of 0 as free, not missing', () => {
    expect(costPerUse(item({ purchasePrice: 0 }))).toBe(0);
  });
});

describe('cullScore', () => {
  it('no price: ranks on staleness only', () => {
    const s = cullScore(item({ lastUsedAt: daysAgo(STALE_CAP_DAYS / 2) }), NOW);
    expect(s).toBeCloseTo(STALE_WEIGHT / 2, 5);
  });

  it('no uses: cost per use is the full purchase price', () => {
    const noUses = cullScore(item({ purchasePrice: 200 }), NOW);
    const oneUse = cullScore(item({ purchasePrice: 200, useLog: [daysAgo(10)] }), NOW);
    expect(noUses).toBeCloseTo(oneUse, 10); // max(uses, 1)
    expect(noUses).toBeGreaterThan(0);
    const manyUses = cullScore(item({ purchasePrice: 200, useLog: Array(50).fill(daysAgo(10)) }), NOW);
    expect(manyUses).toBeLessThan(noUses);
  });

  it('recently used scores near zero', () => {
    expect(cullScore(item({ lastUsedAt: NOW }), NOW)).toBe(0);
    expect(cullScore(item({ lastUsedAt: daysAgo(1) }), NOW)).toBeLessThan(0.1);
  });

  it('very stale items hit the staleness cap', () => {
    const capped = cullScore(item({ lastUsedAt: daysAgo(STALE_CAP_DAYS) }), NOW);
    const beyond = cullScore(item({ lastUsedAt: daysAgo(STALE_CAP_DAYS * 4) }), NOW);
    expect(capped).toBeCloseTo(STALE_WEIGHT, 5);
    expect(beyond).toBeCloseTo(STALE_WEIGHT, 5);
  });

  it('a future lastUsedAt is treated as just used', () => {
    expect(cullScore(item({ lastUsedAt: NOW + 5 * DAY_MS }), NOW)).toBe(0);
  });

  it('never exceeds 100', () => {
    const worst = cullScore(item({ lastUsedAt: daysAgo(5000), purchasePrice: 1e9 }), NOW);
    expect(worst).toBeCloseTo(STALE_WEIGHT + COST_WEIGHT, 5);
  });

  it('staleness dominates: a cheap, stale item outranks an expensive, recently used one', () => {
    const stale = cullScore(item({ lastUsedAt: daysAgo(730), purchasePrice: 5 }), NOW);
    const pricey = cullScore(item({ lastUsedAt: daysAgo(14), purchasePrice: 1000 }), NOW);
    expect(stale).toBeGreaterThan(pricey);
  });

  it('cost per use breaks near-ties in staleness', () => {
    const cheap = cullScore(item({ lastUsedAt: daysAgo(180), purchasePrice: 10 }), NOW);
    const pricey = cullScore(item({ lastUsedAt: daysAgo(180), purchasePrice: 500 }), NOW);
    expect(pricey).toBeGreaterThan(cheap);
  });
});

describe('sortByCullScore', () => {
  it('sorts highest score first without mutating input', () => {
    const items = [
      item({ id: 'a', name: 'Recent', lastUsedAt: daysAgo(2) }),
      item({ id: 'b', name: 'Ancient', lastUsedAt: daysAgo(900) }),
      item({ id: 'c', name: 'Middling', lastUsedAt: daysAgo(200) }),
    ];
    const copy = [...items];
    expect(sortByCullScore(items, NOW).map((i) => i.id)).toEqual(['b', 'c', 'a']);
    expect(items).toEqual(copy);
  });

  it('ties: equal scores fall back to staler first', () => {
    // Both beyond the cap -> identical score, but one was used longer ago.
    const items = [
      item({ id: 'a', name: 'A', lastUsedAt: daysAgo(STALE_CAP_DAYS + 10) }),
      item({ id: 'b', name: 'B', lastUsedAt: daysAgo(STALE_CAP_DAYS + 500) }),
    ];
    expect(cullScore(items[0], NOW)).toBe(cullScore(items[1], NOW));
    expect(sortByCullScore(items, NOW).map((i) => i.id)).toEqual(['b', 'a']);
  });

  it('ties: identical score and date fall back to name, then id', () => {
    const t = daysAgo(100);
    const items = [
      item({ id: '2', name: 'Zither', lastUsedAt: t }),
      item({ id: '3', name: 'Apron', lastUsedAt: t }),
      item({ id: '1', name: 'Apron', lastUsedAt: t }),
    ];
    expect(sortByCullScore(items, NOW).map((i) => i.id)).toEqual(['1', '3', '2']);
  });
});
