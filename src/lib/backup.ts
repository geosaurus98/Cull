import { db, getSettings } from './db';
import { DEFAULT_SETTINGS, STATUSES, type Item, type Settings } from './types';

export const BACKUP_FORMAT = 'cull-backup';
export const BACKUP_VERSION = 1;

type SerializedItem = Omit<Item, 'photo'> & { photo?: string };

export interface Backup {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  settings: Settings;
  items: SerializedItem[];
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const m = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(dataUrl);
  if (!m) throw new Error('Invalid photo data');
  const mime = m[1] || 'application/octet-stream';
  if (!m[2]) return new Blob([decodeURIComponent(m[3])], { type: mime });
  const bin = atob(m[3]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export async function exportBackup(): Promise<Backup> {
  const items = await db.items.toArray();
  const serialized: SerializedItem[] = [];
  for (const { photo, ...rest } of items) {
    serialized.push(photo ? { ...rest, photo: await blobToDataUrl(photo) } : rest);
  }
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    settings: await getSettings(),
    items: serialized,
  };
}

export async function downloadBackup() {
  const backup = await exportBackup();
  const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cull-backup-${backup.exportedAt.slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function validItem(x: unknown): x is SerializedItem {
  if (!x || typeof x !== 'object') return false;
  const i = x as Record<string, unknown>;
  return (
    typeof i.id === 'string' &&
    typeof i.name === 'string' &&
    typeof i.lastUsedAt === 'number' &&
    Array.isArray(i.useLog) &&
    STATUSES.includes(i.status as Item['status'])
  );
}

/** Replaces ALL current data with the backup's contents. Returns the number of items imported. */
export async function importBackup(json: string): Promise<number> {
  const data = JSON.parse(json) as Partial<Backup>;
  if (data.format !== BACKUP_FORMAT || !Array.isArray(data.items)) {
    throw new Error("That file doesn't look like a Cull backup.");
  }
  const bad = data.items.findIndex((i) => !validItem(i));
  if (bad !== -1) throw new Error(`Item #${bad + 1} in the backup is malformed.`);

  const items: Item[] = data.items.map(({ photo, ...rest }) => ({
    ...rest,
    room: typeof rest.room === 'string' ? rest.room : '',
    createdAt: typeof rest.createdAt === 'number' ? rest.createdAt : Date.now(),
    photo: photo ? dataUrlToBlob(photo) : undefined,
  }));
  const settings = { ...DEFAULT_SETTINGS, ...(data.settings ?? {}) };

  await db.transaction('rw', db.items, db.settings, async () => {
    await db.items.clear();
    await db.settings.clear();
    await db.items.bulkAdd(items);
    await db.settings.bulkPut(
      (Object.keys(settings) as (keyof Settings)[]).map((key) => ({ key, value: settings[key] })),
    );
  });
  return items.length;
}
