# Retro: mistake-log

What went wrong while this spec was built, and where the fix landed so it doesn't repeat. One row per mistake.

- `Layer` is the layer that made the mistake: `spec`, `agent`, `tooling` or `orchestrator`.
- `Fix kind`: `hook`, `lint`, `test`, `rule` or `log` (`proposed` while a `--draft-pr` row waits for the user's approval).
- Fix ranking: enforce with a hook, lint rule or test first; otherwise a one-line rule in the file that layer reads; `log` only when the fix is unknown.
- Issues found after merge are appended here later, in the same row format, with `Source` set to e.g. `user after merge`.
- This repo is public: no content from the private research repo (competitor detail, notes) goes in this file.

| # | Source | Mistake | Layer | Fix kind | Where it landed |
|---|--------|---------|-------|----------|-----------------|
| 1 | orchestrator (T2 check) | R10/R11 named `node --test .claude/hooks/__tests__/`, which fails on Node 25 (directory treated as a module) | spec | rule | `.claude/skills/spec/SKILL.md` Phase 2: run each command check once while drafting; spec R10/R11 now use the glob form |
| 2 | reviewer T3 | Reviewer handed back only "placeholder", no verdict | agent | rule | `.claude/skills/run-spec/SKILL.md` Rules line: a report with no PASS/FAIL is not a pass, ask the same agent again |
| 3 | orchestrator (T6 check) | R1 requires the template to mention `research/`, R16 forbids that string in the seeded retro; resolved by rewording there | spec | log | No fix yet |
