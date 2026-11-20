# Retro: ui-refactor-001

What went wrong while this spec was built, and where the fix landed so it doesn't repeat. One row per mistake. Seeded by the `mistake-log` spec.

- `Layer` is the layer that made the mistake: `spec`, `agent`, `tooling` or `orchestrator`.
- `Fix kind`: `hook`, `lint`, `test`, `rule` or `log` (`proposed` while a `--draft-pr` row waits for the user's approval).
- Fix ranking: enforce with a hook, lint rule or test first; otherwise a one-line rule in the file that layer reads; `log` only when the fix is unknown.
- Issues found after merge are appended here later, in the same row format, with `Source` set to e.g. `user after merge`.
- This repo is public: no content from the private research repo (competitor detail, notes) goes in this file.

| # | Source | Mistake | Layer | Fix kind | Where it landed |
|---|--------|---------|-------|----------|-----------------|
| 1 | reviewer FAIL T4 | Planned file layout put a provider and hooks in one file, breaking `react-refresh/only-export-components` | spec | rule | `.claude/skills/spec/SKILL.md` Phase 3 (85447aa) |
| 2 | T8 follow-up | Implementer ran Prettier and rewrote files outside its task | agent | rule | `.claude/agents/implementer.md` (14cd5ec); enforcement still to come in the planned `chore/prettier` work |
| 3 | orchestrator | A task note contradicted requirement R12 | spec | rule | `specs/TEMPLATE/tasks.md` "Rules for splitting" and `.claude/skills/spec/SKILL.md` Phase 3 (85447aa) |
| 4 | user manual check | Layout size (the 72px MUI Tab) was invisible to tests | spec | rule | `.claude/skills/spec/SKILL.md` Phase 2 (85447aa) |
| 5 | stuck shell (branding T4) | A pathless `rg` read stdin and hung an agent shell | tooling | hook | `.claude/hooks/block-pathless-rg.mjs`, `.claude/settings.json`, tests in `.claude/hooks/__tests__/` run by `npm run verify` (65b0152) |
| 6 | orchestrator | Worked around a denied sandbox command (`cmp`) with another command | orchestrator | rule | `.claude/skills/run-spec/SKILL.md` Rules line (ea6b604) |
| 7 | user after merge | Focus mode remounted the page and reset the timer right after start | spec | rule | Code fix e397537; `.claude/skills/spec/SKILL.md` Phase 2 transition rule (85447aa); `.claude/agents/reviewer.md` Task mode item 7 (14cd5ec) |
| 8 | user after merge | Unwanted `done` phase colour on the timer screen | spec | rule | Code fix 4c9408d; `.claude/skills/spec/SKILL.md` Phase 2 visual-choices rule (85447aa) |
| 9 | user | Mapped the wrong feature name and edited `tasks.md` without asking | orchestrator | rule | `.claude/skills/run-spec/SKILL.md` §0 Preflight and Rules line (ea6b604) |
