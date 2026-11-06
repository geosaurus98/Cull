import { useRef, useState } from 'react';
import { PhotoPicker } from '../components/PhotoPicker';
import { RoomInput } from '../components/RoomInput';
import { useToast } from '../components/Toast';
import { addItem, deleteItem } from '../lib/actions';
import { useSettings } from '../lib/db';
import { LAST_USED_OPTIONS, lastUsedFromOption, type LastUsedOption } from '../lib/lastUsed';
import { parsePrice } from '../lib/parse';

export function AddItem() {
  const { currency } = useSettings();
  const toast = useToast();
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [price, setPrice] = useState('');
  const [lastUsed, setLastUsed] = useState<LastUsedOption>('unknown');
  const [photo, setPhoto] = useState<Blob>();
  const [notes, setNotes] = useState('');
  const [count, setCount] = useState(0);
  const [saving, setSaving] = useState(false);

  const parsed = parsePrice(price);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || parsed === 'invalid' || saving) return;
    setSaving(true);
    try {
      const item = await addItem({
        name,
        room,
        photo,
        purchasePrice: parsed,
        lastUsedAt: lastUsedFromOption(lastUsed),
        lastUsedUnknown: lastUsed === 'unknown',
        notes,
      });
      toast(`Added ${item.name}`, () => deleteItem(item.id));
      // Stay on the form, keep the room, reset the rest for the next item.
      setName('');
      setPrice('');
      setPhoto(undefined);
      setNotes('');
      setLastUsed('unknown');
      setCount((c) => c + 1);
      nameRef.current?.focus();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">Add item</h1>
        {count > 0 && <span className="text-sm text-slate-500">{count} added this session</span>}
      </header>

      <div>
        <label htmlFor="name" className="label">Name *</label>
        <input
          id="name"
          ref={nameRef}
          className="field"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          autoCapitalize="sentences"
          enterKeyHint="done"
          placeholder="e.g. Bread maker"
          required
        />
      </div>

      <div>
        <span className="label">Photo</span>
        <PhotoPicker value={photo} onChange={setPhoto} />
      </div>

      <div>
        <label htmlFor="room" className="label">Room</label>
        <RoomInput value={room} onChange={setRoom} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="lastUsed" className="label">Last used (roughly)</label>
          <select id="lastUsed" className="field" value={lastUsed} onChange={(e) => setLastUsed(e.target.value as LastUsedOption)}>
            {LAST_USED_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="price" className="label">Price paid ({currency})</label>
          <input
            id="price"
            className={`field ${parsed === 'invalid' ? 'border-rose-500' : ''}`}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
            placeholder="optional"
          />
        </div>
      </div>

      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-slate-600 dark:text-slate-400">Notes</summary>
        <textarea className="field mt-2" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </details>

      <button type="submit" className="btn-primary w-full py-4 text-lg" disabled={!name.trim() || parsed === 'invalid' || saving}>
        Save & add another
      </button>
      {count > 0 && (
        <a href="#/cull" className="btn-ghost w-full">Done — start culling</a>
      )}
    </form>
  );
}
