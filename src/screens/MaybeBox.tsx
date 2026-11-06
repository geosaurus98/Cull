import { useMemo, useState } from 'react';
import { ItemMeta } from '../components/ItemMeta';
import { Thumb } from '../components/Thumb';
import { useToast } from '../components/Toast';
import { UsedButton } from '../components/UsedButton';
import { decide, restoreDecision, updateItem, type DecisionSnapshot } from '../lib/actions';
import { setSetting, useSettings } from '../lib/db';
import { formatDate, fromDateInput, timeAgo, toDateInput } from '../lib/format';
import { isReviewDue, suggestedReviewAction, usedSinceDecided } from '../lib/maybe';
import type { Item } from '../lib/types';

export function MaybeBox({ items }: { items: Item[] }) {
  const { currency, maybeReviewDays } = useSettings();
  const toast = useToast();
  const now = useMemo(() => Date.now(), [items]);
  const maybes = useMemo(
    () => items.filter((i) => i.status === 'maybe').sort((a, b) => (a.reviewAt ?? 0) - (b.reviewAt ?? 0)),
    [items],
  );
  const due = maybes.filter((i) => isReviewDue(i, now));
  const dueUnused = due.filter((i) => suggestedReviewAction(i) === 'out');

  async function choose(item: Item, status: 'keep' | 'out') {
    const before = await decide(item.id, status);
    if (before) toast(`${status === 'keep' ? 'Kept' : 'Out'}: ${item.name}`, () => restoreDecision(before));
  }

  async function outAllUnused() {
    const snaps: DecisionSnapshot[] = [];
    for (const i of dueUnused) {
      const s = await decide(i.id, 'out');
      if (s) snaps.push(s);
    }
    toast(`${snaps.length} unused ${snaps.length === 1 ? 'item' : 'items'} marked Out`, async () => {
      for (const s of snaps) await restoreDecision(s);
    });
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Maybe box</h1>
      <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
        Park it, live without it, then decide. If you haven&apos;t used it by the review date, it goes.
      </p>

      <ReviewDaysSetting days={maybeReviewDays} />

      {due.length > 0 && (
        <section className="mb-4 rounded-2xl bg-amber-100 p-4 text-amber-950 dark:bg-amber-900/40 dark:text-amber-100">
          <h2 className="font-bold">
            {due.length} {due.length === 1 ? 'item is' : 'items are'} due for a decision
          </h2>
          <p className="mt-1 text-sm">
            {dueUnused.length > 0
              ? `${dueUnused.length} ${dueUnused.length === 1 ? "hasn't" : "haven't"} been used since going in the box.`
              : 'Everything due has been used since — consider keeping it.'}
          </p>
          {dueUnused.length > 0 && (
            <button className="btn-out mt-3 w-full" onClick={outAllUnused}>
              Mark {dueUnused.length} unused as Out
            </button>
          )}
        </section>
      )}

      {maybes.length === 0 ? (
        <p className="py-12 text-center text-slate-500">The maybe box is empty.</p>
      ) : (
        <ul className="space-y-3">
          {maybes.map((item) => {
            const isDue = isReviewDue(item, now);
            const used = usedSinceDecided(item);
            const suggestion = suggestedReviewAction(item);
            return (
              <li key={item.id} className={`card p-3 ${isDue ? 'ring-2 ring-amber-400' : ''}`}>
                <div className="flex gap-3">
                  <Thumb photo={item.photo} name={item.name} />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-lg font-semibold">{item.name}</h2>
                    <ItemMeta item={item} currency={currency} now={now} />
                    <p className="mt-0.5 text-xs text-slate-500">
                      In the box since {item.decidedAt ? timeAgo(item.decidedAt, now) : '—'}
                      {used ? ' · used since ✓' : ' · not used since'}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <label htmlFor={`rv-${item.id}`} className={isDue ? 'font-semibold text-amber-700 dark:text-amber-300' : 'text-slate-500'}>
                    {isDue ? 'Review was due' : 'Review on'}
                  </label>
                  <input
                    id={`rv-${item.id}`}
                    type="date"
                    className="field w-auto px-2 py-1"
                    value={item.reviewAt ? toDateInput(item.reviewAt) : ''}
                    onChange={(e) => {
                      const t = fromDateInput(e.target.value);
                      if (t !== undefined) updateItem(item.id, { reviewAt: t });
                    }}
                  />
                  {isDue && item.reviewAt && <span className="text-xs text-slate-500">({formatDate(item.reviewAt)})</span>}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button
                    className={`btn-keep ${isDue && suggestion !== 'keep' ? 'opacity-60' : ''}`}
                    onClick={() => choose(item, 'keep')}
                  >
                    Keep
                  </button>
                  <UsedButton item={item} className="text-sm" />
                  <button
                    className={`btn-out ${isDue && suggestion === 'out' ? 'ring-4 ring-rose-300 dark:ring-rose-800' : ''}`}
                    onClick={() => choose(item, 'out')}
                  >
                    Out
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ReviewDaysSetting({ days }: { days: number }) {
  const [value, setValue] = useState(String(days));
  const [editing, setEditing] = useState(false);
  if (!editing) {
    return (
      <p className="mb-4 text-sm text-slate-500">
        New maybes are reviewed after <strong>{days} days</strong>.{' '}
        <button className="font-semibold text-teal-700 underline dark:text-teal-400" onClick={() => { setValue(String(days)); setEditing(true); }}>
          Change
        </button>
      </p>
    );
  }
  return (
    <form
      className="mb-4 flex items-center gap-2 text-sm"
      onSubmit={async (e) => {
        e.preventDefault();
        const n = Math.round(Number(value));
        if (n >= 1 && n <= 3650) await setSetting('maybeReviewDays', n);
        setEditing(false);
      }}
    >
      Review after
      <input className="field w-20 px-2 py-1" inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
      days
      <button className="btn-primary px-3 py-1.5" type="submit">Save</button>
    </form>
  );
}
