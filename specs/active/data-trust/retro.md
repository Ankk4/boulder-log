# Retro: data-trust

What went wrong while this spec was built, and where the fix landed so it doesn't repeat. One row per mistake.

- `Layer` is the layer that made the mistake: `spec`, `agent`, `tooling` or `orchestrator`.
- `Fix kind`: `hook`, `lint`, `test`, `rule` or `log` (`proposed` while a `--draft-pr` row waits for the user's approval).
- Fix ranking: enforce with a hook, lint rule or test first; otherwise a one-line rule in the file that layer reads; `log` only when the fix is unknown.
- Issues found after merge are appended here later, in the same row format, with `Source` set to e.g. `user after merge`.
- This repo is public: no `research/` content (competitor detail, notes) goes in this file. Link a research note by path if needed.

| # | Source | Mistake | Layer | Fix kind | Where it landed |
|---|--------|---------|-------|----------|-----------------|
| 1 | orchestrator follow-up (T4) | `DataCard` rendered "Storage status unknown" before the async storage check resolved; same class as qol-fixes R1 (check-in form flashed while the session loaded) | agent | rule | `.claude/agents/implementer.md`: async-loaded UI starts in a null loading state that renders nothing, with a test of the loading render |
| 2 | orchestrator follow-up (T3) | `download.ts` revoked the object URL right after the click, which can cancel the download; the spec said "revoked after the click" without timing | spec | log | Fixed in T3 (revoke deferred 1 s); no general rule |
| 3 | verify gate (T1) | `npm run verify` crashed once with exit 139 (segfault) and passed on rerun; the gate kept no output to show which step crashed | tooling | log | `verify-on-stop.mjs` now reports the signal and logs the failing tail to `.claude/logs/agents.jsonl` (#30); cause still unknown |
