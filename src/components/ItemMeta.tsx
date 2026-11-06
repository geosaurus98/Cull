import { timeAgo, formatMoney } from '../lib/format';
import { costPerUse } from '../lib/score';
import type { Item } from '../lib/types';

/** "Kitchen · last used 3 months ago · $40/use" */
export function ItemMeta({ item, currency, now = Date.now() }: { item: Item; currency: string; now?: number }) {
  const cpu = costPerUse(item);
  const uses = item.useLog.length;
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-sm text-slate-600 dark:text-slate-400">
      {item.room && <span className="font-medium text-slate-700 dark:text-slate-300">{item.room}</span>}
      <span>{item.lastUsedUnknown ? "can't remember last use" : `used ${timeAgo(item.lastUsedAt, now)}`}</span>
      {cpu !== undefined && (
        <span title={`${formatMoney(item.purchasePrice!, currency)} over ${uses} recorded use${uses === 1 ? '' : 's'}`}>
          {formatMoney(Math.round(cpu * 100) / 100, currency)}/use
        </span>
      )}
    </div>
  );
}
