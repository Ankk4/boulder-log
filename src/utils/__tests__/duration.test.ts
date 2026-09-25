import { calculateTotalSeconds, formatCountdown, formatDuration } from '../duration';

describe('duration utils', () => {
  test('calculateTotalSeconds excludes rest after last interval', () => {
    expect(calculateTotalSeconds(5, 5, 6)).toBe(55);
    expect(calculateTotalSeconds(10, 0, 3)).toBe(30);
    expect(calculateTotalSeconds(7, 3, 1)).toBe(7);
    expect(calculateTotalSeconds(5, 5, 0)).toBe(0);
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
