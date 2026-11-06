import { useEffect, useRef, useState } from 'react';
import { useToast } from '../components/Toast';
import { downloadBackup, importBackup } from '../lib/backup';
import { db, setSetting, useSettings } from '../lib/db';

const COMMON = ['$', '£', '€', '¥', '₹', 'A$', 'NZ$', 'kr'];

export function SettingsScreen({ itemCount }: { itemCount: number }) {
  const settings = useSettings();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [currency, setCurrency] = useState(settings.currency);
  const [days, setDays] = useState(String(settings.maybeReviewDays));
  const [busy, setBusy] = useState(false);

  useEffect(() => setCurrency(settings.currency), [settings.currency]);
  useEffect(() => setDays(String(settings.maybeReviewDays)), [settings.maybeReviewDays]);

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!confirm(`Importing replaces all ${itemCount} current items and settings with the backup. Continue?`)) return;
    setBusy(true);
    try {
      const n = await importBackup(await file.text());
      toast(`Imported ${n} items`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Import failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <a href="#/progress" className="btn-ghost px-3 py-2">←</a>
        <h1 className="text-2xl font-bold">Settings</h1>
      </header>

      <section className="space-y-2">
        <label htmlFor="currency" className="label">Currency symbol</label>
        <input
          id="currency"
          className="field"
          value={currency}
          maxLength={4}
          onChange={(e) => setCurrency(e.target.value)}
          onBlur={() => setSetting('currency', currency.trim())}
        />
        <div className="flex flex-wrap gap-2">
          {COMMON.map((c) => (
            <button
              key={c}
              className={settings.currency === c ? 'chip-on' : 'chip-off'}
              onClick={() => {
                setCurrency(c);
                setSetting('currency', c);
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      <section>
        <label htmlFor="days" className="label">Review &quot;maybe&quot; items after (days)</label>
        <input
          id="days"
          className="field"
          inputMode="numeric"
          value={days}
          onChange={(e) => setDays(e.target.value)}
          onBlur={() => {
            const n = Math.round(Number(days));
            if (n >= 1 && n <= 3650) setSetting('maybeReviewDays', n);
            else setDays(String(settings.maybeReviewDays));
          }}
        />
        <p className="mt-1 text-xs text-slate-500">Applies to items moved to Maybe from now on.</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Backup</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Everything lives only on this device. Export regularly — the file includes photos.
        </p>
        <button className="btn-primary w-full" disabled={busy} onClick={() => downloadBackup().then(() => toast('Backup exported'))}>
          Export backup (.json)
        </button>
        <button className="btn-ghost w-full" disabled={busy} onClick={() => fileRef.current?.click()}>
          {busy ? 'Importing…' : 'Import backup…'}
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onImport} />
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-rose-600">Danger zone</h2>
        <button
          className="btn w-full border border-rose-300 text-rose-600 dark:border-rose-900"
          onClick={async () => {
            if (!confirm(`Delete all ${itemCount} items and settings from this device? This cannot be undone.`)) return;
            await db.transaction('rw', db.items, db.settings, async () => {
              await db.items.clear();
              await db.settings.clear();
            });
            toast('All data deleted');
          }}
        >
          Delete all data
        </button>
      </section>
    </div>
  );
}
