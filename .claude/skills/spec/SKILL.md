---
name: spec
description: Write a boulder-log feature spec (specs/active/<feature>/spec.md + tasks.md) through an interview, a draft, and a task split, with user approval between phases. Use when the user wants to spec, plan or design a feature or QoL fix for agents to implement. "quick" makes a single-task spec for small fixes.
argument-hint: "[quick] <feature-name> [short description]"
---

You are the planner. You are the expensive model in this workflow; spend effort on getting the spec right so the cheap implementers don't have to guess.

Arguments: `$ARGUMENTS`. If the first word is `quick`, use the quick path. The next word is the feature name (kebab-case it); the rest is the description. If no name was given, ask for one.

Templates: `specs/TEMPLATE/spec.md` and `specs/TEMPLATE/tasks.md`. Output folder: `specs/active/<feature>/`.

## Quick path (small QoL fixes)
Use only if the change touches ≤ 3 source files and the expected behavior is obvious; otherwise tell the user it needs the full path.
1. Look at the code involved (use `scout` for broad searches if needed).
2. Write `specs/active/<feature>/tasks.md` with a single task T1, which states the behavior and its check. No `spec.md`.
3. Show the task and ask the user to confirm, then tell them to run `/run-spec <feature>`.

## Full path

### Phase 1: Interview
- Read relevant `research/` notes (`research/README.md` is the index) and the code the feature touches. For broad codebase sweeps, delegate to the `scout` agent (cheap, read-only).
- Interview the user with AskUserQuestion: the climber's goal, behaviors, edge cases (empty data, very long sessions, offline, mobile), what's out of scope, whether the data model changes. Ask only what you can't answer from the code or research. 1–3 rounds.

### Phase 2: Draft spec
- Write `spec.md` from the template with `status: draft`. Every requirement has an ID and a pass/fail check. UI/audio behavior gets a `manual:` check.
- Pick `commitment`: `spec-anchored` for core features you'll keep evolving, `spec-first` for one-off changes.
- Never paste competitor detail into the spec; link the research note path (this repo is public).
- Show the user a short summary (requirements list + out of scope) with the file path. Wait for approval. When they approve, set `status: approved`.

### Phase 3: Split into tasks
- Write `tasks.md` from the template. Name the existing helpers to reuse in each task's notes (e.g. `src/utils/duration.ts`, `src/utils/validation.ts`, `src/db/index.ts`).
- Check coverage: every `R…` appears in some `covers`. Mark `parallel-safe` and `schema-change` honestly; any Dexie `version()` bump is `schema-change: yes`.
- Show the task table (id, summary, covers, parallel-safe, depends-on).
- Tell the user: run `/clear`, then `/run-spec <feature>`, so implementation starts from the files and not this conversation.

Do not implement anything in this skill.
