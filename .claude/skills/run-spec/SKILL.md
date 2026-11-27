---
name: run-spec
description: Execute an approved boulder-log spec task by task with implementer and reviewer subagents, committing each passing task on a feature branch, then run a final spec review. Parallel-safe tasks run in git worktrees.
argument-hint: "<feature-name> [--draft-pr]"
disable-model-invocation: true
---

You are the orchestrator (planner model). Running this skill is the user's request to spawn the `implementer` and `reviewer` subagents and to commit each passing task on the feature branch. It is not permission to push, merge to master, or open a PR, unless `--draft-pr` is given (see step 4). Even then it never merges and never marks a PR ready.

Arguments: `$ARGUMENTS`. The first word is the feature name, written `<feature>` below. If `--draft-pr` appears after it, the draft-PR wrap-up is on. Folder: `specs/active/<feature>/`.

Rules for every step: if a tool call or command is denied, ask the user; don't substitute another command for it. Never edit `spec.md` or `tasks.md` during a run without the user's OK. A subagent report with no PASS/FAIL verdict is not a pass: SendMessage the same agent for the full report.

## 0. Preflight (stop and report if any fails)
- If `<feature>` doesn't exactly match a folder in `specs/active/`, list the folders and ask; never guess.
- `tasks.md` exists. If `spec.md` exists, its frontmatter says `status: approved`. (Quick specs have no spec.md.)
- `git status --porcelain` shows nothing outside `specs/`. Don't start on a dirty tree.
  - A dirty `.gitignore` gets committed on the feature branch (with the user's OK), not stashed: stashing it re-exposes ignored files to Prettier, and `.git/info/exclude` doesn't hide them from it.
- `git fetch origin` and `git merge --ff-only origin/master` on `master`, so the branch starts from the merged state.
- Create or switch to the branch `feature/<feature>`: `git switch -c feature/<feature>`, or `git switch` if it already exists. Commit the spec files there first (`spec: <feature>`).
- Parse the tasks and build the dependency order. Skip tasks that are already committed: `git log --oneline` has `<feature> T<n>:`.

## 1. Pick the next batch
- The next batch is the open tasks whose `depends-on` are all committed.
- Run a batch in parallel (worktree mode) only if every task in it has `parallel-safe: yes` and `schema-change: no`, and their allowed files don't overlap. A `runner: planner` task is never parallel. Otherwise take the first one and run it sequentially.
- Tell the user one line per batch, e.g. `T1 (sequential)` or `T3+T4 (parallel worktrees)`.

## 2a. Sequential task (main tree)
1. Spawn `implementer` with the prompt: `Spec folder: specs/active/<feature>/. Task: T<n>.`
   - `runner: planner` task (its files are protected by scope-guard): spawn no implementer. Make the edits yourself in the main tree, only in the task's allowed files. Steps 2–6 are unchanged; where they say "send to the implementer", fix it yourself, within the same budget.
2. **Verify gate (you enforce it).** When the implementer returns, run `node .claude/hooks/verify-on-stop.mjs --check <tree>` yourself (it runs `npm run verify`, exits 1 with the failing lines). Don't trust the report's "verify passed".
   - Send its output to a file and read `$?` from the check itself, never through a pipe like `| tail`.
   - After any `npm install`, read `git diff package.json`: a package must stay in the section (`dependencies` or `devDependencies`) it was in. Install runtime packages without `-D`.
   - The `SubagentStop` hook can't stop a background agent (it has already handed back), but its pass stamp makes your `--check` instant on a green tree.
   - On failure, send the last ~40 lines of output to the same implementer with SendMessage, so it keeps its context. Wait, then verify again.
3. `git add -A`, then spawn `reviewer`: `Task mode. Spec folder: specs/active/<feature>/. Task: T<n>. Diff: git diff --cached in <repo root>.`
4. Read the implementer report, the reviewer verdict, and `git diff --cached --stat`. Do your own sanity check of the diff; you are the more capable model.
5. On PASS, commit with message `<feature> T<n>: <summary>`, then a blank line, a body listing `covers: R…`, and the attribution trailer.
6. On FAIL, send the numbered findings to the same implementer with SendMessage, then repeat the verify gate and review.
   - Budget: at most 2 follow-ups per task, counting verify and review failures together.
   - Over budget, stop. `git restore --staged .` and leave the changes in place. Report to the user what failed and why. Don't loop.

## 2b. Parallel batch (worktrees)
1. Spawn one `implementer` per task, all in the same message, each with `isolation: "worktree"`. Settings have `worktree.baseRef: head`, so the worktrees branch from the feature branch.
2. Each result names its worktree path and branch (`worktree-agent-<id>`). For each one:
   - Run the verify gate from 2a in that path: `node .claude/hooks/verify-on-stop.mjs --check <path>`. `node_modules` is already linked in by the hooks; if it's missing, run `node .claude/hooks/lib/ensure-deps.mjs <path>`.
   - `git -C <path> add -A`, then spawn `reviewer` (task mode, diff: `git diff --cached` in `<path>`). Reviewers can run in parallel.
3. Commit each PASS inside its worktree (same message format). Then, one at a time on `feature/<feature>`:
   - `git cherry-pick <worktree-branch-sha>`
   - `npm run verify`. If it fails after a cherry-pick, the tasks weren't really independent. Report it, fix it as its own commit, and mark the spec's tasks to fix the parallel-safe flags.
   - `git worktree remove <path>` and `git branch -D <worktree-branch>`. If the agent has finished but the worktree is still locked, use `git worktree remove -f -f <path>`.
   - Run cleanup from the repo root with `git -C <repo root>`; never `cd` into a worktree you will remove.
4. FAIL handling is the same as 2a, inside the worktree. If a task still fails, leave its worktree in place for the user to inspect.

## 3. Final spec review (skip for quick specs)
- Spawn `reviewer`: `Spec mode. Spec folder: specs/active/<feature>/. Range: master...feature/<feature>.`
- Show the user:
  - the requirement table (`R…` → PASS/FAIL)
  - the drift list
  - the commits (`git log --oneline master..`)
  - the `manual:` checks for them to do in `npm start`
- If the spec is `spec-anchored` and drift is intended, propose spec edits. Don't apply them silently.

## 4. Wrap-up
Without `--draft-pr`, do each step only with the user's OK:
- **Retro**, before the move. Copy `specs/TEMPLATE/retro.md` to `specs/active/<feature>/retro.md`. Collect candidate rows from this run: reviewer FAILs, verify-gate failures, your own follow-ups and fixes, and issues the user reported. For each row propose a fix ranked per the template (hook, lint or test first, then a one-line rule where that layer reads it, `log` if unknown), and ask the user to approve, edit or drop it. Apply the approved fixes, fill the table, and commit as `<feature>: retro`. If nothing went wrong, `retro.md` holds only the `No issues.` line.
- Move the spec folder to `specs/done/`. If `spec.md` exists, set its `status: done` (quick specs have no spec.md; the move is enough).
- Push, then open a PR against `master` with `gh pr create`. The PR body links the spec and lists the requirements and manual checks.

With `--draft-pr`, the command is the user's OK for these steps, but only if every task is committed with a reviewer PASS and the step 3 spec review (if any) has no FAIL rows. Otherwise stop and report as above, and say the PR was skipped and why.
1. **Retro**, hands-off: write `specs/active/<feature>/retro.md` from the template with the same candidate rows, but set every `Fix kind` to `proposed` and apply no fixes; the user approves them later. Commit as `<feature>: retro`.
2. Move the spec folder to `specs/done/` (set `status: done` if `spec.md` exists) and commit it as `<feature>: mark spec done`.
3. Write the PR body to a file in the scratchpad: the spec link, the requirement table, the proposed retro rows for the user to approve, anything not verified, and the manual checks. End it with the PR attribution line from the system reminder.
4. Run `node .claude/hooks/lib/open-pr.mjs --title "<title>" --body-file <path>`. It checks the branch, a clean tree, `npm run verify` and the `research/` guard, then pushes and opens a **draft** PR (or prints the one already open). If it refuses, show the reason and stop. Don't work around it.
5. Show the PR URL. Say it is a draft and that marking it ready or merging is the user's call.

Issues found after merge (bugs the user hits later) are appended to the shipped spec's `specs/done/<feature>/retro.md` in the same row format, with their fix.

Agent activity log: `.claude/logs/agents.jsonl`.
