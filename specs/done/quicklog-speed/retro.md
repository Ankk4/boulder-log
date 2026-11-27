# Retro: quicklog-speed

What went wrong while this spec was built, and where the fix landed so it doesn't repeat. One row per mistake.

- `Layer` is the layer that made the mistake: `spec`, `agent`, `tooling` or `orchestrator`.
- `Fix kind`: `hook`, `lint`, `test`, `rule` or `log` (`proposed` while a `--draft-pr` row waits for the user's approval).
- Fix ranking: enforce with a hook, lint rule or test first; otherwise a one-line rule in the file that layer reads; `log` only when the fix is unknown.
- Issues found after merge are appended here later, in the same row format, with `Source` set to e.g. `user after merge`.
- This repo is public: no `research/` content (competitor detail, notes) goes in this file. Link a research note by path if needed.

| # | Source | Mistake | Layer | Fix kind | Where it landed |
|---|--------|---------|-------|----------|-----------------|
| 1 | verify gate (T1) | T1 created `grades.ts` without a consumer, so knip failed with "Unused files". T1's allowed files had to be widened mid-run to include `DifficultySelect.tsx`. | spec | proposed | Proposed: one line in `.claude/skills/spec/SKILL.md` Phase 3: "A task that adds a new module must also add its first importer (app code or a test), or knip fails." |
| 2 | orchestrator review (T1) | `summarizeLastTime` matched on `gradeLabel`, so a colour-only selection skipped past problems that also had a French grade. The task reviewer passed it. Fixed in follow-up 1 with a test. | agent | proposed | Proposed: a test (now in `problemDefaults.test.ts`, "matches colour on problems that also have a French grade"), plus one line in `.claude/agents/reviewer.md`: "For grade matching, check the mixed case: a problem with both a French and a colour grade." |
| 3 | implementer (T3) | T3 changed what `QuickLog` needs from `../../db/index`, but `Session.test.tsx` (which renders QuickLog through a mocked db module) wasn't in the allowed files. Its 32 tests failed, and the file had to be added to T3/T4 mid-run. | spec | proposed | Proposed: one line in `.claude/skills/spec/SKILL.md` Phase 3: "If a task adds a hook to `src/db/index.ts`, list every test that mocks `../../db/index` and renders the consumer in its allowed files." |
| 4 | spec review | `src/__tests__/theme-usage.test.ts` still special-cases the deleted `DifficultySelect.tsx`, and the grade colour literals moved to `src/utils/grades.ts`, which the `.tsx`-only walker doesn't scan. | spec | proposed | Proposed: follow-up commit removing the dead branch and confirming that `grades.ts` is the allowed home for colour literals. |
