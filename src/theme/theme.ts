import { createTheme } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import { brand } from './brand';

interface PhaseColor {
  bg: string;
  text: string;
}

interface PhasePalette {
  prepare: PhaseColor;
  work: PhaseColor;
  rest: PhaseColor;
  done: PhaseColor;
}

declare module '@mui/material/styles' {
  interface Palette {
    phase: PhasePalette;
  }
  interface PaletteOptions {
    phase?: PhasePalette;
  }
}

export const DEFAULT_THEME_MODE = 'dark' as const;

export function createAppTheme(mode: 'light' | 'dark'): Theme {
  const t = brand[mode];
  return createTheme({
    palette: {
      mode,
      primary: { main: t.primary, contrastText: t.primaryContrast },
      secondary: { main: t.secondary, contrastText: t.secondaryContrast },
      background: { default: t.background, paper: t.paper },
      text: { primary: t.textPrimary, secondary: t.textSecondary },
      phase: t.phase,
    },
    typography: {
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    },
  });
}
