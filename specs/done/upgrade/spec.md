---
status: done       # draft | approved | done. /run-spec only runs approved specs.
commitment: spec-first # spec-first: frozen after shipping | spec-anchored: kept up to date with the code
---

# Upgrade

## Goal
The app runs on a supported Node, with every dependency on its current major and `npm audit` clean. The climber sees the same app afterwards. Node 20 went end of life in April 2026, and `npm audit` currently reports 17 vulnerabilities (2 critical in vitest/tinypool, 2 high in vite and source-map-js). The audit gate only checks production deps at `high` or above, so none of these block a deploy.

## Context
- No research note; this is maintenance.
- Node: `.github/workflows/ci.yml` and `deploy.yml` pin `node-version: '20'`. There is no `.nvmrc` and no `engines`. `README.md` says "Node.js 20+".
- Node 26 (Lithium) has been Active LTS since Oct 2026. Node 24 is maintenance LTS.
- TypeScript stays on 6.0.x, not 7: `typescript-eslint@8.73` declares the peer range `typescript >=4.8.4 <6.1.0`.
- Probe (2026-11-21, scratch worktree, every dep at latest, TS 6.0.3): `npm audit` shows 0 vulnerabilities, all 59 tests pass at runtime, `vite build` works, knip is clean. Fallout:
  - **MUI 9**, about 40 type errors in `PageHeader`, `PastSessionsList`, `PreSessionForm`, `QuickLog`, `WorkoutFormDialog`, `Session`, `WorkoutRun` and `Workouts`. System props on `Stack`/`Typography`/`Box` (`mb=`, `alignItems=` …) are gone; they move into `sx`. `inputProps` on `TextField` becomes `slotProps.htmlInput`.
  - **jest-dom 8**: matcher types no longer attach to Vitest via the bare import (`toBeInTheDocument` does not exist; `no-unsafe-call` in tests). The fix is `import '@testing-library/jest-dom/vitest'` in `src/setupTests.ts`.
  - **React Router 7**: `navigate()` can return a Promise, which gives 7 `no-floating-promises` findings (`Layout`, `Home`, `WorkoutRun`, `Workouts`).
  - **eslint-plugin-react-hooks 7**: the recommended set now includes React Compiler rules. 4 findings:
    - `refs` and `immutability` in `src/hooks/useIntervalTimer.ts`
    - `set-state-in-effect` in `src/components/WorkoutFormDialog.tsx`
    - `purity` (`Date.now()` in render) in `src/pages/Session.tsx`
  - **Dexie 4**: no type or test fallout. `Table<T>` still works.
- `useIntervalTimer.ts` (277 lines, rAF loop and beeps) has no test today.

## Requirements
- **R1**: Node 26 is the single pinned version.
  - `.nvmrc` contains `26`.
  - `package.json` has `"engines": { "node": ">=26" }`.
  - Both workflows read `node-version-file: .nvmrc` and have no literal `node-version:`.
  - `README.md` prerequisites say Node.js 26+.
  - _Check:_ `test "$(cat .nvmrc)" = 26 && node -p "require('./package.json').engines.node" | grep -qx '>=26' && ! rg -n 'node-version:' .github/workflows && test "$(rg -l 'node-version-file: .nvmrc' .github/workflows | wc -l)" = 2 && rg -q 'Node.js 26\+' README.md`
- **R2**: `@types/node` is on major 26, matching the runtime. _Check:_ `node -p "require('./node_modules/@types/node/package.json').version.split('.')[0]"` prints `26`
- **R3**: The workflow actions are on their current majors: `actions/checkout@v7`, `actions/setup-node@v7`, `actions/upload-pages-artifact@v5`, `actions/deploy-pages@v5`. _Check:_ `! rg -n 'uses: actions/(checkout|setup-node)@v[0-6]\b|upload-pages-artifact@v[0-4]\b|deploy-pages@v[0-4]\b' .github/workflows`
- **R4**: Every direct dependency is on the major that npm tags `latest`. The one exception is `typescript`, which is on 6.0.x (see Context). _Check:_ this exits 0:
  ```
  npm outdated --json | node -e 'const o=JSON.parse(require("fs").readFileSync(0,"utf8")||"{}");const m=v=>String(v).split(".")[0];const bad=Object.entries(o).filter(([n,i])=>n!=="typescript"&&m(i.current)!==m(i.latest)).map(([n,i])=>n+" "+i.current+" -> "+i.latest);const ts=require("./node_modules/typescript/package.json").version;if(!ts.startsWith("6.0."))bad.push("typescript "+ts+" (want 6.0.x)");if(bad.length){console.error(bad.join("\n"));process.exit(1)}'
  ```
- **R5**: `react-router-dom` is replaced by `react-router` (v7 ships the DOM bindings in `react-router`). Every floating `navigate()` promise is handled, not just `void`-ed blind (see the T6 notes). _Check:_ `! rg -n 'react-router-dom' src package.json` and `npm run lint`
- **R6**: `npm audit` reports 0 vulnerabilities at any severity, with dev deps included. _Check:_ `npm audit` exits 0
- **R7**: The audit gate covers dev deps at `moderate` and above:
  - `verify:full` runs `npm audit --audit-level=moderate` (no `--omit=dev`)
  - `ci.yml` has an audit step with the same command
  - `deploy.yml` replaces its `--omit=dev --audit-level=high` step with it
  - _Check:_ `! rg -n 'omit=dev|audit-level=high' package.json .github/workflows && rg -c 'npm audit --audit-level=moderate' package.json .github/workflows/ci.yml .github/workflows/deploy.yml` (3 files, 1 each)
