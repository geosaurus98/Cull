import Dexie, { type EntityTable } from 'dexie';
import { useLiveQuery } from 'dexie-react-hooks';
import { DEFAULT_SETTINGS, type Item, type Settings } from './types';

interface SettingRow {
  key: keyof Settings;
  value: unknown;
}

export const db = new Dexie('cull') as Dexie & {
  items: EntityTable<Item, 'id'>;
  settings: EntityTable<SettingRow, 'key'>;
};

db.version(1).stores({
  items: 'id, status, room, lastUsedAt, createdAt, reviewAt',
  settings: 'key',
});

export async function getSettings(): Promise<Settings> {
  const rows = await db.settings.toArray();
  const out: Settings = { ...DEFAULT_SETTINGS };
  for (const r of rows) (out as unknown as Record<string, unknown>)[r.key] = r.value;
  return out;
}

export async function setSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
  await db.settings.put({ key, value });
}

export function useSettings(): Settings {
  return useLiveQuery(getSettings, [], DEFAULT_SETTINGS);
}

export function useItems(): Item[] | undefined {
  return useLiveQuery(() => db.items.toArray(), []);
}

/** Distinct, non-empty room names, most used first. */
export function useRooms(): string[] {
  return (
    useLiveQuery(async () => {
      const counts = new Map<string, number>();
      await db.items.each((i) => {
        const r = i.room.trim();
        if (r) counts.set(r, (counts.get(r) ?? 0) + 1);
      });
      return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([r]) => r);
    }, []) ?? []
  );
}
