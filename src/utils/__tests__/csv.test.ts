import { describe, it, expect } from 'vitest';
import { sanitizeCsvCell, csvRow } from '../csv';

describe('sanitizeCsvCell', () => {
  it('wraps plain values in quotes', () => {
    expect(sanitizeCsvCell('slab')).toBe('"slab"');
  });

  it('escapes embedded double quotes', () => {
    expect(sanitizeCsvCell('say "send"')).toBe('"say ""send"""');
  });

  it('neutralizes formula injection prefixes', () => {
    expect(sanitizeCsvCell('=CMD()')).toBe('"\'=CMD()"');
    expect(sanitizeCsvCell('+1+1')).toBe('"\'+1+1"');
    expect(sanitizeCsvCell('-1+1')).toBe('"\'-1+1"');
    expect(sanitizeCsvCell('@SUM(A1)')).toBe('"\'@SUM(A1)"');
    expect(sanitizeCsvCell('\tTAB')).toBe('"\'\tTAB"');
    expect(sanitizeCsvCell('\rCR')).toBe('"\'\rCR"');
  });

  it('stringifies nullish and numeric values safely', () => {
    expect(sanitizeCsvCell(null)).toBe('""');
    expect(sanitizeCsvCell(undefined)).toBe('""');
    expect(sanitizeCsvCell(42)).toBe('"42"');
  });
});

describe('csvRow', () => {
  it('joins sanitized cells with commas', () => {
    expect(csvRow(['Name', '=evil', 'V4'])).toBe('"Name","\'=evil","V4"');
  });
});
