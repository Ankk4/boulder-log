import { describe, it, expect } from 'vitest';
import { colorRange } from '../grades';

describe('colorRange', () => {
  it('maps names to ranges', () => {
    expect(colorRange('Napakka')).toBe('6a+-6b+');
    expect(colorRange('Erittäin Vaikea')).toBe('7b+ and up');
    expect(colorRange('Unknown')).toBe('Unknown');
  });
});
