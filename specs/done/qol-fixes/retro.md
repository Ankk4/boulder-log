# Retro: qol-fixes

What went wrong while this spec was built, and where the fix landed so it doesn't repeat. One row per mistake.

- `Layer` is the layer that made the mistake: `spec`, `agent`, `tooling` or `orchestrator`.
- `Fix kind`: `hook`, `lint`, `test`, `rule` or `log` (`proposed` while a `--draft-pr` row waits for the user's approval).
- Fix ranking: enforce with a hook, lint rule or test first; otherwise a one-line rule in the file that layer reads; `log` only when the fix is unknown.
- Issues found after merge are appended here later, in the same row format, with `Source` set to e.g. `user after merge`.
- This repo is public: no `research/` content (competitor detail, notes) goes in this file. Link a research note by path if needed.

| # | Source | Mistake | Layer | Fix kind | Where it landed |
|---|--------|---------|-------|----------|-----------------|

| 1 | implementer report (T3) | Implementer edited `WorkoutFormDialog.tsx` with `sed`, which bypassed the Edit/Write Prettier hook; its first `npm run verify` failed `format:check` (it fixed this itself) | agent | hook | `.claude/hooks/block-inplace-edit.mjs` blocks `sed -i`/`perl -i` for the implementer; rule in `.claude/agents/implementer.md` (#30) |
| 2 | orchestrator (preflight) | Local `master` was behind `origin/master` (PR #28 merged remotely), so the spec wasn't on local master and branching from it would have been wrong; caught by hand and fixed with fetch + fast-forward | orchestrator | rule | `.claude/skills/run-spec/SKILL.md` §0: fetch and fast-forward `master` before branching (#30) |
