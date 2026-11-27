# Retro: ui-a11y-pass

What went wrong while this spec was built, and where the fix landed so it doesn't repeat. One row per mistake.

- `Layer` is the layer that made the mistake: `spec`, `agent`, `tooling` or `orchestrator`.
- `Fix kind`: `hook`, `lint`, `test`, `rule` or `log` (`proposed` while a `--draft-pr` row waits for the user's approval).
- Fix ranking: enforce with a hook, lint rule or test first; otherwise a one-line rule in the file that layer reads; `log` only when the fix is unknown.
- Issues found after merge are appended here later, in the same row format, with `Source` set to e.g. `user after merge`.
- This repo is public: no `research/` content (competitor detail, notes) goes in this file. Link a research note by path if needed.
- If nothing went wrong, delete the table and keep only the `No issues.` line below; otherwise delete that line.

| # | Source | Mistake | Layer | Fix kind | Where it landed |
|---|--------|---------|-------|----------|-----------------|
| 1 | orchestrator, batch 1 | `isolation: "worktree"` failed for all 8 tasks: `EACCES` creating `.claude/` under the main repo path when the session itself runs in a herdr worktree. The run fell back to sequential, with the user's OK. | tooling | proposed | Proposed: `/run-spec` preflight checks that worktree creation works (or that the session isn't already in a linked worktree) and picks sequential mode up front. |
| 2 | implementer, T1 | tasks.md said `src/theme/__tests__/` was empty and named the test `theme.test.tsx`, but `theme.test.ts` already exists there. A `.tsx` with the same basename is dropped by tsc and the ESLint project service, so the test became `themeTypography.test.tsx`. | spec | proposed | Proposed: `.claude/skills/spec/SKILL.md`, Phase 3: `ls` the test folder before naming a new test file, and never reuse an existing basename with a different extension. |
| 3 | implementer, T4 | T4 needed a `WorkoutFormDialog` prop for the R9 save alert, but that file belonged to T5. The spec anticipated the stop, and tasks.md was amended mid-run (user OK). | spec | proposed | Proposed: `.claude/skills/spec/SKILL.md`, Phase 3: when an alert or error must render inside another component's dialog, give that component's file to the same task. |
| 4 | reviewer, T6 | The visually-hidden sx used `width: 1, height: 1`, which MUI `sx` reads as 100%. T2's skip link had the same bug (fixed in 12a7ee1). The tasks.md snippet said `1px`, but the agents translated it to sx numbers. | agent | proposed | Proposed: a lint rule (`no-restricted-syntax` on `sx` objects with `clip` plus a numeric `width: 1`), or a one-line rule in `.claude/agents/implementer.md`: in `sx`, write px sizes as strings; `1` means 100%. |
| 5 | implementer, T6 | The implementer edited files with a Python script. That bypassed the post-edit Prettier and ESLint hooks and the spirit of `block-inplace-edit.mjs`, which only catches `sed -i`/`perl -i`. | tooling | proposed | Proposed: extend `.claude/hooks/block-inplace-edit.mjs` to block `python`/`node` one-liners that write files under `src/`. |
