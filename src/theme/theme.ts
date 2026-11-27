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
}

declare module '@mui/material/styles' {
  interface Palette {
    phase: PhasePalette;
  }
  interface PaletteOptions {
    phase?: PhasePalette;
  }
}

// Height of MUI's dense Toolbar (the sticky app bar in Layout), per MUI's Toolbar styles.
const DENSE_TOOLBAR_HEIGHT = 48;

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
    components: {
      MuiTypography: {
        defaultProps: {
          // Replaces MUI's whole mapping, so repeat its defaults; only subtitle1/2 differ (p, not h6).
          variantMapping: {
            h1: 'h1',
            h2: 'h2',
            h3: 'h3',
            h4: 'h4',
            h5: 'h5',
            h6: 'h6',
            subtitle1: 'p',
            subtitle2: 'p',
            body1: 'p',
            body2: 'p',
            inherit: 'p',
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            overscrollBehaviorY: 'contain',
            scrollPaddingTop: DENSE_TOOLBAR_HEIGHT,
          },
          body: { overscrollBehaviorY: 'contain' },
        },
      },
    },
  });
}
