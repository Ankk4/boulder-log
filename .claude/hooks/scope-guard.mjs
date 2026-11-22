#!/usr/bin/env node
// PreToolUse (Edit|Write|MultiEdit|NotebookEdit|Read|Grep|Glob): limit what each
// subagent may write, and what the researcher may read.
// Settings-level hooks also fire inside subagents, with `agent_type` set to the
// agent's name. The main session (no agent_type) is never restricted here.
//
// Writes:
//   researcher  -> only research/ (the private research repo)
//   reviewer    -> nothing (it reports, it doesn't fix)
//   implementer -> anything except checks/config/specs, so it can't loosen a
//                  check to get green or rewrite the spec it's measured against
// Reads (Read/Grep/Glob):
//   researcher  -> only inside the project
//
// Exit 2 blocks the call and sends the reason back to the agent.
import { execFileSync } from 'node:child_process';
import { existsSync, realpathSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';

let input = '';
for await (const chunk of process.stdin) input += chunk;
const { agent_type, tool_name, tool_input = {}, cwd = process.cwd() } = JSON.parse(input || '{}');

if (!agent_type) process.exit(0);

// Resolves symlinks through the nearest existing ancestor, so a link inside the
// project that points outside it is caught, even when the leaf doesn't exist.
const real = (p) => {
  let head = p;
  const tail = [];
  while (!existsSync(head) && dirname(head) !== head) {
    tail.unshift(basename(head));
    head = dirname(head);
  }
  return join(realpathSync(head), ...tail);
};

if (['Read', 'Grep', 'Glob'].includes(tool_name)) {
  if (agent_type !== 'researcher') process.exit(0);
  const project = real(resolve(process.env.CLAUDE_PROJECT_DIR ?? cwd));
  const base = resolve(cwd, tool_input.file_path ?? tool_input.path ?? '.');
  const targets = [base];
  if (tool_name === 'Glob' && tool_input.pattern) targets.push(resolve(base, tool_input.pattern));
  if (tool_name === 'Grep' && tool_input.glob) targets.push(resolve(base, tool_input.glob));
  for (const t of targets) {
    const abs = real(t);
    if (abs !== project && !abs.startsWith(project + sep)) {
      process.stderr.write(
        `scope-guard: researcher may not read ${t}. Researchers read only inside the project.\n`,
      );
      process.exit(2);
    }
  }
  process.exit(0);
}

const target = tool_input.file_path ?? tool_input.notebook_path;
if (!target) process.exit(0);

const file = resolve(cwd, target);
const block = (reason) => {
  process.stderr.write(`scope-guard: ${agent_type} may not write ${target}. ${reason}\n`);
  process.exit(2);
};

// Repo root of the file itself, so this works in worktrees too. The file (and
// even its folder) may not exist yet, so start from the nearest existing folder.
let probe = dirname(file);
while (!existsSync(probe) && dirname(probe) !== probe) probe = dirname(probe);
let root;
try {
  root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
    cwd: probe,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
} catch {
  root = process.env.CLAUDE_PROJECT_DIR ?? cwd;
}
const rel = relative(root, file).split(sep).join('/');

const protectedForImplementer = [
  /^\.claude\//,
  /^specs\//,
  /^research\//,
  /^eslint\.config\.js$/,
  /^tsconfig[^/]*\.json$/,
  /^vite\.config\.ts$/,
  /^package(-lock)?\.json$/,
  /^\.prettierrc\.json$/,
  /^\.prettierignore$/,
  /^\.git-blame-ignore-revs$/,
  /^knip\.json$/,
  /^eslint-suppressions\.json$/,
];

switch (agent_type) {
  case 'researcher': {
    // research/ is its own git repo, so `root` is research/ itself when the file is inside it.
    const researchDir = resolve(process.env.CLAUDE_PROJECT_DIR ?? cwd, 'research');
    if (!file.startsWith(researchDir + sep)) block('Researchers write only under research/.');
    break;
  }
  case 'reviewer':
    block('Reviewers report findings; they do not edit files.');
    break;
  case 'implementer':
    if (protectedForImplementer.some((re) => re.test(rel))) {
      block(
        'Checks, config, specs and research are off limits. Fix the cause in src/, or report that the spec or config needs a change.',
      );
    }
    break;
  default:
    break;
}
process.exit(0);
