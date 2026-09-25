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
  durationMs: number,
  peak = 0.75,
  type: OscillatorType = 'square'
): void {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;

  const durationSec = durationMs / 1000;
  const attack = 0.005;
  const release = 0.05;

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(peak, startAt + attack);
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    startAt + Math.max(attack + 0.02, durationSec - release)
  );

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + durationSec + 0.02);
}

/** Layer two oscillators so the cue cuts through phone speakers. */
function playChord(
  ctx: AudioContext,
  frequencies: number[],
  startAt: number,
  durationMs: number,
  peak = 0.7
): void {
  const perOsc = peak / Math.max(1, frequencies.length);
  for (const frequency of frequencies) {
    playTone(ctx, frequency, startAt, durationMs, perOsc, 'square');
  }
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
    if (kind === 'start') vibrate(80);
    else if (kind === 'tick') vibrate(40);
    else vibrate([50, 50, 50]);
    return;
  }

  const ctx = getAudioContext();
  if (!ctx) {
    if (kind === 'start') vibrate(80);
    else if (kind === 'tick') vibrate(40);
    else vibrate([50, 50, 50]);
    return;
  }

  await ensureResumed(ctx);
  const now = ctx.currentTime;

  if (kind === 'start') {
    // Sharp rising cue for work start
    playChord(ctx, [880, 1320], now, 180, 0.85);
    playChord(ctx, [988, 1480], now + 0.12, 160, 0.7);
    vibrate(80);
  } else if (kind === 'tick') {
    // Prepare countdown only (never used during rest)
    playTone(ctx, 740, now, 100, 0.65, 'square');
    vibrate(40);
  } else {
    // Lower double pulse for work→rest / set complete
    playChord(ctx, [392, 494], now, 160, 0.8);
    playChord(ctx, [349, 440], now + 0.2, 180, 0.75);
    vibrate([50, 50, 50]);
  }
}

/** Unlock audio on a user gesture so later beeps are not blocked. */
export async function unlockAudio(): Promise<void> {
  const ctx = getAudioContext();
  if (ctx) {
    await ensureResumed(ctx);
  }
}
