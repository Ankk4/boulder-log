# Tasks: Post-session review

Rules for splitting:
- One task = one implementer run = one commit. Aim for ≤ 3 source files plus tests.
- Every requirement in `spec.md` appears in at least one task's `covers`.
- `parallel-safe: yes` only if the task's allowed files overlap no other open task, it has no unmet `depends-on`, and `schema-change: no`.
- Notes cite R-IDs and don't restate requirements; if a note and `spec.md` conflict, the requirement wins.
- The `check` is the narrowest thing that proves the task, e.g. `npx vitest run src/utils/__tests__/grades.test.ts`.
- `runner: planner` (default `implementer`) when any allowed file matches `protectedForImplementer` in `.claude/hooks/scope-guard.mjs`. The orchestrator does those tasks itself; they are never parallel-safe. If one edits `.claude/`, expect a permission prompt and say so in its notes.

## T1 — Review type and sanitizer
- covers: [R1, R2]
- runner: implementer
- allowed files: `src/types/index.ts`, `src/utils/validation.ts`, `src/utils/__tests__/validation.test.ts`
- check: `npx vitest run src/utils/__tests__/validation.test.ts`
- tests to add: a `describe("sanitizePostSessionReview")` block with one case per R2 rule (clamping and rounding ratings, `null` kept, trim/drop-empty/length cap/count cap for both lists, out-of-range and duplicate `achievedGoals` dropped).
- parallel-safe: no
- schema-change: no
- depends-on: []
- notes:
  - Add `PostSessionReview` to `src/types/index.ts` and `postSessionReview?: PostSessionReview` to `Session` (R1). Don't touch `src/db/database.ts`.
  - Signature: `sanitizePostSessionReview(review: PostSessionReview, goalCount: number): PostSessionReview`. Reuse `clampNumber` and `truncate`. Add `reviewItem: 200` and `maxReviewItems: 20` to `LIMITS`.
  - Don't add an "empty review" constant here; T2 defines it where it's used (an unused export would fail Knip). `sanitizePostSessionReview` counts as used through its test.

## T2 — Inline review section on the active session
- covers: [R3, R4, R6]
- runner: implementer
- allowed files: `src/components/PostSessionReview.tsx`, `src/pages/Session.tsx`, `src/pages/__tests__/Session.test.tsx`
- check: `npx vitest run src/pages/__tests__/Session.test.tsx`
- tests to add: a `describe("post-session review")` block with the R3 full-flow test (pick RPE 7 and energy 4, add an item to each list, tick goal index 1 of a two-goal session, type notes, End → `db.sessions.put` payload) and both R4 tests (End untouched → nulls and empty lists; `goals: []` → no goal checkbox).
- parallel-safe: no
- schema-change: no
- depends-on: [T1]
- notes:
  - `PostSessionReview.tsx` is a controlled component: props `value: PostSessionReview`, `goals: string[]`, `onChange`. The notes box stays in `Session.tsx` (R3 keeps it; just place the section above it).
  - Pickers: an exclusive MUI `ToggleButtonGroup` with buttons 1–10 gives the R3 "unset and clearable" behaviour (clicking the selected button yields `null`), and is tap-friendly at 360px (R6). Let it wrap (`flexWrap: 'wrap'`) rather than scroll. Give each group an `aria-label` ("RPE", "Energy after") so tests can find them with `getByRole('group', { name })`.
  - Item lists: copy the goal-chip pattern from `PreSessionForm.tsx` (Enter to add, chip `onDelete`), plus an Add button; don't edit `PreSessionForm.tsx`. Both lists use the same small inner function or a second component **in its own file** (`react-refresh/only-export-components`), which would be a fourth file; prefer an inner function inside `PostSessionReview.tsx`.
  - Define the empty review (nulls, empty lists) as a module-level constant in `Session.tsx`, next to `defaultPreSessionData`.
  - In `endSession`, save `postSessionReview: sanitizePostSessionReview(review, currentSession.preSessionData.goals.length)`. Reset the review state together with `postSessionNotes`, only after the put succeeds (the session-bugfixes T1 pattern already in `endSession`).
  - The Session test file mocks `@mui/material` partially (Dialogs only); ToggleButton and Checkbox are real.

## T3 — Persist the review draft on the active session
- covers: [R5]
- runner: implementer
- allowed files: `src/pages/Session.tsx`, `src/pages/__tests__/Session.test.tsx`
- check: `npx vitest run src/pages/__tests__/Session.test.tsx`
- tests to add: the three R5 tests (a change writes the draft; a remount with a draft-bearing session shows it; End → Start → empty review).
- parallel-safe: no
- schema-change: no
- depends-on: [T2]
- notes:
  - On every review or notes change, write `{ postSessionReview, postSessionNotes }` to the active session with `db.sessions.update(currentSession.id, …)`. Add `update: vi.fn<typeof db.sessions.update>()` to `mockDb.sessions` in the test. Log and swallow write errors like the other handlers do.
  - `useCurrentSession` is a live query, so each write re-emits the session. Initialise local state from `currentSession.postSessionReview` / `postSessionNotes` **only when `currentSession.id` changes** (track the loaded id), not on every emission, or typing will fight the round trip.
  - End's `put` still saves the sanitized review (T2). The draft writes may store the unsanitized-but-input-capped values; End is the source of truth.
  - The R5 manual check (navigate away and reload) is for the user; mention it in the report.

## T4 — Show the review in History
- covers: [R7]
- runner: implementer
- allowed files: `src/components/PastSessionsList.tsx`, `src/components/__tests__/PastSessionsList.test.tsx`
- check: `npx vitest run src/components/__tests__/PastSessionsList.test.tsx`
- tests to add: the three R7 cases (full review; `rpe: null` and empty lists; no `postSessionReview` at all).
- parallel-safe: yes
- schema-change: no
- depends-on: [T1]
- notes:
  - Add the lines inside the existing `secondary` `Box`, after Goals, using the same `Typography component="span" variant="body2" sx={{ display: 'block' }}` pattern.
  - Energy before comes from `session.preSessionData.energyLevel`. Show `Energy: 5 → 3`; omit the line if `energyAfter` is `null`.
  - `Goals achieved: x/y` uses `achievedGoals.length` / `preSessionData.goals.length`; omit it when there are no goals.
  - The test file already mocks `../../db` with a hoisted `orderBy`; make `toArray` resolve the fixture sessions.
