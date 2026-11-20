---
status: done
commitment: spec-anchored
---

# UI refactor 001: responsive shell, dark default, consistent pages

## Goal
Matside works as one responsive app on phone and desktop browsers: the app bar and pages look the same everywhere, content uses a centered column instead of shrink-wrapping, the timer gets a full-screen focus mode, and dark mode is the default with no light-only colours left. One codebase, one set of components; only the navigation changes with screen width (MUI breakpoints).

## Context
- Research: none needed (structural refactor).
- Root causes found in the code:
  - `src/index.css` is still the stock Vite starter stylesheet. `body { display:flex; place-items:center }` shrink-wraps the whole app to its content width, so the app bar width changes per page and the empty History view collapses. It also sets colours by `prefers-color-scheme` and restyles every `<button>`. `src/App.css` is unused starter CSS.
  - `src/App.tsx` hardcodes `createAppTheme('light')`. `BrowserRouter` has no `basename`, so on the deployed `/boulder-log/` path no route matches (empty page under the shell), and the `/` → `/session` redirect only works on the dev server. Deep links 404 on refresh because GitHub Pages has no SPA fallback.
  - `src/pages/WorkoutRun.tsx` works around the shell with `minHeight: calc(100vh - 56px)`, `mb: -7` and `pb: 9` (the dense toolbar is 48px, not 56), which leaves gaps around the banner. `PHASE_STYLES` holds hardcoded light-only colours, and the prepare orange `#e65100` with white text is below 4.5:1.
  - `src/components/Layout.tsx` always shows a fixed bottom nav, which is unusual on desktop.
- Relevant code: `src/components/Layout.tsx`, `src/App.tsx`, `src/index.css`, `src/theme/{brand,theme}.ts`, `src/pages/*`, `src/components/PastSessionsList.tsx`, `src/components/DifficultySelect.tsx`, `index.html`, `public/manifest.json`, `docs/brand.md`, `src/__tests__/branding.test.ts`.

## Requirements

### Base and theme
- **R1**: The starter CSS is gone: `src/App.css` is deleted, and `src/index.css` is either deleted or limited to resets that set no colours, no `prefers-color-scheme` rules, no global `button`/`a` styling, and no flex/centering on `body` or `#root`. Background and text colours come from MUI `CssBaseline` and the theme. _Check:_ `src/__tests__/branding.test.ts` › "base stylesheet has no starter rules" (reads `src/index.css` if present: no `place-items`, no `prefers-color-scheme`, no hex colours), plus `src/App.css` does not exist.
- **R2**: The app renders in dark mode by default no matter what the OS prefers. The mode is a single exported constant (e.g. `DEFAULT_THEME_MODE = 'dark'` in `src/theme/theme.ts`) used by `App.tsx`. There is no settings toggle. _Check:_ `src/theme/__tests__/theme.test.ts` › "default mode is dark"; manual: `npm start` with the OS set to light → app is dark.
- **R3**: The browser chrome matches dark mode: `index.html` `theme-color` and `public/manifest.json` `theme_color`/`background_color` use dark brand tokens (the colour the dark app bar actually renders, and `brand.dark.background`). `docs/brand.md` says dark is the default. _Check:_ `src/__tests__/branding.test.ts` (manifest and index.html assertions updated to the dark tokens; this is an intended change).
- **R4**: Nothing in app code uses a colour that only works in one mode. Components outside `src/theme/` use theme palette values, not hex/`rgb(a)` literals. The only exceptions are the hold-colour data in `DifficultySelect.tsx`, and their swatch borders must stay visible on dark paper (the black `Erittäin Vaikea` swatch). _Check:_ `src/__tests__/theme-usage.test.ts` › "no colour literals outside theme" (scans `src/**/*.tsx` excluding tests and `src/theme/`, with an allowlist for the grade list in `DifficultySelect.tsx`); manual: open the grade select in dark mode → every swatch, including black, is distinguishable.
- **R5**: Light mode still works: rendering every page with `createAppTheme('light')` gives readable text. No page assumes dark. _Check:_ `src/theme/__tests__/theme.test.ts` contrast tests stay green for both modes, including the new phase tokens (R12); manual: temporarily switch `DEFAULT_THEME_MODE` to `'light'` → all pages readable, then switch back.

