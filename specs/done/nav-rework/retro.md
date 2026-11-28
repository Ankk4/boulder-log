# Retro: nav-rework

What went wrong while this spec was built, and where the fix landed so it doesn't repeat. One row per mistake.

- `Layer` is the layer that made the mistake: `spec`, `agent`, `tooling` or `orchestrator`.
- `Fix kind`: `hook`, `lint`, `test`, `rule` or `log` (`proposed` while a `--draft-pr` row waits for the user's approval).
- Fix ranking: enforce with a hook, lint rule or test first; otherwise a one-line rule in the file that layer reads; `log` only when the fix is unknown.
- Issues found after merge are appended here later, in the same row format, with `Source` set to e.g. `user after merge`.
- This repo is public: no `research/` content (competitor detail, notes) goes in this file. Link a research note by path if needed.

| # | Source | Mistake | Layer | Fix kind | Where it landed |
|---|--------|---------|-------|----------|-----------------|
| 1 | implementer (T3) | The sandbox denies reads of `**/dist`, so vitest and eslint can't load. T3 reported a "broken install" and stopped; T1 and T2 ran checks unsandboxed; reviewers ran no checks. | tooling | proposed | Proposed: sandbox read exception for `node_modules/**/dist` (user, via `/sandbox`), plus a rule in `implementer.md` and `reviewer.md`: ERR_MODULE_NOT_FOUND under `dist/` is the sandbox, report it as such. |
| 2 | orchestrator (T3) | The implementer edited `Layout.tsx` and its test with a Python script, bypassing the per-edit Prettier/ESLint hooks. Repeat of ux-sessions retro row 9, which was never applied. | tooling | proposed | Proposed: extend `block-inplace-edit.mjs` to block `python`/`node -e` writes into `src/`, with a test. |
| 3 | orchestrator (preflight) | The herdr worktree branch had been cut from `feature/rework-undo`'s spec commit, not master; preflight assumes a plain checkout. | tooling | proposed | Proposed rule in `/run-spec` §0: if `git log master..HEAD` is not empty, branch `feature/<feature>` from `master`. |
| 4 | implementer (T2) | T2 deleted three Session tests the spec didn't name; all exercised the removed History button. The reviewer judged them obsolete. | spec | proposed | Proposed rule in `/spec` task split: when a task removes a UI control, grep the tests for it and list every test to be deleted. |
| 5 | user | The orchestrator and two implementers ran commands with `dangerouslyDisableSandbox`; auto mode approved them silently and the user wasn't told plainly. | orchestrator | proposed | Proposed rule in `/run-spec` and the agent files: name each unsandboxed command and why in the same message, and point to `/sandbox`. User option: `sandbox.allowUnsandboxedCommands: false`. |
| 6 | orchestrator (rebase) | After rework-undo (#45) merged, the orchestrator resolved the `Session.tsx` conflict and rewrote "switching to History clears the inline undo" as "leaving the page clears the inline undo", folded into the T2 commit with no reviewer pass (verify passed). | orchestrator | proposed | Proposed rule in `/run-spec`: a conflict resolution after rebase goes through `reviewer` task mode before push. |
