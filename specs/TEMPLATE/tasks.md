# Tasks: <Feature name>

Rules for splitting:
- One task = one implementer run = one commit. Aim for ≤ 3 source files plus tests.
- Every requirement in `spec.md` appears in at least one task's `covers`.
- `parallel-safe: yes` only if the task's allowed files overlap no other open task, it has no unmet `depends-on`, and `schema-change: no`.
- Notes cite R-IDs and don't restate requirements; if a note and `spec.md` conflict, the requirement wins.
- The `check` is the narrowest thing that proves the task, e.g. `npx vitest run src/utils/__tests__/grades.test.ts`.
- `runner: planner` (default `implementer`) when any allowed file matches `protectedForImplementer` in `.claude/hooks/scope-guard.mjs`. The orchestrator does those tasks itself; they are never parallel-safe.

## T1 — <one-line summary>
- covers: [R1]
- runner: implementer
- allowed files: `src/utils/grades.ts`, `src/utils/__tests__/grades.test.ts`
- check: `npx vitest run src/utils/__tests__/grades.test.ts`
- tests to add: <what they assert>
- parallel-safe: yes
- schema-change: no
- depends-on: []
- notes: <hints for the implementer: existing helpers to reuse, pitfalls>

## T2 — <one-line summary>
- covers: [R2]
- runner: implementer
- allowed files: `src/components/X.tsx`, `src/pages/Session.tsx`, `src/pages/__tests__/Session.test.tsx`
- check: `npx vitest run src/pages/__tests__/Session.test.tsx`
- tests to add: ...
- parallel-safe: no
- schema-change: no
- depends-on: [T1]
- notes: ...
