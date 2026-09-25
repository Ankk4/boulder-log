/** Seconds of 3-2-1 prepare countdown before the first work interval. */
export const PREPARE_SECONDS = 3;

export type TotalDurationOptions = {
  /** Include one-time prepare countdown (default true). */
  includePrepare?: boolean;
};

/** Total set length: work for each interval + rest between (no rest after last). */
export function calculateTotalSeconds(
  workSeconds: number,
  restSeconds: number,
  intervals: number,
  options: TotalDurationOptions = {}
): number {
  const { includePrepare = true } = options;
  if (intervals <= 0) return 0;
  const setSeconds =
    intervals * workSeconds + Math.max(0, intervals - 1) * restSeconds;
  return setSeconds + (includePrepare ? PREPARE_SECONDS : 0);
}

/** Format seconds as "Xm Ys" or "Ys" when under a minute. */
export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  if (minutes === 0) {
    return `${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
}

/** Format countdown as M:SS. */
export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.ceil(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
