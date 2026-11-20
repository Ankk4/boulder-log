#!/usr/bin/env node
// Stop (main session) and SubagentStop (implementer): before Claude ends its turn,
// run `npm run verify` (typecheck + lint + tests) if the working tree has changes.
// On failure, block the stop and hand Claude the failing output. If it already
// retried once (stop_hook_active), let it stop and tell the user instead of looping.
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { ensureDeps } from './lib/ensure-deps.mjs';

// CLI mode for the /run-spec orchestrator: `node verify-on-stop.mjs --check [dir]`.
// Same cache and checks, plain output, exit 1 on failure.
const cli = process.argv[2] === '--check';
let input = '';
if (!cli) for await (const chunk of process.stdin) input += chunk;
const { stop_hook_active = false, cwd = process.cwd(), hook_event_name, agent_type, agent_id } = cli
  ? { cwd: resolve(process.argv[3] ?? process.cwd()), hook_event_name: 'cli' }
  : JSON.parse(input || '{}');
// SubagentStop fires for every agent type; only the implementer writes code.
// (A `matcher` on the settings entry didn't fire in practice, so filter here.)
if (hook_event_name === 'SubagentStop' && agent_type !== 'implementer') process.exit(0);
ensureDeps(cwd);

// One line per gate run in .claude/logs/agents.jsonl, next to log-agents.mjs entries.
const trace = (result) => {
  try {
    const dir = join(process.env.CLAUDE_PROJECT_DIR ?? cwd, '.claude', 'logs');
    mkdirSync(dir, { recursive: true });
    appendFileSync(join(dir, 'agents.jsonl'), JSON.stringify({
      ts: new Date().toISOString(), event: `${hook_event_name ?? 'Stop'}:verify`, agent_type, agent_id, cwd, stop_hook_active, result,
    }) + '\n');
  } catch { /* logging must never get in the way */ }
};

const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8' });

// Only changes that can affect the checks count; docs/.claude edits don't.
const relevant = /^(src\/|index\.html$|package(-lock)?\.json$|tsconfig.*\.json$|vite\.config\.ts$|eslint\.config\.js$)/;
const changed = git('status', '--porcelain', '--untracked-files=all')
  .split('\n')
  .filter(Boolean)
  .map((l) => l.slice(3).split(' -> ').pop())
  .filter((p) => relevant.test(p));
if (changed.length === 0) { trace('skip-no-changes'); process.exit(0); }

// Skip re-running when this exact tree state already passed.
const hash = createHash('sha256')
  .update(git('diff', 'HEAD'))
  .update(changed.sort().map((p) => { try { return p + readFileSync(join(cwd, p)); } catch { return p; } }).join('\0'))
  .digest('hex');
const cacheDir = join(cwd, 'node_modules', '.cache', 'claude-verify');
const stamp = join(cacheDir, 'last-pass');
try { if (readFileSync(stamp, 'utf8') === hash) { trace('skip-cached-pass'); process.exit(0); } } catch { /* no stamp yet */ }

const run = spawnSync('npm', ['run', '-s', 'verify'], { cwd, encoding: 'utf8', env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' } });
if (run.status === 0) {
  mkdirSync(cacheDir, { recursive: true });
  writeFileSync(stamp, hash);
  trace('pass');
  process.exit(0);
}

const output = `${run.stdout}\n${run.stderr}`
  .split('\n')
  .filter((l) => l.trim() && !/MODULE_TYPELESS|Reparsing|trace-warnings|To eliminate/.test(l))
  .slice(-60)
  .join('\n');

if (cli) {
  trace('fail');
  process.stdout.write(`npm run verify failed. Last lines:\n${output}\n`);
  process.exit(1);
}

if (stop_hook_active) {
  trace('fail-gave-up');
  console.log(JSON.stringify({
    systemMessage: 'npm run verify is still failing after a retry; Claude stopped instead of looping. Run `npm run verify` to see the failures.',
  }));
  process.exit(0);
}

trace('fail-block');
console.log(JSON.stringify({
  decision: 'block',
  reason: `npm run verify failed (typecheck, lint, or tests). Fix the cause, not the check, then finish. Last lines:\n${output}`,
}));
