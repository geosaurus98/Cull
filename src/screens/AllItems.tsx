import { useMemo, useState } from 'react';
import { ItemEditor } from '../components/ItemEditor';
import { ItemMeta } from '../components/ItemMeta';
import { STATUS_LABEL, StatusBadge } from '../components/StatusBadge';
import { Thumb } from '../components/Thumb';
import { UsedButton } from '../components/UsedButton';
import { useRooms, useSettings } from '../lib/db';
import { STATUSES, type Item, type Status } from '../lib/types';

type Sort = 'name' | 'lastUsed' | 'added';

export function AllItems({ items }: { items: Item[] }) {
  const { currency } = useSettings();
  const rooms = useRooms();
  const [query, setQuery] = useState('');
  const [room, setRoom] = useState<string>('');
  const [status, setStatus] = useState<Status | ''>('');
  const [sort, setSort] = useState<Sort>('lastUsed');
  const [editingId, setEditingId] = useState<string>();

  const now = useMemo(() => Date.now(), [items]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = items.filter(
      (i) =>
        (!q || i.name.toLowerCase().includes(q)) &&
        (!room || (room === '\u0000' ? !i.room : i.room === room)) &&
        (!status || i.status === status),
    );
    const cmp: Record<Sort, (a: Item, b: Item) => number> = {
      name: (a, b) => a.name.localeCompare(b.name),
      lastUsed: (a, b) => b.lastUsedAt - a.lastUsedAt,
      added: (a, b) => b.createdAt - a.createdAt,
    };
    return list.sort(cmp[sort]);
  }, [items, query, room, status, sort]);

  const editing = editingId ? items.find((i) => i.id === editingId) : undefined;

  return (
    <div>
      <h1 className="mb-3 text-2xl font-bold">All items</h1>
      <div className="sticky top-0 z-10 -mx-4 space-y-2 bg-slate-50/95 px-4 pb-2 pt-1 backdrop-blur dark:bg-slate-950/95">
        <input
          type="search"
          className="field"
          placeholder={`Search ${items.length} items…`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-2">
          <select className="field py-2" value={room} onChange={(e) => setRoom(e.target.value)} aria-label="Room">
            <option value="">All rooms</option>
            {rooms.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
            <option value={'\u0000'}>No room</option>
          </select>
          <select className="field py-2" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort">
            <option value="lastUsed">Recently used</option>
            <option value="name">Name</option>
            <option value="added">Recently added</option>
          </select>
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1">
          <button className={status === '' ? 'chip-on' : 'chip-off'} onClick={() => setStatus('')}>All</button>
          {STATUSES.map((s) => (
            <button key={s} className={status === s ? 'chip-on' : 'chip-off'} onClick={() => setStatus(s)}>
              {STATUS_LABEL[s]} · {items.filter((i) => i.status === s).length}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-slate-500">No items match.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {filtered.map((item) => (
            <li key={item.id} className="card flex items-center gap-3 p-2.5">
              <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setEditingId(item.id)}>
                <Thumb photo={item.photo} name={item.name} className="h-14 w-14" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold">{item.name}</span>
                    <StatusBadge status={item.status} />
                  </div>
                  <ItemMeta item={item} currency={currency} now={now} />
                </div>
              </button>
              <UsedButton item={item} className="shrink-0 px-3 py-4 text-sm" />
            </li>
          ))}
        </ul>
      )}

      {editing && <ItemEditor key={editing.id} item={editing} onClose={() => setEditingId(undefined)} />}
    </div>
  );
}
