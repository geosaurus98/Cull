import { DAY_MS } from './types';

export type LastUsedOption =
  | 'today'
  | 'week'
  | 'month'
  | '3months'
  | '6months'
  | 'year'
  | '2years'
  | 'unknown';

export const LAST_USED_OPTIONS: { value: LastUsedOption; label: string; daysAgo: number }[] = [
  { value: 'today', label: 'Today', daysAgo: 0 },
  { value: 'week', label: 'This week', daysAgo: 3 },
  { value: 'month', label: 'This month', daysAgo: 14 },
  { value: '3months', label: '3 months ago', daysAgo: 91 },
  { value: '6months', label: '6 months ago', daysAgo: 182 },
  { value: 'year', label: 'A year ago', daysAgo: 365 },
  { value: '2years', label: '2+ years ago', daysAgo: 730 },
  // "Can't remember" almost always means "a long time ago", so it is treated
  // as staler than 2+ years; the item is flagged so the UI can say so honestly.
  { value: 'unknown', label: "Can't remember", daysAgo: 1095 },
];

/** Map a "last used (roughly)" choice to an approximate lastUsedAt timestamp. */
export function lastUsedFromOption(option: LastUsedOption, now: number = Date.now()): number {
  const opt = LAST_USED_OPTIONS.find((o) => o.value === option);
  if (!opt) throw new Error(`Unknown last-used option: ${option}`);
  return now - opt.daysAgo * DAY_MS;
}
