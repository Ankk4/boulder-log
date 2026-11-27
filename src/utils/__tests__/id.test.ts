import { webcrypto } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { newId } from '../id';

describe('newId', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses randomUUID when available', () => {
    const randomUUID = vi.fn(() => 'fixed-id');
    vi.stubGlobal('crypto', {
      randomUUID,
      getRandomValues: webcrypto.getRandomValues.bind(webcrypto),
    });
    expect(newId()).toBe('fixed-id');
    expect(randomUUID).toHaveBeenCalledTimes(1);
  });

  it('falls back without randomUUID', () => {
    vi.stubGlobal('crypto', {
      getRandomValues: webcrypto.getRandomValues.bind(webcrypto),
    });
    const a = newId();
    const b = newId();
    const re = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    expect(a).toMatch(re);
    expect(b).toMatch(re);
    expect(a).not.toBe(b);
  });
});
