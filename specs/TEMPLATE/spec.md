---
status: draft          # draft | approved | done. /run-spec only runs approved specs.
commitment: spec-first # spec-first: frozen after shipping | spec-anchored: kept up to date with the code
---

# <Feature name>

## Goal
One or two sentences: what the climber can do after this ships, and why it matters.

## Context
- Research: `research/<area>/<note>.md` (private repo; link by path, don't paste competitor detail here, this repo is public)
- Relevant code: `src/...`

## Requirements
Each requirement is one observable behavior with a pass/fail check.
A check is a test (`src/.../__tests__/x.test.ts › "name"`), a command, or for UI/audio:
`manual: npm start → <what to do> → <what you should see/hear>`.

- **R1** — <behavior>. _Check:_ <test or manual step>
- **R2** — <behavior, including the edge case>. _Check:_ ...

## Constraints
- Data stays local (IndexedDB via Dexie). Schema change? Say so: it means a new `version()` in `src/db/database.ts` with an upgrade path.
- <performance, offline, accessibility, mobile-first...>

## Out of scope
- <things a reasonable implementer might add but shouldn't>

## Open questions
- <resolved during the interview; empty before approval>
