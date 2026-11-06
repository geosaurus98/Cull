import { DAY_MS } from './types';

/** "today", "yesterday", "5 days ago", "3 weeks ago", "4 months ago", "2 years ago". */
export function timeAgo(timestamp: number, now: number = Date.now()): string {
  const days = Math.floor(Math.max(0, now - timestamp) / DAY_MS);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  if (days < 365) return `${Math.round(days / 30.44)} months ago`;
  const years = Math.floor(days / 365);
  return years === 1 ? 'a year ago' : `${years} years ago`;
}

export function formatMoney(amount: number, currency: string): string {
  const digits = Number.isInteger(amount) ? 0 : 2;
  const n = amount.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return `${currency}${n}`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** yyyy-mm-dd in local time, for <input type="date">. */
export function toDateInput(timestamp: number): string {
  const d = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromDateInput(value: string): number | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return undefined;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime();
}
