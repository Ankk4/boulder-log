# Tasks: Navigation rework

## T1 — Add Overview, History and Settings pages and routes; delete Home
- covers: [R1, R6, R7, R8, R10]
- runner: implementer
- allowed files: `src/App.tsx`, `src/pages/Overview.tsx`, `src/pages/History.tsx`, `src/pages/Settings.tsx`, `src/pages/__tests__/Overview.test.tsx`, `src/pages/__tests__/History.test.tsx`, `src/pages/__tests__/Settings.test.tsx`, `src/__tests__/App.test.tsx`, `src/pages/Home.tsx` (delete), `src/pages/__tests__/Home.test.tsx` (delete)
- check: `npx vitest run src/__tests__/App.test.tsx src/pages/__tests__/Overview.test.tsx src/pages/__tests__/History.test.tsx src/pages/__tests__/Settings.test.tsx && test ! -e src/pages/Home.tsx && test ! -e src/pages/__tests__/Home.test.tsx && npm run knip`
- tests to add: the R1, R6, R7, R8 and R10 tests named in `spec.md`, except "old history query shows the Session page" (T2 adds it).
- parallel-safe: yes
- schema-change: no
- depends-on: []
- notes:
  - This is one task because Knip fails on page files no route uses. The pages and their routes land together.
  - Each page uses `src/components/PageHeader.tsx` for its `h2` heading. The app bar's `h1` "Matside" stays.
  - Overview (R6): use `useCurrentSession` from `src/db/index.ts`. `undefined` means loading, so render no card; `null` means no session. Use a `Button` with `component={RouterLink}` to `/session`, the way `Home.tsx` does it today. Elapsed time and stats are already in `ActiveSessionBar`, so don't repeat them.
  - Overview placeholders (R7): static markup only, with no db hooks and no new utils. Section headings are `h3`.
  - History (R8): `PageHeader title="History"` plus `src/components/PastSessionsList.tsx`. No `DataCard` on this page.
  - Settings (R10): `PageHeader title="Settings"` plus `src/components/DataCard.tsx`. `DataCard` stays in its file. `Session.tsx` still renders it until T2, which is fine.
  - Routes: add `/overview`, `/history` and `/settings`. Change `/` and `*` to `<Navigate to="/overview" replace />`. Keep the `/sessions` and `/problems` redirects as they are.
  - App test: `App` uses `BrowserRouter` with the basename from `import.meta.env.BASE_URL` (`/` in Vitest). Set the path with `window.history.pushState({}, '', path)` before `render(<App />)`, and assert on `window.location.pathname` for the redirects. Mock `../db/index` the way `src/pages/__tests__/Session.test.tsx` does (`vi.hoisted` `mockDb`, `useCurrentSession` → `null`) and stub the hooks Workouts uses (`useIntervalWorkouts`, `useRecentIntervalRuns` → `[]`). Stub `DataCard` and `PastSessionsList` if their db calls get in the way. Expected headings: Overview, History, Settings, "New session" for `/session`, and the Workouts page's `PageHeader` title.
  - Don't touch `Layout.tsx` (T3) or `Session.tsx` (T2).

## T2 — Remove the Session history mode; point detail Back and the active bar at /history
- covers: [R2, R9, R11, R12]
- runner: implementer
- allowed files: `src/pages/Session.tsx`, `src/pages/__tests__/Session.test.tsx`, `src/pages/SessionDetail.tsx`, `src/pages/__tests__/SessionDetail.test.tsx`, `src/components/ActiveSessionBar.tsx`, `src/components/__tests__/ActiveSessionBar.test.tsx`, `src/__tests__/App.test.tsx`
- check: `npx vitest run src/pages/__tests__/Session.test.tsx src/pages/__tests__/SessionDetail.test.tsx src/components/__tests__/ActiveSessionBar.test.tsx src/__tests__/App.test.tsx && ! rg -n "view=history|get\('view'\)" src -g '!**/__tests__/**' && npm run knip`
- tests to add: the R2, R11 and R12 tests named in `spec.md`. Update the two R9 tests. Delete the four Session tests that R11 lists; the spec says they go on purpose.
- parallel-safe: no
- schema-change: no
- depends-on: [T1]
- notes:
  - `Session.tsx`: remove `SessionMode`, `mode`, `changeMode`, `useSearchParams`, the history branch of the render, the `HistoryIcon` and `ArrowBackIcon` imports if they become unused, the Close `IconButton`, and the `DataCard` and `PastSessionsList` imports. Check for a `prevMode` or similar effect keyed on `mode`, and drop it with the mode. Keep `BackupReminder` on "New session". If the Close button was the only user of `navigate`, remove that too.
  - The `PageHeader` `action` prop becomes unused in `Session.tsx`. Workouts still uses it, so keep the prop.
  - `SessionDetail.tsx`: change `HISTORY_PATH` to `/history`.
  - `ActiveSessionBar.tsx`: `onSessionPage` becomes `location.pathname === '/session'`. Drop `useSearchParams`.
  - App test (R2): `pushState` to `/session?view=history`, then expect the "New session" heading.
  - If `feature/rework-undo` has merged into master by then, rebase first. Its "switching to History clears the inline undo" test depends on the removed History button. Rewrite it to unmount the page, or delete it with a note, because a route change now unmounts Session (spec Context).

## T3 — Five-item nav with highlighting and brand link
- covers: [R3, R4, R5, R13, R14]
- runner: implementer
- allowed files: `src/components/Layout.tsx`, `src/components/__tests__/Layout.test.tsx`, `src/components/navItems.ts`
- check: `npx vitest run src/components/__tests__/Layout.test.tsx && npx eslint src/components/Layout.tsx src/components/navItems.ts && npm run knip`
- tests to add: the R3, R4 and R5 tests named in `spec.md`. Replace "brand links home", delete "home selects no tab", replace the single-path "marks only the active link" with the `it.each` version, and change "highlights Session on a session page" to expect History. Keep "focus mode hides app bar and nav" (R13) passing unchanged.
- parallel-safe: yes
- schema-change: no
- depends-on: []
- notes:
  - Optional: put a plain array of `{ label, to, icon }` in `src/components/navItems.ts` (no component exports, per `react-refresh/only-export-components`) and map it in both navs. If you don't use it, don't create the file; Knip fails on unused files.
  - Replace `getCurrentTab` with a path → index lookup. Check `/sessions` and `/history` before `/session`, because `'/sessions/x'.startsWith('/session')` is true. Use exact or `/`-bounded matches. `/` and unknown paths aren't rendered inside Layout after T1's redirect, so returning `false` for them is fine.
  - Icons from `@mui/icons-material`: Overview `Dashboard`, Session `FitnessCenter`, History `History`, Timer `Timer`, Settings `Settings`.
  - R14: `BottomNavigationAction` defaults to `minWidth: 80`. Set `minWidth: 0` (and smaller horizontal padding if needed) on the actions so five fit in 360 px. Keep the labels and `showLabels`.
  - Keep the existing a11y wiring: `tabLinkProps` (`role`, `tabIndex`, `aria-current`), both `nav` elements labelled "Main", the skip link and `ActiveSessionBar`.
  - Brand `Link` `to="/overview"`.
  - R14 is manual. Report it as not run unless you start the app.
