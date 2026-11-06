import { markUsed, unmarkUsed } from '../lib/actions';
import type { Item } from '../lib/types';
import { useToast } from './Toast';

export function UsedButton({ item, className = '' }: { item: Item; className?: string }) {
  const toast = useToast();
  return (
    <button
      type="button"
      className={`btn bg-teal-100 text-teal-900 hover:bg-teal-200 dark:bg-teal-900/50 dark:text-teal-200 dark:hover:bg-teal-900 ${className}`}
      onClick={async () => {
        const prev = item.lastUsedAt;
        const prevUnknown = item.lastUsedUnknown;
        await markUsed(item.id);
        toast(`Used: ${item.name} (${item.useLog.length + 1}×)`, () => unmarkUsed(item.id, prev, prevUnknown));
      }}
    >
      ✓ Used it
    </button>
  );
}
