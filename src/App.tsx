import { useMemo } from 'react';
import { Nav } from './components/Nav';
import { ToastProvider } from './components/Toast';
import { useItems } from './lib/db';
import { isReviewDue } from './lib/maybe';
import { go, useRoute } from './router';
import { AddItem } from './screens/AddItem';
import { AllItems } from './screens/AllItems';
import { Candidates } from './screens/Candidates';
import { MaybeBox } from './screens/MaybeBox';
import { Progress } from './screens/Progress';
import { SettingsScreen } from './screens/Settings';

export default function App() {
  const route = useRoute();
  const items = useItems();
  const dueCount = useMemo(() => {
    const now = Date.now();
    return (items ?? []).filter((i) => isReviewDue(i, now)).length;
  }, [items]);

  return (
    <ToastProvider>
      <div className="mx-auto flex min-h-[100dvh] max-w-xl flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
        {dueCount > 0 && route !== 'maybe' && (
          <button
            onClick={() => go('maybe')}
            className="flex w-full items-center justify-between gap-2 bg-amber-400 px-4 py-2.5 pt-[calc(0.625rem+env(safe-area-inset-top))] text-left text-sm font-semibold text-slate-950"
          >
            <span>
              {dueCount} maybe {dueCount === 1 ? 'item is' : 'items are'} due for a decision
            </span>
            <span aria-hidden>Review →</span>
          </button>
        )}
        <main className="flex-1 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
          {items === undefined ? null : route === 'add' ? (
            <AddItem />
          ) : route === 'items' ? (
            <AllItems items={items} />
          ) : route === 'maybe' ? (
            <MaybeBox items={items} />
          ) : route === 'progress' ? (
            <Progress items={items} />
          ) : route === 'settings' ? (
            <SettingsScreen itemCount={items.length} />
          ) : (
            <Candidates items={items} />
          )}
        </main>
        <Nav route={route} maybeDue={dueCount} />
      </div>
    </ToastProvider>
  );
}