### Routing
- **R6**: The router uses `basename={import.meta.env.BASE_URL}` (without the trailing slash as needed), so routes match under `/boulder-log/` in production and `/` in dev. _Check:_ manual: `npm run build && npx vite preview` → `/boulder-log/` shows the landing page, and the nav reaches `/boulder-log/session` and `/boulder-log/workouts`.
- **R7**: `/` is an official landing route (`src/pages/Home.tsx`): the Matside name and the one-line description from `docs/brand.md`, plus two actions, "Start session" (→ `/session`) and "Interval timer" (→ `/workouts`). Clicking the app-bar brand (logo and name) goes to `/`. Unknown paths redirect to `/`. The legacy `/sessions` and `/problems` redirects stay. _Check:_ `src/pages/__tests__/Home.test.tsx` › "renders actions that navigate"; `src/components/__tests__/Layout.test.tsx` › "brand links home".
- **R8**: Refreshing a deep link on GitHub Pages works: the production build emits `dist/404.html` identical to `dist/index.html`. _Check:_ `npm run build && test -f dist/404.html && cmp dist/index.html dist/404.html`.

### Shell (Layout)
- **R9**: One app bar on every page, identical on all routes: full viewport width, the same height, logo and name. Below the `md` breakpoint the nav is a bottom navigation (Session, Timer). At `md` and wider the bottom nav is not rendered, and Session/Timer appear as tabs in the app bar. On Home, neither the tab nor the bottom-nav item is selected. _Check:_ `src/components/__tests__/Layout.test.tsx` › "mobile shows bottom nav", "desktop shows app bar tabs and no bottom nav" (override the `matchMedia` mock per test), "tabs switch routes", "home selects no tab"; manual: resize the browser across ~900px → nav switches and the app bar never changes width or height.
- **R10**: Page content sits in one centered column with a max width of ~720px (one constant), consistent horizontal padding (16px on mobile, more on desktop allowed), and full width below that. The page background fills the viewport even when the content is short (empty History, Workout not found). On mobile the bottom nav never covers content, and it respects `env(safe-area-inset-bottom)`. _Check:_ manual: `npm start` → Session › History with no sessions at 375px and 1440px → the app bar stays full width, the content column is centered, and nothing collapses or jumps when switching Climb/History; scroll to the bottom of Session on mobile → the last control is above the bottom nav.

### Pages
- **R11**: Pages share one header pattern: a `PageHeader` component (title, plus an optional action slot) used by Session, Workouts (Timer) and Home, with one heading level and variant. Pages don't add their own outer padding wrapper; the Layout container provides it. Empty states use one style (secondary text inside the same surface the list would use). _Check:_ `src/components/__tests__/PageHeader.test.tsx` › "renders title and action"; manual: Session, Timer and Home titles have the same size and position.

### Timer focus mode
- **R12**: Timer phase colours are theme tokens defined per mode in `src/theme/brand.ts` (prepare, work, rest; idle and done/stopped use the normal page background), exposed through the theme. Phase text on its background reaches at least 4.5:1 in both modes. _Check:_ `src/theme/__tests__/theme.test.ts` › "phase colours reach 4.5:1" (both modes).
- **R13**: While the timer is running (prepare/work/rest), the app bar and nav are hidden and the phase colour fills the whole viewport (`100dvh`, no gaps above, below or to the sides). The phase content itself stays centered in the same max-width column. Back/Stop stay reachable. When the run is idle or done, or the user leaves the page, the shell returns. No `calc(100vh - …)` and no negative margins. The focus state lives in a small hook/context (`src/hooks/useFocusMode.ts`) that `Layout` reads and `WorkoutRun` sets. _Check:_ `src/hooks/__tests__/useFocusMode.test.tsx` › "sets and clears focus, clears on unmount"; `src/components/__tests__/Layout.test.tsx` › "focus mode hides app bar and nav"; manual: start a workout at 375px and 1440px → full-bleed phase colour, no banner and no white or dark strip anywhere; Stop → shell is back.

## Constraints
- No data model change, no Dexie `version()` bump.
- MUI only (already a dependency). No new UI or CSS libraries.
- One component tree for all screen sizes: responsive props, `useMediaQuery` or `sx` breakpoints, no separate mobile/desktop pages.
- Offline/PWA behaviour unchanged; CSP in `index.html` unchanged.
- Existing behaviour tests (`Session.test.tsx` etc.) must keep passing. Update only tests whose asserted behaviour is intentionally changed (branding colours, Layout nav), and say so.

## Out of scope
- A theme toggle or settings page; following the OS colour scheme.
- Redesigning forms (PreSessionForm, QuickLog, WorkoutFormDialog) beyond removing light-only colours and duplicate padding.
- Two-column or dashboard desktop layouts.
- Landing page content beyond the title, description and two actions.
- New features, icons or brand changes.

## Open questions
- (resolved) Desktop nav: app bar tabs. Width: centered ~720px column. Timer: focus mode. `/`: official landing page.
