---
status: approved         # draft | approved | done. /run-spec only runs approved specs.
commitment: spec-anchored # the brand guide and tokens are kept up to date with the code
---

# Branding: Matside

## Goal
The app gets one name, **Matside**, a real icon and a granite/sandstone/chalk identity. These appear in the browser tab, on the installed home-screen app and in a small in-app header. A brand guide and an icon script keep the branding consistent from here on.

## Context
- Research: `research/competitors/naming-and-icons.md` (private; rounds 1 and 2: name clashes, crowded icon motifs and colors). Don't paste competitor detail here.
- Decisions from the interview (2026-11-20):
  - Name: **Matside**, the edge of the mat where you rest between goes. It's indoor-bouldering vocabulary. Only the visible name changes. The repo, the Pages URL `/boulder-log/` and the Dexie DB name `'boulderLog'` stay the same.
  - Icon: an abstract climbing hold or boulder. Avoid the motifs competitors already use: a plain rounded outline on a bright color, a mountain zigzag, a climber silhouette, a chart, a timer ring or a hand. Lean towards a faceted (low-poly) or chunky hold shape with bolt holes.
  - Palette: earthy rock/chalk. Light mode is the only one shown. Dark mode tokens are defined but not used.
- Current state:
  - Three names are in use: "Boulder Notes" (`index.html`, `README.md`, `SECURITY.md`, `package.json` `name`), "BoulderLog" (`public/manifest.json`) and boulder-log (repo, URL).
  - The favicon is `public/vite.svg`.
  - `public/manifest.json` lists icon PNGs that don't exist. `index.html` never links it. `start_url: "/"` ignores the `/boulder-log/` base (`vite.config.ts`).
  - The theme is MUI's default blue/pink, built inline in `src/App.tsx`.
  - `src/components/Layout.tsx` has bottom navigation only, with no header.

## Requirements

### Name
- **R1**: The user-facing name is "Matside" everywhere: the `index.html` `<title>`, the manifest `name` and `short_name`, the `README.md` H1 and prose, and `SECURITY.md`. `package.json` `name` is `matside`, and `package-lock.json` is kept in sync. No "Boulder Notes" or "BoulderLog" text remains outside the code identifiers kept by R2. _Check:_ `rg -n -i "boulder ?notes|boulderlog" --glob '!specs/**' --glob '!research/**' --glob '!node_modules/**' --glob '!package-lock.json'` matches only `src/db/` identifiers, the kept-DB-name note in `docs/brand.md` (R10) and the DB-name assertion in `src/__tests__/branding.test.ts` (R2). Also `src/__tests__/branding.test.ts › "manifest and index.html use the brand name"`.
- **R2**: Stored data and the URL are unchanged. The Dexie database is still opened as `'boulderLog'`, and the `BoulderLogDatabase` class name may stay. `vite.config.ts` `base` stays `'/boulder-log/'`. _Check:_ `src/__tests__/branding.test.ts › "database name is unchanged"` (asserts `db.name === 'boulderLog'` on the real class, not the mock, or a `rg "super\('boulderLog'\)" src/db/database.ts` assertion if the global Dexie mock prevents it). Also `git diff master -- vite.config.ts` shows no `base` change.

### Icon
- **R3**: One SVG master is the source of every icon: `assets/brand/icon.svg` (full icon) and `assets/brand/icon-maskable.svg` (the same mark inside the maskable safe zone, the centre 80%, on a solid chalk or granite background). The mark is an abstract hold or boulder in the R6 palette and reads clearly at 16 px. _Check:_ the files exist. Also `manual: open each SVG at 16, 48 and 512 px → the shape is clear at 16 px, and the maskable one survives a circle crop (e.g. maskable.app).`
- **R4**: `npm run icons` renders the SVG masters into `public/`: `favicon.svg` (a copy of the master), `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` and `apple-touch-icon.png` (180×180, with no transparency). The script is `scripts/generate-icons.mjs` and uses `@resvg/resvg-js`, a devDependency only. The generated files are committed, so build and deploy don't run the script. Running it twice gives byte-identical output. _Check:_ `npm run icons && git status --porcelain public/` is empty after a second run. Also `src/__tests__/branding.test.ts › "icon PNGs exist with declared sizes"`, which reads each PNG's IHDR width and height.
- **R5**: `public/vite.svg` and `src/assets/react.svg` are removed if nothing references them. _Check:_ `rg -n "vite\.svg|react\.svg" src index.html public` finds nothing.

