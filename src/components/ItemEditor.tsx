import { useEffect, useState } from 'react';
import { decide, deleteItem, updateItem } from '../lib/actions';
import { useSettings } from '../lib/db';
import { formatDate, formatMoney, fromDateInput, toDateInput } from '../lib/format';
import { parsePrice } from '../lib/parse';
import { costPerUse, cullScore } from '../lib/score';
import { STATUSES, type Item } from '../lib/types';
import { PhotoPicker } from './PhotoPicker';
import { RoomInput } from './RoomInput';
import { STATUS_LABEL } from './StatusBadge';
import { useToast } from './Toast';

/** Full-screen sheet for correcting an item's details. */
export function ItemEditor({ item, onClose }: { item: Item; onClose: () => void }) {
  const { currency } = useSettings();
  const toast = useToast();
  const [name, setName] = useState(item.name);
  const [room, setRoom] = useState(item.room);
  const [price, setPrice] = useState(item.purchasePrice?.toString() ?? '');
  const [lastUsed, setLastUsed] = useState(toDateInput(item.lastUsedAt));
  const [notes, setNotes] = useState(item.notes ?? '');
  const [photo, setPhoto] = useState<Blob | undefined>(item.photo);
  const parsed = parsePrice(price);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || parsed === 'invalid') return;
    const lastUsedAt = fromDateInput(lastUsed);
    const changedDate = lastUsedAt !== undefined && lastUsed !== toDateInput(item.lastUsedAt);
    await updateItem(item.id, {
      name: name.trim(),
      room: room.trim(),
      purchasePrice: parsed,
      notes: notes.trim() || undefined,
      photo,
      ...(changedDate ? { lastUsedAt, lastUsedUnknown: undefined } : {}),
    });
    toast('Saved');
    onClose();
  }

  const cpu = costPerUse(item);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-50 dark:bg-slate-950" role="dialog" aria-modal="true">
      <form onSubmit={save} className="mx-auto max-w-xl space-y-4 p-4 pb-12 pt-[max(1rem,env(safe-area-inset-top))]">
        <header className="flex items-center justify-between">
          <button type="button" className="btn-ghost px-3 py-2" onClick={onClose}>← Back</button>
          <button type="submit" className="btn-primary px-5 py-2" disabled={!name.trim() || parsed === 'invalid'}>Save</button>
        </header>

        <div>
          <label className="label" htmlFor="e-name">Name</label>
          <input id="e-name" className="field" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <span className="label">Photo</span>
          <PhotoPicker value={photo} onChange={setPhoto} />
        </div>
        <div>
          <label className="label" htmlFor="e-room">Room</label>
          <RoomInput id="e-room" value={room} onChange={setRoom} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="e-price">Price paid ({currency})</label>
            <input id="e-price" className="field" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="e-last">Last used</label>
            <input id="e-last" type="date" className="field" value={lastUsed} max={toDateInput(Date.now())} onChange={(e) => setLastUsed(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="e-notes">Notes</label>
          <textarea id="e-notes" className="field" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div>
          <span className="label">Status</span>
          <div className="grid grid-cols-4 gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                className={item.status === s ? 'chip-on py-2' : 'chip-off py-2'}
                onClick={() => decide(item.id, s)}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        <dl className="card grid grid-cols-2 gap-2 p-3 text-sm">
          <dt className="text-slate-500">Cull score</dt>
          <dd className="text-right tabular-nums">{Math.round(cullScore(item))}</dd>
          <dt className="text-slate-500">Recorded uses</dt>
          <dd className="text-right tabular-nums">{item.useLog.length}</dd>
          {cpu !== undefined && (
            <>
              <dt className="text-slate-500">Cost per use</dt>
              <dd className="text-right tabular-nums">{formatMoney(Math.round(cpu * 100) / 100, currency)}</dd>
            </>
          )}
          <dt className="text-slate-500">Added</dt>
          <dd className="text-right">{formatDate(item.createdAt)}</dd>
          {item.decidedAt && (
            <>
              <dt className="text-slate-500">Decided</dt>
              <dd className="text-right">{formatDate(item.decidedAt)}</dd>
            </>
          )}
        </dl>

        <button
          type="button"
          className="btn w-full text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
          onClick={async () => {
            if (!confirm(`Delete "${item.name}" permanently? (This is different from marking it Out.)`)) return;
            await deleteItem(item.id);
            toast('Deleted');
            onClose();
          }}
        >
          Delete item
        </button>
      </form>
    </div>
  );
}
