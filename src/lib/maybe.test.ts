import { describe, expect, it } from 'vitest';
import { isReviewDue, suggestedReviewAction } from './maybe';
import { DAY_MS, type Item } from './types';

const NOW = new Date('2026-06-01T12:00:00Z').getTime();
const base: Item = {
  id: '1', name: 'Lamp', room: '', createdAt: NOW - 60 * DAY_MS, lastUsedAt: NOW - 90 * DAY_MS,
  useLog: [], status: 'maybe', decidedAt: NOW - 31 * DAY_MS, reviewAt: NOW - DAY_MS,
};

describe('maybe review', () => {
  it('is due once reviewAt has passed', () => {
    expect(isReviewDue(base, NOW)).toBe(true);
    expect(isReviewDue({ ...base, reviewAt: NOW + DAY_MS }, NOW)).toBe(false);
    expect(isReviewDue({ ...base, status: 'keep' }, NOW)).toBe(false);
  });
  it('suggests Out unless used since being parked', () => {
    expect(suggestedReviewAction(base)).toBe('out');
    expect(suggestedReviewAction({ ...base, useLog: [NOW - 40 * DAY_MS] })).toBe('out');
    expect(suggestedReviewAction({ ...base, useLog: [NOW - 2 * DAY_MS] })).toBe('keep');
  });
});
