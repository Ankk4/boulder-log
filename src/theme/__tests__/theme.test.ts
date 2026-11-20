import { describe, it, expect } from 'vitest';
import { createAppTheme, DEFAULT_THEME_MODE } from '../theme';
import { brand, contrastRatio } from '../brand';

describe('createAppTheme', () => {
  it('returns light token colors', () => {
    const t = createAppTheme('light');
    expect(t.palette.mode).toBe('light');
    expect(t.palette.primary.main).toBe('#3F4A52');
    expect(t.palette.secondary.main).toBe('#C47F4A');
    expect(t.palette.background.default).toBe('#F7F4EF');
    expect(t.palette.background.paper).toBe('#FFFFFF');
  });

  it('returns dark token colors', () => {
    const t = createAppTheme('dark');
    expect(t.palette.mode).toBe('dark');
    expect(t.palette.primary.main).toBe('#A9B4BC');
    expect(t.palette.secondary.main).toBe('#E0A574');
    expect(t.palette.background.default).toBe('#1C1F22');
    expect(t.palette.background.paper).toBe('#26292D');
  });

  it('default mode is dark', () => {
    expect(DEFAULT_THEME_MODE).toBe('dark');
  });

  it('uses the system font stack', () => {
    expect(createAppTheme('light').typography.fontFamily).toMatch(/^system-ui/);
  });

  it.each(['light', 'dark'] as const)('%s text pairings reach 4.5:1', (mode) => {
    const p = createAppTheme(mode).palette;
    expect(contrastRatio(p.primary.contrastText, p.primary.main)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(p.secondary.contrastText, p.secondary.main)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(p.text.primary, p.background.default)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(p.text.primary, p.background.paper)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(brand[mode].textSecondary, p.background.default)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('phase colours', () => {
  it.each(['light', 'dark'] as const)('%s phase colours reach 4.5:1', (mode) => {
    const phase = createAppTheme(mode).palette.phase;
    expect(phase).toBeDefined();
    for (const key of ['prepare', 'work', 'rest', 'done'] as const) {
      expect(contrastRatio(phase[key].text, phase[key].bg)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('contrastRatio', () => {
  it('gives 21 for black on white', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
  });
  it('gives 1 for identical colors', () => {
    expect(contrastRatio('#C47F4A', '#C47F4A')).toBeCloseTo(1, 5);
  });
});
