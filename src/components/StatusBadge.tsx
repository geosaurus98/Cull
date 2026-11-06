import type { Status } from '../lib/types';

const STYLES: Record<Status, string> = {
  undecided: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  keep: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  maybe: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  out: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300',
};

export const STATUS_LABEL: Record<Status, string> = {
  undecided: 'Undecided',
  keep: 'Keep',
  maybe: 'Maybe',
  out: 'Out',
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STYLES[status]}`}>{STATUS_LABEL[status]}</span>
  );
}
