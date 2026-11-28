# Retro: rework-undo

What went wrong while this spec was built, and where the fix landed so it doesn't repeat. One row per mistake.

- `Layer` is the layer that made the mistake: `spec`, `agent`, `tooling` or `orchestrator`.
- `Fix kind`: `hook`, `lint`, `test`, `rule` or `log` (`proposed` while a `--draft-pr` row waits for the user's approval).
- Fix ranking: enforce with a hook, lint rule or test first; otherwise a one-line rule in the file that layer reads; `log` only when the fix is unknown.
- Issues found after merge are appended here later, in the same row format, with `Source` set to e.g. `user after merge`.
- This repo is public: no `research/` content (competitor detail, notes) goes in this file. Link a research note by path if needed.

| # | Source | Mistake | Layer | Fix kind | Where it landed |
|---|--------|---------|-------|----------|-----------------|
| 1 | orchestrator | `git add -A` after T1 staged an unrelated untracked spec folder (`specs/active/ui-a11y-pass/`); caught and unstaged before commit. | orchestrator | rule | `.claude/skills/run-spec/SKILL.md` §2a.3: stage the task's allowed files by path |
| 2 | tooling | T2's `sed -i` edit of `specs/done/*.md` was denied by auto mode; the edits were redone with the Edit tool after asking the user. | orchestrator | log | Prefer the Edit tool for `runner: planner` text edits |
| 3 | user (manual check) | The first InlineNotice was plain grey caption text with a faint text Undo, easy to miss on dark cards. Tests passed; only a screenshot showed it. Restyled as a tinted strip with an icon and outlined Undo, plus a 150 ms enter animation. | spec | log | The spec named roles and sizes but no visual treatment; UI specs should state the visual treatment in the requirement or a `manual:` check |
