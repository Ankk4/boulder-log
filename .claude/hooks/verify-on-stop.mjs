#!/usr/bin/env node
// Stop: before Claude ends its turn, run `npm run verify` (typecheck + lint + tests)
// if the working tree has changes. On failure, block the stop and hand Claude the
// failing output. If it already retried once (stop_hook_active), let it stop and
// tell the user instead of looping.
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

let input = '';
for await (const chunk of process.stdin) input += chunk;
const { stop_hook_active = false, cwd = process.cwd() } = JSON.parse(input || '{}');

const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8' });

// Only changes that can affect the checks count; docs/.claude edits don't.
const relevant = /^(src\/|index\.html$|package(-lock)?\.json$|tsconfig.*\.json$|vite\.config\.ts$|eslint\.config\.js$)/;
const changed = git('status', '--porcelain', '--untracked-files=all')
  .split('\n')
  .filter(Boolean)
  .map((l) => l.slice(3).split(' -> ').pop())
  .filter((p) => relevant.test(p));
if (changed.length === 0) process.exit(0);

// Skip re-running when this exact tree state already passed.
const hash = createHash('sha256')
  .update(git('diff', 'HEAD'))
  .update(changed.sort().map((p) => { try { return p + readFileSync(join(cwd, p)); } catch { return p; } }).join('\0'))
  .digest('hex');
const cacheDir = join(cwd, 'node_modules', '.cache', 'claude-verify');
const stamp = join(cacheDir, 'last-pass');
try { if (readFileSync(stamp, 'utf8') === hash) process.exit(0); } catch { /* no stamp yet */ }

const run = spawnSync('npm', ['run', '-s', 'verify'], { cwd, encoding: 'utf8', env: { ...process.env, FORCE_COLOR: '0' } });
if (run.status === 0) {
  mkdirSync(cacheDir, { recursive: true });
  writeFileSync(stamp, hash);
  process.exit(0);
}

const output = `${run.stdout}\n${run.stderr}`
  .split('\n')
  .filter((l) => l.trim() && !/MODULE_TYPELESS|Reparsing|trace-warnings|To eliminate/.test(l))
  .slice(-60)
  .join('\n');

if (stop_hook_active) {
  console.log(JSON.stringify({
    systemMessage: 'npm run verify is still failing after a retry; Claude stopped instead of looping. Run `npm run verify` to see the failures.',
  }));
  process.exit(0);
}

console.log(JSON.stringify({
  decision: 'block',
  reason: `npm run verify failed (typecheck, lint, or tests). Fix the cause, not the check, then finish. Last lines:\n${output}`,
}));
