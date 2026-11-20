# Tasks: Merge draft (`/run-spec --draft-pr`)

Quick spec (no `spec.md`). Add an opt-in `--draft-pr` flag to `/run-spec`. When every task has passed and the final checks are green, the orchestrator writes the PR body, and a script pushes the feature branch and opens a **draft** PR against `master`. No model runs the push or the PR; that part is a deterministic script. Without the flag, `/run-spec` behaves exactly as it does today.

> **Executor: main session, not `implementer`.** Every file this task changes is under `.claude/` or is `CLAUDE.md`, and `scope-guard.mjs` blocks implementers from `.claude/` on purpose. Don't run this with `/run-spec`. The main session implements it, then spawns `reviewer` in task mode on the staged diff. Don't loosen scope-guard to make `/run-spec` work.

## T1 — `--draft-pr` flag and `open-pr.mjs` script
- covers: [T1]
- allowed files: `.claude/skills/run-spec/SKILL.md`, `.claude/hooks/lib/open-pr.mjs` (new), `CLAUDE.md`
- check:
  1. `node --check .claude/hooks/lib/open-pr.mjs` passes, and `npx eslint .claude/hooks/lib/open-pr.mjs` reports nothing (or says the file is ignored; if so, say which).
  2. Refusals. Each of these exits non-zero with a one-line reason and runs no `git push` or `gh` command:
     - On `master`: `node .claude/hooks/lib/open-pr.mjs --title t --body-file <f> --dry-run`.
     - On a `feature/*` branch with an uncommitted change in a tracked file.
     - A body file containing `research/`.
     - A commit in `origin/master..HEAD` whose message contains `research/` (make one on a throwaway `feature/x` branch, then delete it).
     - A missing or empty body file, or no `--title`.
  3. Happy path, dry run: on a clean `feature/*` branch, `--dry-run` prints the push command and the `gh pr create --draft …` command it would run, and exits 0 without running either.
  4. Skill text: `rg -n 'ARGUMENTS' .claude/skills/run-spec/SKILL.md` shows the arguments parsed once (feature name = first word, `--draft-pr` detected); the folder path and branch name use the parsed feature name, never raw `$ARGUMENTS`.
  5. `npm run verify` passes (nothing in `src/` changes; this only confirms nothing broke).
  6. manual: a real push and draft PR happen only on the next `/run-spec <feature> --draft-pr`. Say so in the report.
- tests to add: none under `src/`. Vitest only collects `src/**` (`vite.config.ts`), and widening that is out of scope. Check 2 and 3 stand in for tests.
- parallel-safe: no
- schema-change: no
- depends-on: []
- notes:
  - **`open-pr.mjs`** (Node ESM, no dependencies, same style as the other hooks: `execFileSync`/`spawnSync`, never a shell string).
    - Usage: `node .claude/hooks/lib/open-pr.mjs --title "<title>" --body-file <path> [--base master] [--dry-run]`.
    - Refuses, in this order, with exit 1 and a one-line reason on stderr:
      1. Missing `--title`, or the body file is missing or empty.
      2. The current branch is not `feature/*`.
      3. `git status --porcelain --untracked-files=no` is non-empty.
      4. `node .claude/hooks/verify-on-stop.mjs --check .` fails. This is instant when the pass stamp matches.
      5. **Public-repo guard**: the body or any commit message in `origin/<base>..HEAD` contains `research/`. The repo is public and `research/` is private (see `CLAUDE.md`). Run `git fetch origin <base>` first so the range is correct.
    - Then: `git push -u origin <branch>`. If `gh pr list --head <branch> --state open --json url` already returns a PR, print its URL and exit 0 without editing it. Otherwise run `gh pr create --draft --base <base> --head <branch> --title … --body-file …` and print the URL.
    - `--dry-run` runs every refusal check, then prints the two commands it would run instead of running them.
    - It never merges, never marks the PR ready, never force-pushes, and never pushes to any branch other than the current `feature/*`.
  - **`SKILL.md` (run-spec)**:
    - `argument-hint`: `"<feature-name> [--draft-pr]"`.
    - Near the top: parse `$ARGUMENTS` once. The feature name is the first word; `--draft-pr` may appear anywhere after it. Use the parsed name everywhere below (folder, branch, commit prefix). Replace the other seven `$ARGUMENTS` uses.
    - The opening paragraph's "not permission to push … or open a PR" stays true without the flag. Add: with `--draft-pr`, the command is also the user's OK to move the spec to `specs/done/`, push the feature branch and open a **draft** PR, but never to merge or mark it ready.
    - Step 4: with `--draft-pr`, run it automatically **only if** every task is committed with a reviewer PASS and the step 3 spec review (if any) has no FAIL rows. Otherwise stop and report as today, and say that the PR was skipped and why. Steps:
      1. Move the folder to `specs/done/` (set `status: done` if `spec.md` exists) and commit it as `<feature>: mark spec done`.
      2. Write the PR body to the scratchpad. It holds the spec link, the requirement table, anything not verified, and the manual checks, as in today's step 4. End it with the PR attribution line from the system reminder.
      3. Run `node .claude/hooks/lib/open-pr.mjs --title "<title>" --body-file <path>`. If it refuses, show the reason and stop; don't work around it.
      4. Show the PR URL. Say that the PR is a draft and that marking it ready or merging is the user's call.
    - Without the flag, step 4 is unchanged.
  - **`CLAUDE.md`**, "Agent workflow" section: one line saying `/run-spec <feature> --draft-pr` opens a draft PR via `open-pr.mjs` when everything passed, and that without the flag nothing is pushed.
  - Reuse: `verify-on-stop.mjs --check` for the gate. Don't reimplement verify.
