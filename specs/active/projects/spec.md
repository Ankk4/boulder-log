---
status: draft
commitment: spec-anchored
---

# Projects

## Goal
A climber can keep a list of problems they're working on across sessions. Each one has a status (wishlist, projecting, sent, shelved), and logging it in a session links the attempts. When it goes, the app shows how many sessions and attempts it took.

## Context
- Research: `research/tracking/progress-records-and-projects.md` §2 (projects with statuses, sessions-to-send), `research/tracking/evidence-self-monitoring-goals-motivation.md` (process goals and milestones)
- Relevant code: `src/db/database.ts` (schema v2), `src/db/index.ts`, `src/types/index.ts`, `src/components/QuickLog.tsx`, `src/utils/backup.ts`, `src/pages/Home.tsx`, `src/App.tsx`
- **Precondition:** `quicklog-speed` and `ux-sessions` have shipped (QuickLog dialog and session detail page).

## Requirements
- **R1**: There's a new `projects` table: `id, name, frenchGrade, colorGrade, status, gym?, notes?, createdAt, updatedAt`, with status one of `wishlist | projecting | sent | shelved`. `SessionProblem` gets an optional `projectId`. A Dexie `version(3)` adds the table and indexes `problems.projectId`; existing data loads unchanged. _Check:_ `src/db/__tests__/database.test.ts` › "v3 upgrade keeps v2 data", "adds the projects table"
- **R2**: A Projects page (`/projects`) lists projects grouped by status, with projecting first. You can add, edit, change the status of and delete a project. Delete uses undo (as elsewhere), and deleting a project never deletes logged problems; it only clears their `projectId`. _Check:_ `src/pages/__tests__/Projects.test.tsx` › "groups by status", "adds a project", "changes status", "delete keeps the logged problems"
- **R3**: The QuickLog add dialog has "Log a project" with a picker over wishlist and projecting projects. Choosing one fills in the name and grades and sets `projectId`. Logging a wishlist project moves it to projecting. _Check:_ `QuickLog.test.tsx` › "logs a project", "wishlist becomes projecting when logged"
- **R4**: A send or flash on a linked problem offers "Mark project sent" (one tap, undoable). It's never automatic. _Check:_ `QuickLog.test.tsx` › "offers mark sent on a project send"
- **R5**: `projectStats(project, problems)` in `src/utils/projects.ts` returns the sessions tried, total attempts, first and last tried dates, and sessions-to-send (counted up to and including the session where it went). _Check:_ `src/utils/__tests__/projects.test.ts` › "counts sessions and attempts", "sessions to send includes the sending session", "zero for an untried project"
- **R6**: JSON backup includes projects and `projectId`, and restore round-trips them. An older backup without projects still restores. _Check:_ `backup.test.ts` › "round-trips projects", "restores a v2 backup"
- **R7**: Projects is reachable from Home, and the page works at 360 px. _Check:_ `manual: npm start → Home → Projects at 360 px → add a project, log it in a session, mark sent → stats show sessions to send`
- **R8**: No skipped or focused tests are added. _Check:_ `git diff master...HEAD -- . ':!specs' | rg '^\+.*\b(it|test|describe)\.(skip|only)\('` prints nothing

## Constraints
- **Schema change:** Dexie `version(3)` with an upgrade path; the schema tasks are `schema-change: yes`.
- The bottom nav stays at 3 tabs unless you decide otherwise (see open questions).
- Stats are derived and never stored.

## Out of scope
- Photos or beta videos of a problem.
- Shared or public projects, and outdoor crag or route databases.
- Reset tracking: gyms reset problems, so "shelved" covers a removed problem for now.
- Reminders.

## Open questions
- Navigation: a 4th bottom tab, a Home card, or a section in History?
- Should a project carry a gym/wall field now, given gym resets? Or keep the model minimal?
- When a gym resets the set, should it auto-shelve or ask?
- Should logging the same project twice in one session be allowed?
- Is "sessions-to-send" the main number you'd want, or attempts-to-send?
