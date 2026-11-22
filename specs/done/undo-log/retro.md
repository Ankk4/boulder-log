# Retro: undo-log

What went wrong while this spec was built, and where the fix landed so it doesn't repeat. One row per mistake.

- `Layer` is the layer that made the mistake: `spec`, `agent`, `tooling` or `orchestrator`.
- `Fix kind`: `hook`, `lint`, `test`, `rule` or `log` (`proposed` while a `--draft-pr` row waits for the user's approval).
- Fix ranking: enforce with a hook, lint rule or test first; otherwise a one-line rule in the file that layer reads; `log` only when the fix is unknown.
- Issues found after merge are appended here later, in the same row format, with `Source` set to e.g. `user after merge`.
- This repo is public: no `research/` content (competitor detail, notes) goes in this file. Link a research note by path if needed.
- If nothing went wrong, delete the table and keep only the `No issues.` line below; otherwise delete that line.

| # | Source | Mistake | Layer | Fix kind | Where it landed |
|---|--------|---------|-------|----------|-----------------|
| 1 | orchestrator, T1 verify gate | The verify check was piped through `tail`, so `$?` reported tail's exit code, not the check's. Caught and rerun correctly before commit. | orchestrator | rule | `.claude/skills/run-spec/SKILL.md`, step 2a: write the output to a file and read `$?` from the check itself. |
| 2 | orchestrator, T1+T2 cleanup | The shell was left inside the T1 worktree, which was then removed. The next command failed, and the T3 implementer found its working folder gone and fell back to the main tree. | orchestrator | rule | `.claude/skills/run-spec/SKILL.md`, step 2b: clean up with `git -C <repo root>`, never from inside a worktree. |
