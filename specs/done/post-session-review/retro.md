# Retro: post-session-review

What went wrong while this spec was built, and where the fix landed so it doesn't repeat. One row per mistake.

- `Layer` is the layer that made the mistake: `spec`, `agent`, `tooling` or `orchestrator`.
- `Fix kind`: `hook`, `lint`, `test`, `rule` or `log` (`proposed` while a `--draft-pr` row waits for the user's approval).
- Fix ranking: enforce with a hook, lint rule or test first; otherwise a one-line rule in the file that layer reads; `log` only when the fix is unknown.
- Issues found after merge are appended here later, in the same row format, with `Source` set to e.g. `user after merge`.
- This repo is public: no `research/` content (competitor detail, notes) goes in this file. Link a research note by path if needed.
- If nothing went wrong, delete the table and keep only the `No issues.` line below; otherwise delete that line.

| # | Source | Mistake | Layer | Fix kind | Where it landed |
|---|--------|---------|-------|----------|-----------------|
| 1 | orchestrator, preflight | The first run stopped on an untracked `docs/diagrams/`. Its ignore rule was already on `origin/master`, but the local master was behind. The run started only after the user said to pull. | orchestrator | proposed | `.claude/skills/run-spec/SKILL.md` preflight: run `git pull --ff-only` on master before the clean-tree check. |
| 2 | user, invocation | The run was invoked with `--draft`, but the skill recognizes only `--draft-pr`, so the orchestrator had to stop and ask. | tooling | proposed | `.claude/skills/run-spec/SKILL.md` arguments: accept `--draft` as an alias for `--draft-pr`. |
| 3 | reviewer note, T3 | The problem-log and status handlers in `Session.tsx` `put` a spread `currentSession`. One that fires before the live query re-emits can write an older review draft back to the DB. Local state and End are unaffected. The spec didn't anticipate this when it added draft writes. | spec | proposed | Follow-up: have those handlers `update` only the fields they change. `log` until then. |
