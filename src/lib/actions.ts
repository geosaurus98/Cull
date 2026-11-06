import { db, getSettings } from './db';
import { defaultReviewAt } from './maybe';
import type { Item, Status } from './types';

export function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface NewItem {
  name: string;
  room: string;
  photo?: Blob;
  purchasePrice?: number;
  lastUsedAt: number;
  lastUsedUnknown?: boolean;
  notes?: string;
}

export async function addItem(input: NewItem): Promise<Item> {
  const item: Item = {
    id: newId(),
    name: input.name.trim(),
    room: input.room.trim(),
    photo: input.photo,
    purchasePrice: input.purchasePrice,
    createdAt: Date.now(),
    lastUsedAt: input.lastUsedAt,
    lastUsedUnknown: input.lastUsedUnknown || undefined,
    useLog: [],
    status: 'undecided',
    notes: input.notes?.trim() || undefined,
  };
  await db.items.add(item);
  return item;
}

/** Snapshot of the decision-related fields, used for undo. */
export type DecisionSnapshot = Pick<Item, 'id' | 'status' | 'decidedAt' | 'reviewAt'>;

export async function decide(id: string, status: Status, now = Date.now()): Promise<DecisionSnapshot | undefined> {
  const item = await db.items.get(id);
  if (!item) return undefined;
  const before: DecisionSnapshot = { id, status: item.status, decidedAt: item.decidedAt, reviewAt: item.reviewAt };
  let reviewAt: number | undefined;
  if (status === 'maybe') {
    const { maybeReviewDays } = await getSettings();
    reviewAt = defaultReviewAt(now, maybeReviewDays);
  }
  await db.items.update(id, {
    status,
    decidedAt: status === 'undecided' ? undefined : now,
    reviewAt,
  });
  return before;
}

export async function restoreDecision(s: DecisionSnapshot) {
  await db.items.update(s.id, { status: s.status, decidedAt: s.decidedAt, reviewAt: s.reviewAt });
}

export async function markUsed(id: string, now = Date.now()) {
  await db.items
    .where('id')
    .equals(id)
    .modify((item) => {
      item.useLog = [...item.useLog, now];
      item.lastUsedAt = now;
      delete item.lastUsedUnknown;
    });
}

/** Remove the most recent "used" tap (undo). lastUsedAt falls back to the previous tap or the given value. */
export async function unmarkUsed(id: string, previousLastUsedAt: number, previousUnknown?: boolean) {
  await db.items
    .where('id')
    .equals(id)
    .modify((item) => {
      item.useLog = item.useLog.slice(0, -1);
      item.lastUsedAt = previousLastUsedAt;
      if (previousUnknown) item.lastUsedUnknown = true;
    });
}

export async function updateItem(id: string, changes: Partial<Item>) {
  await db.items.update(id, changes);
}

export async function deleteItem(id: string) {
  await db.items.delete(id);
}
