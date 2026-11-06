import { useRooms } from '../lib/db';

/** Free-text room with native autocomplete plus one-tap chips for the most common rooms. */
export function RoomInput({ value, onChange, id = 'room' }: { value: string; onChange: (v: string) => void; id?: string }) {
  const rooms = useRooms();
  const listId = `${id}-list`;
  const suggestions = rooms.filter((r) => r.toLowerCase() !== value.trim().toLowerCase()).slice(0, 8);
  return (
    <div>
      <input
        id={id}
        className="field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        list={listId}
        autoComplete="off"
        autoCapitalize="words"
        placeholder="e.g. Kitchen"
      />
      <datalist id={listId}>
        {rooms.map((r) => (
          <option key={r} value={r} />
        ))}
      </datalist>
      {suggestions.length > 0 && (
        <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1">
          {suggestions.map((r) => (
            <button key={r} type="button" className="chip-off" onClick={() => onChange(r)}>
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
