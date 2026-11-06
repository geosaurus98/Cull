import { useMemo } from 'react';
import { ItemMeta } from '../components/ItemMeta';
import { SwipeCard } from '../components/SwipeCard';
import { Thumb } from '../components/Thumb';
import { useToast } from '../components/Toast';
import { decide, restoreDecision } from '../lib/actions';
import { useSettings } from '../lib/db';
import { cullScore, sortByCullScore } from '../lib/score';
import type { Item, Status } from '../lib/types';

const VERB: Record<Exclude<Status, 'undecided'>, string> = { keep: 'Kept', maybe: 'Maybe box', out: 'Out' };

export function Candidates({ items }: { items: Item[] }) {
  const { currency } = useSettings();
  const toast = useToast();
  const now = useMemo(() => Date.now(), [items]);
  const candidates = useMemo(
    () => sortByCullScore(items.filter((i) => i.status === 'undecided'), now),
    [items, now],
  );
  const decided = items.length - candidates.length;

  async function choose(item: Item, status: Exclude<Status, 'undecided'>) {
    const before = await decide(item.id, status);
    if (before) toast(`${VERB[status]}: ${item.name}`, () => restoreDecision(before));
  }

  if (items.length === 0) {
    return (
      <Empty title="Nothing to cull yet" body="Add a few things you suspect you don't need. Name is all it takes." />
    );
  }
  if (candidates.length === 0) {
    return <Empty title="All decided 🎉" body={`You've made a call on all ${items.length} items. Add more, or check the Maybe box.`} />;
  }

  return (
    <div>
      <header className="mb-3 flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">Cull</h1>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {candidates.length} to go · {decided} decided
        </span>
      </header>
      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">Swipe right to keep, left to throw out.</p>
      <ul className="space-y-3">
        {candidates.map((item, idx) => (
          <li key={item.id}>
            <SwipeCard onRight={() => choose(item, 'keep')} onLeft={() => choose(item, 'out')} rightLabel="Keep" leftLabel="Out">
              <article className="card p-3">
                <div className="flex gap-3">
                  <Thumb photo={item.photo} name={item.name} className={idx === 0 ? 'h-24 w-24' : 'h-16 w-16'} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="truncate text-lg font-semibold">{item.name}</h2>
                      <span
                        className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        title="Cull score (0–100, higher = more likely to go)"
                      >
                        {Math.round(cullScore(item, now))}
                      </span>
                    </div>
                    <ItemMeta item={item} currency={currency} now={now} />
                    {item.notes && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{item.notes}</p>}
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button className="btn-keep py-3.5" onClick={() => choose(item, 'keep')}>Keep</button>
                  <button className="btn-maybe py-3.5" onClick={() => choose(item, 'maybe')}>Maybe</button>
                  <button className="btn-out py-3.5" onClick={() => choose(item, 'out')}>Out</button>
                </div>
              </article>
            </SwipeCard>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-20 text-center">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">{body}</p>
      <a href="#/add" className="btn-primary mt-6">Add items</a>
    </div>
  );
}
