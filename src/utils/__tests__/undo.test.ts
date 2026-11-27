import { describe, it, expect } from 'vitest';
import { removeProblem, replaceProblem } from '../undo';
import type { SessionProblem } from '../../types';

const make = (id: string, name = id): SessionProblem => ({
  id,
  name,
  frenchGrade: '6a',
  colorGrade: 'blue',
  attempts: [],
  sessionId: 's1',
  createdAt: '2024-01-01T00:00:00.000Z',
});

describe('undo helpers', () => {
  it('replaces one problem in the session list', () => {
    const a = make('a');
    const b = make('b');
    const c = make('c');
    const list = [a, b, c];
    const updated = { ...b, flash: true };
    const result = replaceProblem(list, updated);
    expect(result).toEqual([a, updated, c]);
    expect(result[0]).toBe(a);
    expect(b.flash).toBeUndefined();
    expect(replaceProblem(list, make('zzz'))).toEqual(list);
  });

  it('removes one problem from the session list', () => {
    const a = make('a');
    const c = make('c');
    const list = [a, make('b'), c];
    const result = removeProblem(list, 'b');
    expect(result).toEqual([a, c]);
    expect(list).toHaveLength(3);
    expect(removeProblem(list, 'zzz')).toEqual(list);
  });
});
