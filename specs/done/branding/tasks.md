# Tasks: Branding (Matside)

Spec: `specs/active/branding/spec.md`. Every task ends green on `npm run verify`.

## T1: Brand tokens and app theme
- covers: [R8]
- allowed files: `src/theme/brand.ts`, `src/theme/theme.ts`, `src/theme/__tests__/theme.test.ts`, `src/App.tsx`
- check: `npx vitest run src/theme/__tests__/theme.test.ts`
- tests to add:
  - `createAppTheme('light')` and `createAppTheme('dark')` return the exact token hex values for primary, secondary, background and paper.
  - `palette.mode` matches the argument.
  - `typography.fontFamily` starts with `system-ui`.
  - A `contrastRatio(hexA, hexB)` helper (exported from `brand.ts` or `theme.ts`) gives known values: black/white = 21, and the same color = 1.
  - In both modes, `primary.contrastText` on `primary.main` and `text.primary` on `background.default` are ≥ 4.5.
- parallel-safe: yes
- schema-change: no
- depends-on: []
- notes:
  - Tokens are in the R8 table. Export them as `as const` objects (e.g. `brand.light.primary`) so the docs and tests can import them.
  - Set `contrastText` explicitly: chalk or white on granite, and granite or near-black on sandstone. Check that the sandstone `#C47F4A` pairing passes 4.5 with dark text. If no token pairing passes, report it rather than changing the hex values.
  - `App.tsx`: replace the inline `createTheme` with `createAppTheme('light')`, created once at module scope. Nothing else in App changes.
  - Don't add `useMediaQuery('(prefers-color-scheme)')`. Following the OS theme is out of scope.

## T2: Icon masters and generation script
- covers: [R3, R4]
- allowed files: `assets/brand/icon.svg`, `assets/brand/icon-maskable.svg`, `scripts/generate-icons.mjs`, `public/favicon.svg`, `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable-512.png`, `public/apple-touch-icon.png`, `package.json`, `package-lock.json`, `eslint.config.js` (only if the `.mjs` script needs Node globals there)
- check: `npm run icons && npm run icons && git status --porcelain public/ assets/` shows only the first run's new files. Run it again after `git add` and it should show nothing. Also `npm run lint`.
- tests to add: none here. T3's branding test asserts the PNG sizes.
- parallel-safe: yes
- schema-change: no
- depends-on: []
- notes:
  - Hand-write the SVG: `viewBox="0 0 512 512"` with a few `<path>`/`<polygon>` elements and no `<text>`, filters, external refs or fonts.
  - Motif: a faceted or chunky climbing hold. Granite `#3F4A52` body with 2–3 facet shades derived from it, a sandstone `#C47F4A` accent facet, and 1–2 bolt holes in chalk `#F7F4EF`. Don't use a plain rounded outline on a bright fill (a competitor already uses one; see `research/competitors/naming-and-icons.md`).
  - `icon.svg` has a transparent background. `icon-maskable.svg` has a full-bleed chalk background with the mark scaled into the centre 80% circle.
  - The apple-touch-icon is rendered from the maskable master at 180 px, so it has no transparency.
  - Script: `@resvg/resvg-js` (devDependency, exact or caret version) reads the masters, renders the PNGs with `fitTo: { mode: 'width', value: N }` and copies `icon.svg` to `public/favicon.svg`. Add `"icons": "node scripts/generate-icons.mjs"` to `package.json` scripts.
  - Keep the output deterministic: don't add timestamps or metadata to the files.
  - Keep `package.json` changes to the script and the devDependency. The `name` field is renamed in T4.

## T3: PWA wiring and branding tests
- covers: [R2, R5, R6, R7]
- allowed files: `public/manifest.json`, `index.html`, `public/vite.svg` (delete), `src/assets/react.svg` (delete), `src/__tests__/branding.test.ts`
- check: `npx vitest run src/__tests__/branding.test.ts`
- tests to add, in `src/__tests__/branding.test.ts`. Read the files with `node:fs` and `node:path` from the repo root (`process.cwd()`):
  - "manifest is valid for the base path": `name` and `short_name` are `Matside`. `start_url` and `scope` are `./`. No icon `src` starts with `/`. Every listed icon file exists in `public/`. One icon has `purpose: "maskable"`. The colors match the `brand.light` tokens (import them from `src/theme/brand.ts`).
  - "icon PNGs exist with declared sizes": for each PNG in the manifest, plus `apple-touch-icon.png` at 180, read bytes 16–23 (IHDR width and height, big-endian) and compare them with the declared `sizes`.
  - "index.html links manifest, icons and theme-color": regex checks for `rel="manifest"`, `rel="icon"` with `favicon.svg`, `rel="apple-touch-icon"`, `name="theme-color" content="#3F4A52"`, `<title>Matside</title>`, and that the CSP meta is still present and unchanged (compare it with a string constant copied from the current file).
  - "database name is unchanged": `src/setupTests.ts` mocks Dexie globally, so assert on the source instead: `fs.readFileSync('src/db/database.ts')` contains `super('boulderLog')`.
