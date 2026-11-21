# Retro: upgrade

What went wrong while this spec was built, and where the fix landed so it doesn't repeat. One row per mistake.

- `Layer` is the layer that made the mistake: `spec`, `agent`, `tooling` or `orchestrator`.
- `Fix kind`: `hook`, `lint`, `test`, `rule` or `log` (`proposed` while a `--draft-pr` row waits for the user's approval).
- Fix ranking: enforce with a hook, lint rule or test first; otherwise a one-line rule in the file that layer reads; `log` only when the fix is unknown.
- Issues found after merge are appended here later, in the same row format, with `Source` set to e.g. `user after merge`.
- This repo is public: no `research/` content (competitor detail, notes) goes in this file. Link a research note by path if needed.
- If nothing went wrong, delete the table and keep only the `No issues.` line below; otherwise delete that line.

| # | Source | Mistake | Layer | Fix kind | Where it landed |
|---|--------|---------|-------|----------|-----------------|
| 1 | reviewer FAIL on T6 | `npm install -D` moved `react` and `react-dom` from `dependencies` to `devDependencies`, and the orchestrator missed it. | orchestrator | rule | `.claude/skills/run-spec/SKILL.md`, step 2: check `git diff package.json` after any install. |
| 2 | orchestrator, T3 | `eslint-plugin-react-hooks` 5 only allows ESLint 9, so ESLint 10 could not install. The spec left it on 5 until T5, which forced a plan change and an interim lint config. | spec | rule | `.claude/skills/spec/SKILL.md`, Phase 3: bump a plugin host with its plugins and check their `peerDependencies`. |
| 3 | orchestrator, T2 | The combined `npm install vite@8 plugin-react@6 …` hit ERESOLVE. Installing the host first and the plugins second worked. | tooling | rule | The bump recipe in `tasks.md` and `.claude/skills/spec/SKILL.md`, Phase 3: install the host first. |
| 4 | orchestrator, T10 | The spec and tasks named `jsdom` 29 and `react-router` 7, but R4 asks for "latest", and newer majors had shipped by run time. Approval was needed to bump. | spec | rule | `.claude/skills/spec/SKILL.md`, Phase 3: name packages, not majors; the `latest` check is the source of truth. |
| 5 | orchestrator, final review | The R8 grep `\.skip\(` matched the timer's `result.current.skip()`, a false positive. | spec | rule | The R8 check in `spec.md`, and `.claude/skills/spec/SKILL.md`, Phase 2: anchor the pattern on `it`, `test` or `describe`. |
| 6 | permission denials | The lockfile diff, the `node_modules` `.d.ts` read and `npx @mui/codemod` were denied. The lockfile diff needed a manual run, and the MUI edits were made by hand. | tooling | log | Unknown fix. Read-only `git diff` could go on the allowlist with `/fewer-permission-prompts`, which is the user's call. |
