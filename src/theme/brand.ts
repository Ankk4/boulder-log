export const brand = {
  light: {
    primary: '#3F4A52',
    primaryContrast: '#F7F4EF',
    secondary: '#C47F4A',
    secondaryContrast: '#1C1F22',
    background: '#F7F4EF',
    paper: '#FFFFFF',
    textPrimary: '#1C1F22',
    textSecondary: '#4A545B',
    phase: {
      prepare: { bg: '#BF360C', text: '#FFFFFF' },
      work: { bg: '#1B5E20', text: '#FFFFFF' },
      rest: { bg: '#0D47A1', text: '#FFFFFF' },
      done: { bg: '#4A148C', text: '#FFFFFF' },
    },
  },
  dark: {
    primary: '#A9B4BC',
    primaryContrast: '#1C1F22',
    secondary: '#E0A574',
    secondaryContrast: '#1C1F22',
    background: '#1C1F22',
    paper: '#26292D',
    textPrimary: '#F7F4EF',
    textSecondary: '#B8C0C6',
    phase: {
      prepare: { bg: '#A82E08', text: '#FFFFFF' },
      work: { bg: '#164A1A', text: '#FFFFFF' },
      rest: { bg: '#0A3A82', text: '#FFFFFF' },
      done: { bg: '#3C1074', text: '#FFFFFF' },
    },
  },
} as const;

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG 2.x contrast ratio between two #RRGGBB colors. */
export function contrastRatio(hexA: string, hexB: string): number {
  const a = luminance(hexA);
  const b = luminance(hexB);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
