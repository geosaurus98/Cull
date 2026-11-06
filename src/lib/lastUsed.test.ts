import { describe, expect, it } from 'vitest';
import { LAST_USED_OPTIONS, lastUsedFromOption } from './lastUsed';
import { DAY_MS } from './types';

const NOW = new Date('2026-06-01T12:00:00Z').getTime();

describe('lastUsedFromOption', () => {
  it('maps Today to now', () => {
    expect(lastUsedFromOption('today', NOW)).toBe(NOW);
  });
  it('maps each option further into the past than the previous one', () => {
    const dates = LAST_USED_OPTIONS.map((o) => lastUsedFromOption(o.value, NOW));
    for (let i = 1; i < dates.length; i++) expect(dates[i]).toBeLessThan(dates[i - 1]);
  });
  it('maps "A year ago" to ~365 days back', () => {
    expect((NOW - lastUsedFromOption('year', NOW)) / DAY_MS).toBe(365);
  });
  it('treats "Can\'t remember" as older than 2+ years', () => {
    expect(lastUsedFromOption('unknown', NOW)).toBeLessThan(lastUsedFromOption('2years', NOW));
  });
});
