# Retro: ux-sessions

What went wrong while this spec was built, and where the fix landed so it doesn't repeat. One row per mistake.

- `Layer` is the layer that made the mistake: `spec`, `agent`, `tooling` or `orchestrator`.
- `Fix kind`: `hook`, `lint`, `test`, `rule` or `log` (`proposed` while a `--draft-pr` row waits for the user's approval).
- Fix ranking: enforce with a hook, lint rule or test first; otherwise a one-line rule in the file that layer reads; `log` only when the fix is unknown.
- Issues found after merge are appended here later, in the same row format, with `Source` set to e.g. `user after merge`.
- This repo is public: no `research/` content (competitor detail, notes) goes in this file. Link a research note by path if needed.

| # | Source | Mistake | Layer | Fix kind | Where it landed |
|---|--------|---------|-------|----------|-----------------|
| 1 | orchestrator | Worktree isolation failed (EACCES: the main checkout is root-owned in this sandbox), so every task ran sequentially in the main tree. | tooling | proposed | Proposed: `/run-spec` §2b preflight tries one worktree and falls back to sequential with a one-line notice. |
| 2 | verify gate (T2) | T2 added read hooks before their consumers existed, so knip failed on unused exports. Hooks were moved to T6/T9 mid-run. | spec | proposed | Proposed rule in `/spec` task split: an export lands in the same task as its first non-test consumer. |
| 3 | orchestrator (T3) | The reviewer passed T3 although the check-in groups didn't match R9's structure (two headings, five panels). | agent | proposed | Proposed rule in `reviewer.md`: compare UI structure (headings, groups, order) to the requirement text, not only the named tests. |
| 4 | verify gate (T4) | The T4 implementer reported verify passing from filtered output, and Prettier was failing. | agent | proposed | Proposed rule in `implementer.md`: report `npm run verify` from its exit code, never from filtered output. (The orchestrator's own gate caught it.) |
| 5 | orchestrator (T4, T5) | The reviewer missed missing pointer capture in the snackbar swipe (T5) and an `aria-label` overriding the bar's accessible name (T4). | agent | proposed | Proposed rule in `reviewer.md`: for gesture or a11y code, check pointer capture and the computed accessible name. |
| 6 | reviewer (T6) | "starts a new session" didn't assert R8's absent fields although the spec's check names that test. | agent | proposed | Proposed rule in `implementer.md`: a check that says "(updated: …)" needs an assertion of exactly that. |
| 7 | orchestrator (T9, T10) | New UI text rendered "1 attempts" and "1 sends" (same plural slip as T4). | agent | proposed | Proposed: a shared `plural(n, word)` helper in `src/utils/` with a test, and a reviewer rule to check singular counts. |
| 8 | reviewer (T9) | The detail page Back button pushed `/session?view=history`, so phone back bounced to the detail page. | agent | proposed | Proposed rule in `implementer.md`: in-app Back buttons use `navigate(-1)` with a replace fallback for direct loads. |
| 9 | orchestrator (T7, T10) | Implementers edited source with Python scripts, bypassing the per-edit Prettier/ESLint hooks (verify still caught everything). | tooling | proposed | Proposed: extend `block-inplace-edit.mjs` to block `python`/`node -e` writes into `src/`. |
| 10 | reviewer (T8) | The undo-End test can't tell whether the undo callback restores the draft, because a rerender reloads it from the mock. Pre-existing; not fixed here. | agent | proposed | Proposed `log`: tighten the test in a later spec. |
| 11 | reviewer (T7) | Legacy sessions with unsanitized goals could misalign `achievedGoals` after a goal is removed during the session. Edge case; not fixed. | agent | proposed | Proposed: seed the live check-in from `sanitizeGoals` in a later fix. |