- parallel-safe: no
- schema-change: no
- depends-on: [T1, T2]
- notes:
  - In `index.html`, use root-absolute hrefs (`/manifest.json`, `/favicon.svg`, `/apple-touch-icon.png`). Vite rewrites public-dir URLs in `index.html` with `base`. Confirm this with `npx vite build && rg -n "boulder-log/(manifest|favicon|apple)" dist/index.html`.
  - Inside `manifest.json`, use relative paths (`icon-192.png`, `./`). Vite does not rewrite the manifest. The paths resolve against the manifest's URL, `/boulder-log/manifest.json`.
  - Set the `<title>` to Matside here. The rest of the renaming is in T4.
  - Delete `vite.svg` and `react.svg` only after `rg -n "vite\.svg|react\.svg" src index.html public` finds no other references.

## T4: Rename to Matside and write the brand guide
- covers: [R1, R2, R10]
- allowed files: `README.md`, `SECURITY.md`, `package.json`, `package-lock.json`, `docs/brand.md`, `src/__tests__/branding.test.ts`
- check: `npx vitest run src/__tests__/branding.test.ts`, then `rg -n -i "boulder ?notes|boulderlog" --glob '!specs/**' --glob '!research/**' --glob '!node_modules/**' --glob '!package-lock.json'` matches only `src/db/`, the kept-DB-name note in `docs/brand.md` (R10) and the DB-name assertion in `src/__tests__/branding.test.ts` (R2)
- tests to add: "manifest and index.html use the brand name" in the existing branding test. It checks the manifest `name` and `short_name`, the index `<title>` and the README H1 `# Matside`, and that the README links `docs/brand.md`.
- parallel-safe: no
- schema-change: no
- depends-on: [T2, T3]
- notes:
  - `package.json` `name` becomes `matside`. Run `npm install --package-lock-only` to sync the lock file; don't hand-edit it.
  - Don't rename the repo URLs, badges or the `/boulder-log/` links in the README. They stay as they are (R2). Add one README line: "Matside (repo: boulder-log)".
  - `docs/brand.md` needs the sections listed in R10. Take the palette table values from `src/theme/brand.ts`. For the rationale, link the research note by path only (`research/competitors/naming-and-icons.md`, which is private), with no competitor names or details. This repo is public.
  - Don't touch the README's "works offline" wording. It belongs to a later spec.

## T5: In-app header
- covers: [R9]
- allowed files: `src/components/Layout.tsx`, `src/components/__tests__/Layout.test.tsx`
- check: `npx vitest run src/components/__tests__/Layout.test.tsx`
- tests to add:
  - "renders app name in header": a heading with the text "Matside" is present, and the icon `img` has `alt=""`.
  - "bottom navigation still switches tabs": render in a `MemoryRouter`, click "Timer", the route becomes `/workouts`; click "Session", it becomes `/session`.
  - Wrap renders in `ThemeProvider` with `createAppTheme('light')`.
- parallel-safe: no
- schema-change: no
- depends-on: [T1, T2]
- notes:
  - Use MUI `AppBar position="sticky" color="primary" elevation={0}` with a dense `Toolbar` (`variant="dense"`, about 48 px).
  - The icon is `<img src={`${import.meta.env.BASE_URL}favicon.svg`} width={24} height={24} alt="" />`.
  - The name is `<Typography component="h1" variant="h6">Matside</Typography>`.
  - Keep the existing `pb: 7` and the bottom `Paper` unchanged.
  - The layout itself needs a manual check (`npm start` at 360 px). Tests can't see it, so say so in the hand-back.
  - Check that `import.meta.env.BASE_URL` is defined under Vitest (Vite sets it to `base`).
