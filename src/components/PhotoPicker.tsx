import { useRef, useState } from 'react';
import { resizeImage } from '../lib/image';
import { usePhotoUrl } from './Thumb';

export function PhotoPicker({ value, onChange }: { value?: Blob; onChange: (b?: Blob) => void }) {
  const camera = useRef<HTMLInputElement>(null);
  const library = useRef<HTMLInputElement>(null);
  const url = usePhotoUrl(value);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError(undefined);
    try {
      onChange(await resizeImage(file));
    } catch {
      setError("Couldn't read that image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {url ? (
        <div className="relative">
          <img src={url} alt="Item" className="h-20 w-20 rounded-xl object-cover" />
          <button
            type="button"
            aria-label="Remove photo"
            onClick={() => onChange(undefined)}
            className="absolute -right-2 -top-2 h-7 w-7 rounded-full bg-slate-900 text-sm font-bold text-white dark:bg-slate-100 dark:text-slate-900"
          >
            ×
          </button>
        </div>
      ) : null}
      <button type="button" className="btn-ghost flex-1" disabled={busy} onClick={() => camera.current?.click()}>
        📷 {busy ? 'Processing…' : url ? 'Retake' : 'Camera'}
      </button>
      <button type="button" className="btn-ghost flex-1" disabled={busy} onClick={() => library.current?.click()}>
        🖼️ Library
      </button>
      <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={onFile} />
      <input ref={library} type="file" accept="image/*" hidden onChange={onFile} />
      {error && <p className="text-sm text-rose-600">{error}</p>}
    </div>
  );
}
