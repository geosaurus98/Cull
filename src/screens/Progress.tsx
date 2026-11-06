import { useMemo } from 'react';
import { useSettings } from '../lib/db';
import { formatMoney } from '../lib/format';
import { STATUSES, type Item, type Status } from '../lib/types';
import { STATUS_LABEL } from '../components/StatusBadge';

const BAR: Record<Status, string> = {
  undecided: 'bg-slate-300 dark:bg-slate-700',
  keep: 'bg-emerald-500',
  maybe: 'bg-amber-400',
  out: 'bg-rose-500',
};

type Counts = Record<Status, number>;
const zero = (): Counts => ({ undecided: 0, keep: 0, maybe: 0, out: 0 });

export function Progress({ items }: { items: Item[] }) {
  const { currency } = useSettings();

  const { totals, byRoom, outValue, outPriced } = useMemo(() => {
    const totals = zero();
    const rooms = new Map<string, Counts>();
    let outValue = 0;
    let outPriced = 0;
    for (const i of items) {
      totals[i.status]++;
      const key = i.room.trim() || 'No room';
      if (!rooms.has(key)) rooms.set(key, zero());
      rooms.get(key)![i.status]++;
      if (i.status === 'out' && i.purchasePrice !== undefined) {
        outValue += i.purchasePrice;
        outPriced++;
      }
    }
    const byRoom = [...rooms.entries()].sort(
      (a, b) => b[1].undecided - a[1].undecided || a[0].localeCompare(b[0]),
    );
    return { totals, byRoom, outValue, outPriced };
  }, [items]);

  const total = items.length;
  const decided = total - totals.undecided;
  const pct = total ? Math.round((decided / total) * 100) : 0;

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Progress</h1>
        <a href="#/settings" className="btn-ghost px-3 py-2 text-sm">⚙︎ Settings</a>
      </header>

      <section className="card p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-3xl font-bold tabular-nums">{totals.undecided}</span>
          <span className="text-sm text-slate-500">{pct}% decided</span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">undecided of {total} items</p>
        <StackedBar counts={totals} total={total} className="mt-3 h-4" />
      </section>

      <section className="grid grid-cols-2 gap-3">
        {STATUSES.map((s) => (
          <div key={s} className="card p-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className={`h-2.5 w-2.5 rounded-full ${BAR[s]}`} /> {STATUS_LABEL[s]}
            </div>
            <div className="text-2xl font-bold tabular-nums">{totals[s]}</div>
          </div>
        ))}
      </section>

      <section className="card p-4">
        <h2 className="text-sm text-slate-500">Purchase value of items marked Out</h2>
        <div className="text-3xl font-bold tabular-nums">{formatMoney(outValue, currency)}</div>
        {totals.out > 0 && (
          <p className="mt-1 text-xs text-slate-500">
            {outPriced} of {totals.out} out items have a price recorded.
          </p>
        )}
      </section>

      {byRoom.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold">By room</h2>
          <ul className="card divide-y divide-slate-100 dark:divide-slate-800">
            {byRoom.map(([room, c]) => {
              const n = c.undecided + c.keep + c.maybe + c.out;
              return (
                <li key={room} className="p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-medium">{room}</span>
                    <span className="shrink-0 text-xs tabular-nums text-slate-500">
                      {c.undecided} left · {c.keep} keep · {c.maybe} maybe · {c.out} out
                    </span>
                  </div>
                  <StackedBar counts={c} total={n} className="mt-2 h-2" />
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function StackedBar({ counts, total, className }: { counts: Counts; total: number; className: string }) {
  const order: Status[] = ['out', 'maybe', 'keep', 'undecided'];
  return (
    <div className={`flex w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 ${className}`}>
      {total > 0 &&
        order.map((s) =>
          counts[s] ? (
            <div key={s} className={BAR[s]} style={{ width: `${(counts[s] / total) * 100}%` }} title={`${STATUS_LABEL[s]}: ${counts[s]}`} />
          ) : null,
        )}
    </div>
  );
}
