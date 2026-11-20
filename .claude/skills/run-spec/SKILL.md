---
name: run-spec
description: Execute an approved boulder-log spec task by task with implementer and reviewer subagents, committing each passing task on a feature branch, then run a final spec review. Parallel-safe tasks run in git worktrees.
argument-hint: "<feature-name>"
disable-model-invocation: true
---

You are the orchestrator (planner model). Running this skill is the user's request to spawn the `implementer` and `reviewer` subagents and to commit each passing task on the feature branch. It is not permission to push, merge to master, or open a PR.

Feature: `$ARGUMENTS`. Folder: `specs/active/$ARGUMENTS/`.

## 0. Preflight (stop and report if any fails)
- `tasks.md` exists. If `spec.md` exists, its frontmatter says `status: approved`. (Quick specs have no spec.md.)
- `git status --porcelain` shows nothing outside `specs/`. Don't start on a dirty tree.
- Create or switch to the branch `feature/$ARGUMENTS`: `git switch -c feature/$ARGUMENTS`, or `git switch` if it already exists. Commit the spec files there first (`spec: $ARGUMENTS`).
- Parse the tasks and build the dependency order. Skip tasks that are already committed: `git log --oneline` has `$ARGUMENTS T<n>:`.

## 1. Pick the next batch
- The next batch is the open tasks whose `depends-on` are all committed.
- Run a batch in parallel (worktree mode) only if every task in it has `parallel-safe: yes` and `schema-change: no`, and their allowed files don't overlap. Otherwise take the first one and run it sequentially.
- Tell the user one line per batch, e.g. `T1 (sequential)` or `T3+T4 (parallel worktrees)`.

## 2a. Sequential task (main tree)
1. Spawn `implementer` with the prompt: `Spec folder: specs/active/$ARGUMENTS/. Task: T<n>.` Add the reviewer's findings if this is a retry. The hook runs `npm run verify` when it stops.
2. `git add -A`, then spawn `reviewer`: `Task mode. Spec folder: specs/active/$ARGUMENTS/. Task: T<n>. Diff: git diff --cached in <repo root>.`
3. Read the implementer report, the reviewer verdict, and `git diff --cached --stat`. Do your own sanity check of the diff; you are the more capable model.
4. On PASS, commit with message `$ARGUMENTS T<n>: <summary>`, then a blank line, a body listing `covers: R…`, and the attribution trailer.
5. On FAIL, re-spawn the implementer once with the numbered findings, then review again. If it fails a second time, stop. `git restore --staged .` and leave the changes in place. Report to the user what failed and why. Don't loop.

## 2b. Parallel batch (worktrees)
1. Spawn one `implementer` per task, all in the same message, each with `isolation: "worktree"`. Settings have `worktree.baseRef: head`, so the worktrees branch from the feature branch.
2. Each result names its worktree path and branch. For each one, `git -C <path> add -A`, then spawn `reviewer` (task mode, diff: `git diff --cached` in `<path>`). Reviewers can run in parallel.
3. Commit each PASS inside its worktree (same message format). Then, one at a time on `feature/$ARGUMENTS`:
   - `git cherry-pick <worktree-branch-sha>`
   - `npm run verify`. If it fails after a cherry-pick, the tasks weren't really independent. Report it, fix it as its own commit, and mark the spec's tasks to fix the parallel-safe flags.
   - `git worktree remove <path>` and `git branch -D <worktree-branch>`.
4. FAIL handling is the same as 2a, inside the worktree. If a task still fails, leave its worktree in place for the user to inspect.

## 3. Final spec review (skip for quick specs)
- Spawn `reviewer`: `Spec mode. Spec folder: specs/active/$ARGUMENTS/. Range: master...feature/$ARGUMENTS.`
- Show the user:
  - the requirement table (`R…` → PASS/FAIL)
  - the drift list
  - the commits (`git log --oneline master..`)
  - the `manual:` checks for them to do in `npm start`
- If the spec is `spec-anchored` and drift is intended, propose spec edits. Don't apply them silently.

## 4. Wrap-up (each step only with the user's OK)
- Move the spec folder to `specs/done/` and set `status: done`.
- Push, then open a PR against `master` with `gh pr create`. The PR body links the spec and lists the requirements and manual checks.
- Agent activity log: `.claude/logs/agents.jsonl`.
