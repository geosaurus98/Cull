import { describe, expect, it } from 'vitest';
import { formatMoney, fromDateInput, timeAgo, toDateInput } from './format';
import { DAY_MS } from './types';

const NOW = new Date('2026-06-01T12:00:00Z').getTime();

describe('timeAgo', () => {
  it.each([
    [0, 'today'],
    [1, 'yesterday'],
    [5, '5 days ago'],
    [21, '3 weeks ago'],
    [91, '3 months ago'],
    [400, 'a year ago'],
    [800, '2 years ago'],
  ])('%i days -> %s', (d, expected) => {
    expect(timeAgo(NOW - d * DAY_MS, NOW)).toBe(expected);
  });
});

describe('formatMoney', () => {
  it('drops decimals for whole amounts and keeps two otherwise', () => {
    expect(formatMoney(120, '$')).toBe('$120');
    expect(formatMoney(12.5, '£')).toBe('£12.50');
  });
});

describe('date input round trip', () => {
  it('round-trips a local date', () => {
    const t = new Date(2026, 2, 9).getTime();
    expect(fromDateInput(toDateInput(t))).toBe(t);
    expect(fromDateInput('nope')).toBeUndefined();
  });
});
