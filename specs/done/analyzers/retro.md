# Retro: analyzers

What went wrong while this spec was built, and where the fix landed so it doesn't repeat. One row per mistake.

- `Layer` is the layer that made the mistake: `spec`, `agent`, `tooling` or `orchestrator`.
- `Fix kind`: `hook`, `lint`, `test`, `rule` or `log` (`proposed` while a `--draft-pr` row waits for the user's approval).
- Fix ranking: enforce with a hook, lint rule or test first; otherwise a one-line rule in the file that layer reads; `log` only when the fix is unknown.
- Issues found after merge are appended here later, in the same row format, with `Source` set to e.g. `user after merge`.
- This repo is public: no `research/` content (competitor detail, notes) goes in this file. Link a research note by path if needed.

| # | Source | Mistake | Layer | Fix kind | Where it landed |
|---|--------|---------|-------|----------|-----------------|
| 1 | reviewer FAIL (T3) | Implementer added try/catch error handling without tests for the error paths | agent | rule | `.claude/agents/implementer.md`: every new `catch`/`.catch` gets an error-path test |
| 2 | orchestrator self-check (T4) | Reviewer passed T4 without running the suppressions shrink check; judged it from the diff | agent | rule | `.claude/agents/reviewer.md` task mode item 2: run every `check:` command verbatim |
| 3 | orchestrator (T6–T10) | Orchestrator added an ad-hoc "lessons" note (typed mocks, test each catch) to implementer prompts instead of fixing the agent definition | orchestrator | rule | `.claude/agents/implementer.md`: typed `db` mocks rule (plus row 1); prompts stay standard |
| 4 | implementer (T8) | T8 notes said to use a `knip.json` from the spec Context, but spec.md had none | spec | rule | `.claude/skills/spec/SKILL.md`: confirm anything a task note cites from spec.md exists |
| 5 | reviewer (T10) | R4's diff-grep check matched the spec's own Markdown, so it could never pass as written | spec | rule | `.claude/skills/spec/SKILL.md`: diff-grep checks exclude `specs/` |
