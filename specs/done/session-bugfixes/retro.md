# Retro: session-bugfixes

What went wrong while this spec was built, and where the fix landed so it doesn't repeat. One row per mistake.

- `Layer` is the layer that made the mistake: `spec`, `agent`, `tooling` or `orchestrator`.
- `Fix kind`: `hook`, `lint`, `test`, `rule` or `log` (`proposed` while a `--draft-pr` row waits for the user's approval).
- Fix ranking: enforce with a hook, lint rule or test first; otherwise a one-line rule in the file that layer reads; `log` only when the fix is unknown.
- Issues found after merge are appended here later, in the same row format, with `Source` set to e.g. `user after merge`.
- This repo is public: no `research/` content (competitor detail, notes) goes in this file. Link a research note by path if needed.
- If nothing went wrong, delete the table and keep only the `No issues.` line below; otherwise delete that line.

| # | Source | Mistake | Layer | Fix kind | Where it landed |
|---|--------|---------|-------|----------|-----------------|
| 1 | verify-gate failure, preflight | Stashing the dirty `.gitignore` re-exposed `docs/diagrams/`. The `.git/info/exclude` workaround hid it from git but not from Prettier, so `format:check` failed twice on a file the run never touched. Fixed by committing the `.gitignore` change on the branch (`chore: ignore local diagrams`). | orchestrator | rule | `.claude/skills/run-spec/SKILL.md`, preflight: commit a dirty `.gitignore` on the feature branch, don't stash it. |
| 2 | implementer report, T1 | The implementer didn't run the new tests against the old code to confirm they fail without the fix. | agent | log | Unknown if it recurs. If it does, add "for a bugfix, show the new test failing before the fix" to the implementer prompt. |
