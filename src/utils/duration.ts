/** Total set length: work for each interval + rest between (no rest after last). */
export function calculateTotalSeconds(
  workSeconds: number,
  restSeconds: number,
  intervals: number
): number {
  if (intervals <= 0) return 0;
  return intervals * workSeconds + Math.max(0, intervals - 1) * restSeconds;
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
