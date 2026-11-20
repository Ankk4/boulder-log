# Tasks: Better README

Quick spec (no `spec.md`). The README is the GitHub front page. Rework it to follow common open-source practice: a live app link and badges at the top, a GPLv3 license, and the AI disclaimer replaced by a neutral "How it's built" section. A self-hosted coverage badge needs a small `deploy.yml` change.

## T1 — README rework, GPLv3 license, self-hosted coverage badge
- covers: [T1]
- allowed files: `README.md`, `LICENSE`, `.github/workflows/deploy.yml`
- check:
  1. `npm run verify` passes. No source changes, so this only confirms nothing broke.
  2. `npx vitest run --coverage --coverage.reporter=json-summary --coverage.reporter=text-summary` writes `coverage/coverage-summary.json`. Run the badge snippet from the workflow locally against it (with `dist/` created), and it prints valid JSON with `schemaVersion: 1`, `label: "coverage"` and a `message` like `NN%`. Delete `coverage/` and `dist/` afterwards.
  3. `head -3 LICENSE` shows `GNU GENERAL PUBLIC LICENSE` / `Version 3, 29 June 2007`, and `wc -l LICENSE` is about 674.
  4. `npx --yes actionlint .github/workflows/deploy.yml` reports no errors. If actionlint can't be fetched, say so and paste the edited step instead.
  5. manual: the GitHub rendering (badges resolve, links work) can only be checked after merge to master. Say so in the report.
- tests to add: none (docs and CI only).
- parallel-safe: yes
- schema-change: no
- depends-on: []
- notes:
  - **Behavior: README**, top to bottom:
    1. `# Boulder Notes` plus a one-line tagline: an offline-first PWA for logging bouldering sessions, problems and attempts.
    2. Badge row:
       - Deploy status: `https://github.com/Ankk4/boulder-log/actions/workflows/deploy.yml/badge.svg?branch=master`, linking to that workflow's page
       - CI: `.../actions/workflows/ci.yml/badge.svg`
       - Coverage: `https://img.shields.io/endpoint?url=https://ankk4.github.io/boulder-log/coverage-badge.json`
       - License: `https://img.shields.io/badge/license-GPLv3-blue.svg`, linking to `LICENSE`
    3. A prominent **Live app** link to `https://ankk4.github.io/boulder-log/`, with a note that it installs as a PWA and works offline.
    4. **Features**: keep the current content but condense the nested bullets into a short scannable list (Sessions, Problems & attempts, Stats, Offline storage).
    5. **Privacy**: keep the existing paragraph and the SECURITY.md link as they are.
    6. **Getting started**: prerequisites (Node 20+) plus `npm install` and `npm start`. Drop "or yarn"; the repo uses npm with a lockfile.
    7. **Scripts** table: `start`, `build`, `verify` (typecheck + lint + tests, the definition of done), `test:coverage`, `verify:full`.
    8. **Tech stack**: one line or a short list.
    9. **How it's built**: 3–5 sentences, neutral and factual, not apologetic. Development is AI-assisted with Claude Code. Features are specced in `specs/` (`/spec`) and implemented by subagents (`/run-spec`). Every change is gated by `npm run verify` in hooks and CI. Point to the "Agent workflow" section of `CLAUDE.md`. This replaces the ⚠️ disclaimer banner, so remove the banner entirely.
    10. **Contributing / security notes**: move the existing "Security notes for contributors" bullets here unchanged.
    11. **Roadmap**: the existing "Future Features" list.
    12. **License**: "GNU General Public License v3.0. See [LICENSE](LICENSE)." plus one plain sentence: you may use, modify and redistribute it, but derivative works must also be GPLv3 and ship their source.
  - Don't invent features, screenshots or numbers that aren't in the repo. No hard-coded coverage %.
  - **LICENSE**: download the canonical text with `curl -fsSL https://www.gnu.org/licenses/gpl-3.0.txt -o LICENSE`. Don't type it from memory. If the download fails, stop and report.
  - **deploy.yml** (build job): add two steps after `Build with Vite` and before `Upload artifact`:
    1. `npx vitest run --coverage --coverage.reporter=json-summary`. The CLI reporter flag avoids touching `vite.config.ts`, which implementers may not edit.
    2. A `node -e` (or `node --input-type=module -e`) snippet. It reads `coverage/coverage-summary.json`, takes `total.lines.pct`, and writes `dist/coverage-badge.json` as `{"schemaVersion":1,"label":"coverage","message":"<pct rounded>%","color":<"brightgreen" ≥80, "yellow" ≥60, else "red">}`.
    - Keep the existing `npm run verify` step; it's the gate. Don't touch `ci.yml`.
  - Follow-up outside implementer scope: `package.json` is protected from implementers. The main session should add `"license": "GPL-3.0-only"` after this task (or in the commit).
