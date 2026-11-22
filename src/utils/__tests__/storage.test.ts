import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getBackupSnoozeUntil,
  getLastBackupAt,
  getStorageStatus,
  requestPersistentStorage,
  setBackupSnoozeUntil,
  setLastBackupAt,
} from '../storage';

function stubStorage(storage: unknown) {
  Object.defineProperty(navigator, 'storage', { value: storage, configurable: true });
}

afterEach(() => {
  Reflect.deleteProperty(navigator, 'storage');
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('requestPersistentStorage', () => {
  it('persists when not yet persisted', async () => {
    const persist = vi.fn<() => Promise<boolean>>().mockResolvedValue(true);
    stubStorage({ persisted: () => Promise.resolve(false), persist });
    expect(await requestPersistentStorage()).toBe('persisted');
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it('returns denied when the browser refuses', async () => {
    stubStorage({
      persisted: () => Promise.resolve(false),
      persist: () => Promise.resolve(false),
    });
    expect(await requestPersistentStorage()).toBe('denied');
  });

  it('skips persist when already persisted', async () => {
    const persist = vi.fn<() => Promise<boolean>>().mockResolvedValue(true);
    stubStorage({ persisted: () => Promise.resolve(true), persist });
    expect(await requestPersistentStorage()).toBe('persisted');
    expect(persist).not.toHaveBeenCalled();
  });

  it('unsupported when the API is missing', async () => {
    expect(await requestPersistentStorage()).toBe('unsupported');
  });

  it('unsupported when persist rejects', async () => {
    stubStorage({
      persisted: () => Promise.resolve(false),
      persist: () => Promise.reject(new Error('nope')),
    });
    expect(await requestPersistentStorage()).toBe('unsupported');
  });
});

describe('getStorageStatus', () => {
  it('is persistent when persisted', async () => {
    stubStorage({ persisted: () => Promise.resolve(true) });
    expect(await getStorageStatus()).toBe('persistent');
  });

  it('is best-effort when not persisted', async () => {
    stubStorage({ persisted: () => Promise.resolve(false) });
    expect(await getStorageStatus()).toBe('best-effort');
  });

  it('is unknown when the API is missing', async () => {
    expect(await getStorageStatus()).toBe('unknown');
  });

  it('is unknown when persisted rejects', async () => {
    stubStorage({ persisted: () => Promise.reject(new Error('nope')) });
    expect(await getStorageStatus()).toBe('unknown');
  });
});

describe('backup prefs', () => {
  it('round-trips lastBackupAt and backupSnoozeUntil', () => {
    expect(getLastBackupAt()).toBeNull();
    expect(getBackupSnoozeUntil()).toBeNull();
    setLastBackupAt('2026-01-02T03:04:05.000Z');
    setBackupSnoozeUntil('2026-01-09T03:04:05.000Z');
    expect(getLastBackupAt()).toBe('2026-01-02T03:04:05.000Z');
    expect(getBackupSnoozeUntil()).toBe('2026-01-09T03:04:05.000Z');
    expect(localStorage.getItem('matside.lastBackupAt')).toBe('2026-01-02T03:04:05.000Z');
    expect(localStorage.getItem('matside.backupSnoozeUntil')).toBe('2026-01-09T03:04:05.000Z');
  });

  it('backup prefs survive a localStorage error', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(getLastBackupAt()).toBeNull();
    expect(getBackupSnoozeUntil()).toBeNull();
    expect(() => {
      setLastBackupAt('x');
    }).not.toThrow();
    expect(() => {
      setBackupSnoozeUntil('x');
    }).not.toThrow();
  });
});
