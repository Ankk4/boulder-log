#!/usr/bin/env node
// PreToolUse (Edit|Write|MultiEdit|NotebookEdit): limit what each subagent may write.
// Settings-level hooks also fire inside subagents, with `agent_type` set to the
// agent's name. The main session (no agent_type) is never restricted here.
//
//   researcher  -> only research/ (the private research repo)
//   reviewer    -> nothing (it reports, it doesn't fix)
//   implementer -> anything except checks/config/specs, so it can't loosen a
//                  check to get green or rewrite the spec it's measured against
//
// Exit 2 blocks the call and sends the reason back to the agent.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';

let input = '';
for await (const chunk of process.stdin) input += chunk;
const { agent_type, tool_input = {}, cwd = process.cwd() } = JSON.parse(input || '{}');

const target = tool_input.file_path ?? tool_input.notebook_path;
if (!agent_type || !target) process.exit(0);

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