### PWA wiring
- **R6**: `public/manifest.json` is valid under the `/boulder-log/` base:
  - `name` and `short_name` are "Matside".
  - `start_url` and `scope` are `"./"`.
  - `display` is `"standalone"`.
  - `background_color` is chalk `#F7F4EF` and `theme_color` is granite `#3F4A52`.
  - `icons` lists the 192 and 512 PNGs (`purpose: "any"`) and the maskable 512 (`purpose: "maskable"`), using relative `src` paths.
  - The `description` mentions indoor bouldering.

  _Check:_ `src/__tests__/branding.test.ts › "manifest is valid for the base path"` (no `src`, `start_url` or `scope` starts with `/`, and every icon file exists).
- **R7**: `index.html` links the manifest, the SVG favicon and the apple-touch-icon, and has `<meta name="theme-color" content="#3F4A52">`. The links use paths that Vite rewrites with the base path. The existing CSP meta is untouched. _Check:_ `src/__tests__/branding.test.ts › "index.html links manifest, icons and theme-color"`. Also `manual: npm run build && npx vite preview → open /boulder-log/ → DevTools › Application › Manifest shows Matside, the icons with no errors, and an install option. In the built dist/index.html, the links start with /boulder-log/.`

### Theme
- **R8**: The brand tokens live in `src/theme/brand.ts` as typed constants, and are the only place the hex values appear in `src/`:
  - Light: primary granite `#3F4A52`, secondary sandstone `#C47F4A`, background chalk `#F7F4EF`, paper `#FFFFFF`.
  - Dark: background `#1C1F22`, primary `#A9B4BC`, secondary `#E0A574`, paper `#26292D`.
  - Text colors for both modes.

  `src/theme/theme.ts` exports `createAppTheme(mode)`, built with MUI `createTheme`. Its `typography.fontFamily` is the system font stack (`system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`), so no font is downloaded. `App.tsx` uses `createAppTheme('light')`, and the inline `createTheme` is removed. The app does not follow the OS theme. _Check:_ `src/theme/__tests__/theme.test.ts`: light and dark themes return the token colors. Primary and secondary text on their background have WCAG contrast ≥ 4.5:1 in both modes. A small contrast helper is tested in the same file. Also `rg -n "#1976d2|#dc004e" src` finds nothing.

### In-app header
- **R9**: `Layout` shows a slim top bar with the icon (from `favicon.svg`, about 24 px, `alt=""`, because the name next to it carries the meaning) and the word "Matside" in a heading element. The bar uses the theme's primary color, doesn't scroll away on mobile, and leaves page content and the bottom navigation working as before. There are no new nav actions. _Check:_ `src/components/__tests__/Layout.test.tsx › "renders app name in header"` and `› "bottom navigation still switches tabs"`. Also `manual: npm start at 360 px width → the header is visible, page content isn't hidden under it, and the bottom nav works.`

### Brand guide
- **R10**: `docs/brand.md` covers:
  - The name: spelling, never "MatSide" or "Mat Side", the `short_name`, the one-line description, and the fact that the repo and DB keep the old name, with the reason.
  - Voice: plain, climber vocabulary, no hype.
  - The palette table: token name, hex, use, light and dark.
  - Typography: the system font stack set in `theme.ts`. No web fonts.
  - Icon do's and don'ts: clear space, minimum size, no recoloring outside the tokens, the maskable rules.
  - How to regenerate the assets with `npm run icons`, and which files are generated versus source.
  - A pointer to the research note path for why the name and motif were chosen.

  `README.md` links to it. _Check:_ the file exists with those sections (reviewer reads it). Also `rg -n "docs/brand.md" README.md`.

## Constraints
- No schema change. Don't touch `src/db/` beyond reading it.
- CSP stays as it is. The icons are same-origin files (`img-src 'self'` already allows them).
- `@resvg/resvg-js` is a devDependency. `npm audit --omit=dev` must stay clean.
- Every asset path must work under the `/boulder-log/` base, both in dev and in the built `dist/`.
- Mobile-first: the header must not eat more than about 56 px of a 640 px-tall viewport.

## Out of scope
- Renaming the GitHub repo, the Pages URL, the Dexie DB or the `BoulderLogDatabase` class.
- A service worker or offline caching. The README claims "works offline", but nothing implements it today. That's a separate spec.
- Following the OS dark mode or adding a theme toggle.
- Custom web fonts, a wordmark or logotype beyond plain text, a splash screen or store listing assets.
- Removing the unused Chakra UI dependencies (a separate cleanup).
- Legal trademark checks. Do a manual Google Play and web search for "Matside" before announcing the name, since the research only checked the App Store.

## Open questions
- None.
