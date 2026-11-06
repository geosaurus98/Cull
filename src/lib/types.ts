export type Status = 'undecided' | 'keep' | 'maybe' | 'out';

export const STATUSES: Status[] = ['undecided', 'keep', 'maybe', 'out'];

export interface Item {
  id: string;
  name: string;
  /** Free text; autocompleted from existing rooms. Empty string = no room. */
  room: string;
  /** Resized JPEG, max ~800px on the long edge. */
  photo?: Blob;
  purchasePrice?: number;
  createdAt: number;
  /** Epoch ms. Approximate when it came from the "last used (roughly)" dropdown. */
  lastUsedAt: number;
  /** True when the user picked "Can't remember"; cleared on the first "Used it" tap. */
  lastUsedUnknown?: boolean;
  /** Epoch ms, one per "Used it" tap. */
  useLog: number[];
  status: Status;
  decidedAt?: number;
  /** For "maybe" items: when to re-decide (epoch ms). */
  reviewAt?: number;
  notes?: string;
}

export interface Settings {
  currency: string;
  /** Default number of days a "maybe" sits before it is due for review. */
  maybeReviewDays: number;
}

export const DEFAULT_SETTINGS: Settings = {
  currency: '$',
  maybeReviewDays: 30,
};

export const DAY_MS = 24 * 60 * 60 * 1000;