- **R8**: The lint and type bar is unchanged.
  - `eslint.config.js` still uses `strictTypeChecked` and the full react-hooks 7 recommended set, compiler rules included (nothing turned off or downgraded).
  - No suppressions file and no new escape hatches.
  - _Check:_ `git diff master...HEAD -- src eslint.config.js 'tsconfig*.json' vite.config.ts | rg -n '^\+.*(eslint-disable|@ts-ignore|@ts-expect-error|as any|\b(it|test|describe)\.(skip|only)\()'` prints nothing; `test ! -e eslint-suppressions.json`; `rg -n "strictTypeChecked" eslint.config.js`; reviewer confirms no react-hooks rule is set to `off`/`warn`
- **R9**: No test is weakened or deleted, and the test count does not drop below 59.
  - _Check:_ `f=$(mktemp --suffix=.json); npx vitest run --reporter=json --outputFile=$f >/dev/null; node -e "const r=require('$f');process.exit(r.numPassedTests>=59&&r.numPendingTests===0&&r.numFailedTests===0?0:1)"`
  - Reviewer: `git diff master...HEAD -- 'src/**/__tests__/**'` removes no `expect` lines except mechanical import or API renames
- **R10**: `useIntervalTimer` gets a behavior test **before** its React Compiler lint fix. The test passes on the old code and, unchanged, on the new code.
  - It covers, with fake timers and a stubbed `requestAnimationFrame`/`performance.now` and `playBeep` mocked:
    - prepare → work → rest → next interval → done
    - pause/resume keeps the remaining time
    - skip
    - abort
    - mute is passed to `playBeep`
  - _Check:_ `npx vitest run src/hooks/__tests__/useIntervalTimer.test.ts` passes on the commit that adds it, and on HEAD with the test file unchanged since (`git log --oneline -- src/hooks/__tests__/useIntervalTimer.test.ts` shows one commit)
- **R11**: Dexie 4 opens the same schema. There is no new `version()` and no store change. _Check:_ `git diff master...HEAD -- src/db/database.ts | rg -n '^\+.*(\.version\(|stores\()'` prints nothing; `npx vitest run src/pages/__tests__/Session.test.tsx`
- **R12**: Everything passes on Node 26. _Check:_ `node -v` starts with `v26.`, then `npm ci && npm run verify:full` exits 0
- **R13**: The app looks and behaves the same in the browser. _Check:_ `manual:` `npm start`, Node 26, then:
  - Home renders. Start a session, log a few problems/attempts, end it, and it shows in past sessions.
  - Reload, and the data is still there (Dexie 4).
  - Workouts: create, edit (the dialog pre-fills the existing values, which covers the `set-state-in-effect` fix), delete.
  - Run an interval workout through prepare/work/rest with sound on, then pause, resume, skip and mute. Beeps and counts match the old build.
  - Session elapsed minutes still update (the `purity` fix).
  - Spacing, alignment and typography match `master` side by side, for the MUI system-props migration (the user judges).
- **R14**: The production build works under the Pages base path. _Check:_ `manual:` `npm run build && npx vite preview`, then open `/boulder-log/workouts` directly and reload: the page loads and there are no console errors.

## Constraints
- **Before `/run-spec`, the user switches local Node to 26** (e.g. `mise use -g node@26`). Local is v25 today, which is end of life. The orchestrator checks `node -v` and stops if it is not v26. Nothing mise-specific is committed.
- Branch from an up-to-date `master`. Local `master` is behind `origin/master`, which has PR #24 merged, so run `git pull` on master first.
- No schema change. Dexie 4 reads Dexie 3 databases as they are. There is only test data, so no migration check against a real DB is needed.
- `package.json`/`package-lock.json` are scope-guarded, so every task runs as `runner: planner`, in order, one commit each. Each commit passes `npm run verify`.
- Use `npm install <pkg>@<major>` and commit the regenerated lockfile. Never `npm audit fix --force` (it picks versions on its own) and never hand-edit the lockfile.
- If a fix seems to need a rule turned off, an `overrides` entry or a pinned-back version, stop and ask; don't loosen the bar (R8).

## Out of scope
- TypeScript 7. It is blocked by the typescript-eslint peer range and gets its own spec when that range opens.
- The Vite "chunk larger than 500 kB" warning. It already exists on `master`; code-splitting is a separate change.
- Adopting React 19 or MUI 9 features (Actions, `use()`, the compiler Babel plugin, Pigment CSS, new components), beyond what the fallout needs.
- Renaming the `package.json` `name` (`matside`) or bumping the app version.
- Raising `target`/`lib` in tsconfig (ES2020) or changing `browserslist`.
- Renovate or Dependabot config.

## Open questions
- (none)
