import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { exportJsonBackup, exportProblemsCsv } from '../exportActions';
import { downloadFile } from '../download';
import type { db } from '../../db/index';

const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    sessions: { toArray: vi.fn<typeof db.sessions.toArray>() },
    problems: { toArray: vi.fn<typeof db.problems.toArray>() },
    attempts: { toArray: vi.fn<typeof db.attempts.toArray>() },
    intervalWorkouts: { toArray: vi.fn<typeof db.intervalWorkouts.toArray>() },
    intervalRuns: { toArray: vi.fn<typeof db.intervalRuns.toArray>() },
  },
}));

vi.mock('../../db/index', () => ({ db: mockDb }));
vi.mock('../download', () => ({ downloadFile: vi.fn<typeof downloadFile>() }));

function firstDownload(): [string, string, string] {
  const call = vi.mocked(downloadFile).mock.calls[0];
  if (!call) throw new Error('no download');
  return call;
}

describe('exportActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockDb.sessions.toArray.mockResolvedValue([]);
    mockDb.problems.toArray.mockResolvedValue([]);
    mockDb.attempts.toArray.mockResolvedValue([]);
    mockDb.intervalWorkouts.toArray.mockResolvedValue([]);
    mockDb.intervalRuns.toArray.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('JSON export downloads all tables', async () => {
    mockDb.sessions.toArray.mockResolvedValue([
      { id: 's1', startTime: '2024-01-01T10:00:00.000Z', endTime: null },
    ] as Awaited<ReturnType<typeof db.sessions.toArray>>);

    expect(await exportJsonBackup()).toBe(true);

    expect(downloadFile).toHaveBeenCalledTimes(1);
    const [name, mime, text] = firstDownload();
    expect(name).toMatch(/^matside-backup-\d{4}-\d{2}-\d{2}\.json$/);
    expect(mime).toBe('application/json');
    const parsed = JSON.parse(text) as Record<string, unknown>;
    expect(parsed.format).toBe('matside-backup');
    expect(parsed.version).toBe(1);
    expect(parsed.sessions).toHaveLength(1);
    for (const key of ['problems', 'attempts', 'intervalWorkouts', 'intervalRuns']) {
      expect(parsed[key]).toEqual([]);
    }
  });

  it('CSV export downloads the problems file', async () => {
    expect(await exportProblemsCsv()).toBe(true);
    const [name, mime, text] = firstDownload();
    expect(name).toMatch(/^matside-problems-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(mime).toBe('text/csv');
    expect(text).toContain('"session_start","session_end","problem"');
  });

  it('records the backup time', async () => {
    expect(await exportJsonBackup()).toBe(true);
    expect(localStorage.getItem('matside.lastBackupAt')).not.toBeNull();
    localStorage.clear();
    expect(await exportProblemsCsv()).toBe(true);
    expect(localStorage.getItem('matside.lastBackupAt')).not.toBeNull();
  });

  it('survives a localStorage error', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(await exportJsonBackup()).toBe(true);
    expect(await exportProblemsCsv()).toBe(true);
  });

  it('failed export does not record a backup', async () => {
    mockDb.problems.toArray.mockRejectedValue(new Error('read failed'));
    expect(await exportJsonBackup()).toBe(false);
    expect(await exportProblemsCsv()).toBe(false);
    expect(downloadFile).not.toHaveBeenCalled();
    expect(localStorage.getItem('matside.lastBackupAt')).toBeNull();
  });

  it('returns false when the download throws', async () => {
    vi.mocked(downloadFile).mockImplementationOnce(() => {
      throw new Error('blocked');
    });
    expect(await exportJsonBackup()).toBe(false);
    vi.mocked(downloadFile).mockImplementationOnce(() => {
      throw new Error('blocked');
    });
    expect(await exportProblemsCsv()).toBe(false);
    expect(localStorage.getItem('matside.lastBackupAt')).toBeNull();
  });
});
