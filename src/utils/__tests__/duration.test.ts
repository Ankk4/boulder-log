import {
  calculateTotalSeconds,
  formatCountdown,
  formatDuration,
  PREPARE_SECONDS,
} from '../duration';
import { WORKOUT_PRESETS } from '../workoutPresets';

describe('duration utils', () => {
  test('calculateTotalSeconds excludes rest after last interval and includes prepare by default', () => {
    expect(calculateTotalSeconds(5, 5, 6)).toBe(55 + PREPARE_SECONDS);
    expect(calculateTotalSeconds(10, 0, 3)).toBe(30 + PREPARE_SECONDS);
    expect(calculateTotalSeconds(7, 3, 1)).toBe(7 + PREPARE_SECONDS);
    expect(calculateTotalSeconds(5, 5, 0)).toBe(0);
  });

  test('calculateTotalSeconds can omit prepare', () => {
    expect(calculateTotalSeconds(5, 5, 6, { includePrepare: false })).toBe(55);
    expect(calculateTotalSeconds(7, 3, 1, { includePrepare: false })).toBe(7);
  });

  test('PREPARE_SECONDS is 3', () => {
    expect(PREPARE_SECONDS).toBe(3);
  });

  test('formatDuration', () => {
    expect(formatDuration(55)).toBe('55s');
    expect(formatDuration(60)).toBe('1m 0s');
    expect(formatDuration(125)).toBe('2m 5s');
  });

  test('formatCountdown', () => {
    expect(formatCountdown(5)).toBe('0:05');
    expect(formatCountdown(65.2)).toBe('1:06');
    expect(formatCountdown(0)).toBe('0:00');
  });
});

describe('workout presets', () => {
  test('includes expected hangboard and interval presets', () => {
    expect(WORKOUT_PRESETS.map((p) => p.id)).toEqual([
      '7-3-repeaters',
      '10s-max-hangs',
      '5s-holds',
      '20-10-intervals',
    ]);
    for (const preset of WORKOUT_PRESETS) {
      expect(preset.workSeconds).toBeGreaterThan(0);
      expect(preset.restSeconds).toBeGreaterThanOrEqual(0);
      expect(preset.intervals).toBeGreaterThan(0);
      expect(preset.name.length).toBeGreaterThan(0);
    }
  });
});
