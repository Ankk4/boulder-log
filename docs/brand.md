# Matside brand guide

## Name

- Spelled **Matside**, one word, capital M. Never "MatSide" or "Mat Side".
- `short_name`: Matside.
- Description: an offline-first PWA for logging bouldering sessions, problems, attempts, benchmarks and everything related to the sport.
- The repo (`boulder-log`), the `/boulder-log/` deploy path and the IndexedDB database name (`boulderLog`) keep the old name. Renaming them would change the app URL and orphan users' stored data.

## Voice

Plain and direct. Use climber vocabulary (session, problem, attempt, flash, send). No hype, no exclamation marks.

## Palette

Source of truth: `src/theme/brand.ts`.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| primary | `#3F4A52` | `#A9B4BC` | App bar, primary actions |
| primaryContrast | `#F7F4EF` | `#1C1F22` | Text on primary |
| secondary | `#C47F4A` | `#E0A574` | Accents |
| secondaryContrast | `#1C1F22` | `#1C1F22` | Text on secondary |
| background | `#F7F4EF` | `#1C1F22` | Page background |
| paper | `#FFFFFF` | `#26292D` | Cards, surfaces |
| textPrimary | `#1C1F22` | `#F7F4EF` | Body text |
| textSecondary | `#4A545B` | `#B8C0C6` | Secondary text |

## Typography

System font stack set in `src/theme/theme.ts`: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`. No web fonts.

## Icon do's and don'ts

- Keep clear space around the mark; do not crowd it with other elements.
- Do not show it below 16 px (favicon); use the 192 px or larger PNGs elsewhere.
- Do not recolor outside the palette tokens above.
- Maskable icon: keep the whole mark inside the central safe zone (about 80% of the canvas) and fill the full background, since platforms crop it to a shape.

## Regenerating assets

Run `npm run icons`. Source files: the SVG masters in `assets/brand/`. Generated files in `public/`: `favicon.svg`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`. Do not edit generated files by hand.

## Why this name and motif

See `research/competitors/naming-and-icons.md` (private research repo).
