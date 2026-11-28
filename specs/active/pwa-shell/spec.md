---
status: draft
commitment: spec-first
---

# PWA shell

## Goal
The app loads and works with no connection: gym basements and flight mode. Updates arrive as a prompt, never mid-set. The screen can stay awake during a live session or timer, so the climber doesn't have to unlock the phone between attempts.

## Context
- Research: `research/tracking/qol-mobile-interaction-patterns.md` §6 (PWA and iOS standalone quirks), `research/README.md` pass 2, conclusion 1 and QoL item 8 (no service worker despite the "offline-first PWA" copy; prompt-style update banner deferred while a timer runs)
- Relevant code: `vite.config.ts` (base `/boulder-log/`), `index.html`, `public/manifest.json`, `src/main.tsx`, `src/components/Layout.tsx`, `src/pages/WorkoutRun.tsx`, `src/hooks/useIntervalTimer.ts`, `.github/workflows/` (Pages deploy)

## Requirements
- **R1**: The production build registers a service worker that precaches the app shell and assets under `/boulder-log/`. After one online visit, a reload in airplane mode loads the app and existing data. _Check:_ `npm run build && ls dist | rg -n "sw|workbox"` shows the worker; `manual: npm run build && npm run preview → load once → DevTools offline → reload → app and sessions load`
- **R2**: When a new version is waiting, a banner offers "Update". It isn't shown while a timer is running or while a session wrap-up is open; it appears once that ends. Nothing reloads without a tap. _Check:_ `src/components/__tests__/UpdateBanner.test.tsx` › "shows when an update waits", "deferred while the timer runs", "reloads only on tap"
- **R3**: There's a "Keep screen awake" setting (off by default, stored per device). When it's on, a wake lock is held during a live session and during a timer run, released when they end or the page is hidden, and taken again when the page is shown. Browsers without the Wake Lock API hide the setting. _Check:_ `src/hooks/__tests__/useWakeLock.test.ts` › "requests during a session", "releases on end", "re-acquires on visibility", "no-op without the API"
- **R4**: The manifest `start_url` and `scope` resolve inside `/boulder-log/`, and the installed app opens there. _Check:_ `manual: deploy preview or npm run preview → install to home screen (Android Chrome, iOS Safari) → opens on Home, offline too`
- **R5**: The service worker is not registered in dev or in tests, so Vitest and `npm start` are unaffected. _Check:_ `npm run test:run` passes; `rg -n "register" src/main.tsx` shows a guard on `import.meta.env.PROD`
- **R6**: No skipped or focused tests are added. _Check:_ `git diff master...HEAD -- . ':!specs' | rg '^\+.*\b(it|test|describe)\.(skip|only)\('` prints nothing

## Constraints
- New dev dependency is likely (`vite-plugin-pwa` or a hand-written worker); check `npm view <pkg> peerDependencies` against Vite. The `npm audit` in `verify:full` must stay clean.
- Data stays in IndexedDB. The service worker caches only static assets and never caches or proxies data.
- Copy that says "offline-first" must be true after this ships, or the copy changes.

## Out of scope
- Push notifications, background sync, and any server.
- An install prompt UI beyond what the browser offers.
- Haptics (separate QoL item).

## Open questions
- `vite-plugin-pwa` (new dependency, Workbox) or a small hand-written service worker (no dependency, more code to test)?
- Where should "Keep screen awake" live: in the Data card on Home, in a new Settings section, or as a toggle on the timer and session screens?
- Should keep-awake default to on during a timer run (where the screen sleeping is most annoying) and off during sessions?
- On iOS standalone, wake lock has quirks across 2026 versions. Is it acceptable to document "may not work on older iOS" rather than work around it?
