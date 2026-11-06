import { DAY_MS, type Item } from './types';

export function defaultReviewAt(decidedAt: number, reviewDays: number): number {
  return decidedAt + reviewDays * DAY_MS;
}

/** A "maybe" item is due once its review date has passed. */
export function isReviewDue(item: Item, now: number = Date.now()): boolean {
  return item.status === 'maybe' && item.reviewAt !== undefined && item.reviewAt <= now;
}

/** Was the item used after it went into the maybe box? */
export function usedSinceDecided(item: Item): boolean {
  if (item.decidedAt === undefined) return false;
  return item.useLog.some((t) => t > item.decidedAt!);
}

/** Default action at review time: Out unless it has been used since it was parked. */
export function suggestedReviewAction(item: Item): 'out' | 'keep' {
  return usedSinceDecided(item) ? 'keep' : 'out';
}
