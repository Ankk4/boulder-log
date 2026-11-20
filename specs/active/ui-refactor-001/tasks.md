# Tasks: UI refactor 001: responsive shell, dark default, consistent pages

Rules for splitting:
- One task = one implementer run = one commit. Aim for ≤ 3 source files plus tests.
- Every requirement in `spec.md` appears in at least one task's `covers`.
- `parallel-safe: yes` only if the task's allowed files overlap no other open task, it has no unmet `depends-on`, and `schema-change: no`.
- The `check` is the narrowest thing that proves the task.

## T1 — Remove starter CSS, dark mode by default, dark browser chrome
- covers: [R1, R2, R3]
- allowed files: `src/index.css`, `src/App.css`, `src/main.tsx`, `src/App.tsx`, `src/theme/theme.ts`, `src/theme/__tests__/theme.test.ts`, `index.html`, `public/manifest.json`, `docs/brand.md`, `src/__tests__/branding.test.ts`
- check: `npx vitest run src/theme/__tests__/theme.test.ts src/__tests__/branding.test.ts`
- tests to add: theme.test "default mode is dark" (`DEFAULT_THEME_MODE === 'dark'`); branding.test "base stylesheet has no starter rules" (if `src/index.css` exists: no `place-items`, no `prefers-color-scheme`, no `#hex`; `src/App.css` does not exist). Update the existing manifest/index.html colour assertions to the dark tokens (intended change, say so in the summary).
- parallel-safe: yes
- schema-change: no
- depends-on: []
- notes: Delete `src/App.css` (nothing imports it). Preferably delete `src/index.css` and its import in `src/main.tsx`, since `CssBaseline` already sets body margin and background. Export `DEFAULT_THEME_MODE` from `src/theme/theme.ts` and use it in `App.tsx`. With `@mui/material` v5 in dark mode, `<AppBar color="primary">` renders with the paper background unless `enableColorOnDark` is set, so `theme-color`/`theme_color` should be the colour the app bar actually shows (most likely `brand.dark.paper`); `background_color` = `brand.dark.background`. Reference `brand.dark.*` in the test, not literals. Add one line to `docs/brand.md` saying dark is the default and the light palette is kept for later.

## T2 — Router basename, official landing page, 404.html fallback
- covers: [R6, R7, R8]
- allowed files: `src/App.tsx`, `src/pages/Home.tsx`, `src/pages/__tests__/Home.test.tsx`, `package.json`
- check: `npx vitest run src/pages/__tests__/Home.test.tsx && npm run build && cmp dist/index.html dist/404.html`
- tests to add: Home renders the "Matside" heading, the brand description, and the "Start session" and "Interval timer" actions; clicking each navigates to `/session` or `/workouts` (MemoryRouter plus a location probe, like `src/components/__tests__/Layout.test.tsx`).
- parallel-safe: no
- schema-change: no
- depends-on: [T1]
- notes: `<Router basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>` (react-router-dom v6). Routes: `/` → `<Home />`, keep the `/sessions` and `/problems` redirects, add `*` → `<Navigate to="/" replace />`. Take the description text from `docs/brand.md` (Voice: plain, no exclamation marks). Keep Home simple and self-contained; T6 switches it to `PageHeader`. 404 fallback: extend the `build` script, e.g. `tsc -b && vite build && node -e "require('fs').copyFileSync('dist/index.html','dist/404.html')"` (check whether package.json is ESM; use `node --input-type=module -e` with `import` if needed). Don't touch `vite.config.ts`.

