export type PersistResult = 'persisted' | 'denied' | 'unsupported';
export type StorageStatus = 'persistent' | 'best-effort' | 'unknown';

const LAST_BACKUP_KEY = 'matside.lastBackupAt';
const SNOOZE_KEY = 'matside.backupSnoozeUntil';

export async function requestPersistentStorage(): Promise<PersistResult> {
  try {
    const storage = navigator.storage as StorageManager | undefined;
    if (
      !storage ||
      typeof storage.persist !== 'function' ||
      typeof storage.persisted !== 'function'
    ) {
      return 'unsupported';
    }
    if (await storage.persisted()) return 'persisted';
    return (await storage.persist()) ? 'persisted' : 'denied';
  } catch {
    return 'unsupported';
  }
}

export async function getStorageStatus(): Promise<StorageStatus> {
  try {
    const storage = navigator.storage as StorageManager | undefined;
    if (!storage || typeof storage.persisted !== 'function') return 'unknown';
    return (await storage.persisted()) ? 'persistent' : 'best-effort';
  } catch {
    return 'unknown';
  }
}

function readPref(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writePref(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Preference is optional; ignore storage failures.
  }
}

export function getLastBackupAt(): string | null {
  return readPref(LAST_BACKUP_KEY);
}

export function setLastBackupAt(iso: string): void {
  writePref(LAST_BACKUP_KEY, iso);
}

export function getBackupSnoozeUntil(): string | null {
  return readPref(SNOOZE_KEY);
}

export function setBackupSnoozeUntil(iso: string): void {
  writePref(SNOOZE_KEY, iso);
}
