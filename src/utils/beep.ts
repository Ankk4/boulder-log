type BeepKind = 'start' | 'end' | 'tick';

let sharedContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;

  if (!sharedContext || sharedContext.state === 'closed') {
    sharedContext = new AudioCtx();
  }
  return sharedContext;
}

async function ensureResumed(ctx: AudioContext): Promise<void> {
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  startAt: number,
  durationMs: number
): void {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;

  const durationSec = durationMs / 1000;
  const attack = 0.008;
  const release = 0.04;
  const peak = 0.18;

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(peak, startAt + attack);
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    startAt + Math.max(attack + 0.01, durationSec - release)
  );

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + durationSec + 0.02);
}

function vibrate(pattern: number | number[]): void {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(pattern);
  }
}

/**
 * Play a distinct start (high), end (low double), or prepare tick (mid) beep.
 * When muted, only vibrates if the device supports it.
 */
export async function playBeep(kind: BeepKind, muted = false): Promise<void> {
  if (muted) {
    if (kind === 'start') vibrate(40);
    else if (kind === 'tick') vibrate(25);
    else vibrate([30, 40, 30]);
    return;
  }

  const ctx = getAudioContext();
  if (!ctx) {
    if (kind === 'start') vibrate(40);
    else if (kind === 'tick') vibrate(25);
    else vibrate([30, 40, 30]);
    return;
  }

  await ensureResumed(ctx);
  const now = ctx.currentTime;

  if (kind === 'start') {
    playTone(ctx, 880, now, 120);
    vibrate(40);
  } else if (kind === 'tick') {
    playTone(ctx, 660, now, 80);
    vibrate(25);
  } else {
    playTone(ctx, 440, now, 100);
    playTone(ctx, 440, now + 0.16, 100);
    vibrate([30, 40, 30]);
  }
}

/** Unlock audio on a user gesture so later beeps are not blocked. */
export async function unlockAudio(): Promise<void> {
  const ctx = getAudioContext();
  if (ctx) {
    await ensureResumed(ctx);
  }
}