## T3 — PageHeader component
- covers: [R11]
- allowed files: `src/components/PageHeader.tsx`, `src/components/__tests__/PageHeader.test.tsx`
- check: `npx vitest run src/components/__tests__/PageHeader.test.tsx`
- tests to add: "renders title and action" (renders an `h2`-level heading with the title, and renders the optional `action` node when given); renders without an action.
- parallel-safe: yes
- schema-change: no
- depends-on: []
- notes: Props `{ title: string; action?: ReactNode }`. Layout: `Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}`. Use one fixed variant (`h5`, `component="h2"`) because the app bar's "Matside" is the `h1`. Don't use it in pages yet (that's T6).

## T4 — useFocusMode hook and provider
- covers: [R13]
- allowed files: `src/hooks/useFocusMode.ts`, `src/hooks/useFocusMode.tsx`, `src/hooks/FocusModeProvider.tsx`, `src/hooks/__tests__/useFocusMode.test.tsx`
- check: `npx vitest run src/hooks/__tests__/useFocusMode.test.tsx`
- tests to add: "sets and clears focus, clears on unmount": `useFocusMode()` reads `false` by default; `useRequestFocusMode(true)` in a child makes it `true`; changing the argument to `false` or unmounting the child sets it back to `false`. Outside a provider, reading returns `false` and requesting does nothing (no throw).
- parallel-safe: yes
- schema-change: no
- depends-on: []
- notes: `react-refresh/only-export-components` forbids exporting the provider and the hooks from one file, so split them: `src/hooks/FocusModeProvider.tsx` holds `FocusModeContext` and `FocusModeProvider`; `src/hooks/useFocusMode.ts` holds the hooks (matches the spec's filename). T5 imports `FocusModeProvider` from `src/hooks/FocusModeProvider.tsx`. Exports: `FocusModeProvider`, `useFocusMode(): boolean`, `useRequestFocusMode(active: boolean): void` (an effect that sets the value and clears it on cleanup). React context only, no global state.

## T5 — Responsive Layout: full-width bar, tabs on desktop, bottom nav on mobile, content column, focus mode
- covers: [R7, R9, R10, R13]
- allowed files: `src/components/Layout.tsx`, `src/components/__tests__/Layout.test.tsx`
- check: `npx vitest run src/components/__tests__/Layout.test.tsx`
- tests to add: "mobile shows bottom nav" (default `matchMedia` mock → `matches: false`); "desktop shows app bar tabs and no bottom nav" (override `window.matchMedia` in the test so the `md`-up query matches, and restore it afterwards); "tabs switch routes"; "home selects no tab" (start at `/`); "brand links home"; "focus mode hides app bar and nav" (render a child that calls `useRequestFocusMode(true)`). Keep the existing two tests passing; adjust them only if the DOM changes, and say so.
- parallel-safe: no
- schema-change: no
- depends-on: [T4]
- notes: Wrap the output in `FocusModeProvider` inside Layout, so `App.tsx` isn't touched. Use `useMediaQuery(theme.breakpoints.up('md'))`. App bar: `position="sticky"`, full width, the same `Toolbar variant="dense"` on every route. The brand (logo + name) is a link to `/` (`component={RouterLink}`) and keeps the `h1` "Matside" heading. On desktop, MUI `Tabs` sits in the toolbar with `value={false}` on Home. Content: `<Container maxWidth={false} sx={{ maxWidth: CONTENT_MAX_WIDTH, px: { xs: 2, md: 3 }, py: 2 }}>` with `CONTENT_MAX_WIDTH = 720` exported. Root `Box` gets `minHeight: '100dvh'`, `bgcolor: 'background.default'`, and `display: flex; flexDirection: column`. On mobile the bottom padding is `calc(56px + env(safe-area-inset-bottom))`, and the fixed bottom nav `Paper` has `pb: 'env(safe-area-inset-bottom)'`. Focus mode: render neither the app bar nor the nav, render children with no container or padding (the page fills the viewport itself), and drop the bottom padding.

## T6 — Pages use PageHeader and the Layout container
- covers: [R10, R11]
- allowed files: `src/pages/Session.tsx`, `src/pages/Workouts.tsx`, `src/pages/Home.tsx`, `src/components/PastSessionsList.tsx`
- check: `npx vitest run src/pages src/components`
- tests to add: none new. The existing `Session.test.tsx`, `Home.test.tsx` and `PageHeader.test.tsx` must stay green. If a heading query in `Session.test.tsx` changes level, update that assertion and say so.
- parallel-safe: no
- schema-change: no
- depends-on: [T2, T3, T5]
- notes: Replace each page's outer `<Box sx={{ p: 2 }}>` with a fragment or plain `Box`, because Layout provides the padding. Session: `<PageHeader title="Session" />`. Workouts: `<PageHeader title="Interval timer" action={<Button …>New</Button>} />`. Home: `PageHeader` or keep its own hero, but use the same title size. Empty states use one pattern: `<Paper sx={{ p: 2 }}><Typography color="text.secondary">…</Typography></Paper>`, the same as `PastSessionsList` already does; align Workouts' empty lists to it. Don't change form internals.

## T7 — Timer phase colour tokens
- covers: [R5, R12]
- allowed files: `src/theme/brand.ts`, `src/theme/theme.ts`, `src/theme/__tests__/theme.test.ts`, `docs/brand.md`
- check: `npx vitest run src/theme/__tests__/theme.test.ts`
- tests to add: `it.each(['light','dark'])` "%s phase colours reach 4.5:1": for each of prepare, work, rest and done, `contrastRatio(phase.text, phase.bg) >= 4.5`; the theme exposes `palette.phase`.
- parallel-safe: no
- schema-change: no
- depends-on: [T1]
- notes: Add `phase: { prepare, work, rest, done }` (each `{ bg, text }`, hex) to `brand.light` and `brand.dark`. `#e65100` + white fails; something like `#BF360C` passes. Dark-mode phase backgrounds can be slightly deeper. Idle uses `background.default`/`text.primary`, not a token. Expose it through MUI module augmentation in `theme.ts` (`declare module '@mui/material/styles' { interface Palette { phase: … } interface PaletteOptions { phase?: … } }`). Add the phase rows to the palette table in `docs/brand.md`. Don't touch `WorkoutRun.tsx` (that's T8).

## T8 — WorkoutRun focus mode with theme phase colours
- covers: [R4, R13]
- allowed files: `src/pages/WorkoutRun.tsx`
- check: `npx vitest run src/pages && npx eslint src/pages/WorkoutRun.tsx`
- tests to add: none (layout isn't visible to jsdom; the hook and Layout behaviour are covered by T4/T5). Report the manual check from R13 as not run, or run `npm start` and do it.
- parallel-safe: no
- schema-change: no
- depends-on: [T4, T5, T7]
- notes: Delete `PHASE_STYLES` literals. Read colours with `useTheme().palette.phase[phase]`; idle and done-but-not-running fall back to `background.default`/`text.primary`. Derive muted text and the progress track with `alpha(text, 0.85)` / `alpha(text, 0.35)` from `@mui/material/styles`, and replace the `rgba(255,255,255,…)` button styles the same way. Call `useRequestFocusMode(isRunning)`. Root box: `minHeight: '100dvh'` while in focus mode (otherwise let Layout size it), and remove `calc(100vh - 56px)`, `mb: -7` and `pb: 9`. Wrap the inner content in a centered column with `maxWidth: CONTENT_MAX_WIDTH` (import from `src/components/Layout.tsx`), `mx: 'auto'` and `p: 2`. Back and Stop must stay visible in focus mode. Keep the timer logic (`src/hooks/useIntervalTimer.ts`, `src/hooks/useWakeLock.ts`, `src/utils/beep.ts`) untouched.

## T9 — Colour-literal guard test and dark-safe grade swatches
- covers: [R4, R5]
- allowed files: `src/__tests__/theme-usage.test.ts`, `src/components/DifficultySelect.tsx`
- check: `npx vitest run src/__tests__/theme-usage.test.ts`
- tests to add: "no colour literals outside theme": walk `src/**/*.tsx` (fs, like `src/__tests__/branding.test.ts`), skipping `__tests__` and `src/theme/`; fail on `#[0-9a-fA-F]{3,8}\b` or `rgba?\(` and print file:line. Allowlist only the grade array lines in `DifficultySelect.tsx` (for example, skip lines matching `{ name: '…', color: '#…'`), not the whole file.
- parallel-safe: no
- schema-change: no
- depends-on: [T6, T8]
- notes: In `DifficultySelect.tsx`, replace the swatch border `rgba(0,0,0,0.2)` with `1px solid` + `theme.palette.divider`, or `text.secondary` so the black swatch shows on `#26292D` paper. If the scan finds literals in files from earlier tasks, report them; don't edit outside allowed files. Finish with a full `npm run verify`.

## Coverage
| R | tasks |
| --- | --- |
| R1 | T1 |
| R2 | T1 |
| R3 | T1 |
| R4 | T8, T9 |
| R5 | T7, T9 |
| R6 | T2 |
| R7 | T2, T5 |
| R8 | T2 |
| R9 | T5 |
| R10 | T5, T6 |
| R11 | T3, T6 |
| R12 | T7 |
| R13 | T4, T5, T8 |
