#!/usr/bin/env node
// PostToolUse (Edit|Write|MultiEdit): lint the file Claude just changed.
// Exit 2 sends ESLint's findings back to Claude so it fixes them right away.
// Lints from the edited file's own repo root, so edits inside a git worktree
// (subagents with isolation: "worktree") are linted against that worktree.
import { execFileSync } from 'node:child_process';
import { dirname, relative, resolve } from 'node:path';
import { ensureDeps } from './lib/ensure-deps.mjs';

let input = '';
for await (const chunk of process.stdin) input += chunk;
const { tool_input = {}, cwd = process.cwd() } = JSON.parse(input || '{}');
if (!tool_input.file_path) process.exit(0);
const file = resolve(cwd, tool_input.file_path);

let root;
try {
  root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
    cwd: dirname(file), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
} catch {
  process.exit(0); // not in a git checkout (e.g. a new directory outside the repo)
}

const rel = relative(root, file);
if (!/^src\/.*\.(ts|tsx)$/.test(rel)) process.exit(0);
ensureDeps(root);

try {
  execFileSync('npx', ['--no-install', 'eslint', '--max-warnings=0', rel], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
} catch (err) {
  const out = `${err.stdout ?? ''}${err.stderr ?? ''}`
    .split('\n')
    .filter((l) => !/MODULE_TYPELESS|Reparsing|trace-warnings|To eliminate/.test(l))
    .join('\n')
    .trim();
  process.stderr.write(`ESLint failed for ${rel}:\n${out}\n`);
  process.exit(2);
}
