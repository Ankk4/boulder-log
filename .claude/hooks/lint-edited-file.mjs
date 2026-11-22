#!/usr/bin/env node
// PostToolUse (Edit|Write|MultiEdit): format the file Claude just changed with
// Prettier (any file in the repo; .prettierignore and --ignore-unknown skip the
// rest), then lint it with ESLint if it is src/**/*.ts(x).
// Exit 2 sends Prettier's or ESLint's errors back to Claude so it fixes them right away.
// Formats and lints from the edited file's own repo root, so edits inside a git worktree
// (subagents with isolation: "worktree") are linted against that worktree.
import { execFileSync } from 'node:child_process';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { ensureDeps } from './lib/ensure-deps.mjs';

let input = '';
for await (const chunk of process.stdin) input += chunk;
const { tool_input = {}, cwd = process.cwd() } = JSON.parse(input || '{}');
if (!tool_input.file_path) process.exit(0);
const file = resolve(cwd, tool_input.file_path);

let root;
try {
  root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
    cwd: dirname(file),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
} catch {
  process.exit(0); // not in a git checkout (e.g. a new directory outside the repo)
}

const rel = relative(root, file);
if (rel.startsWith('..') || isAbsolute(rel)) process.exit(0);
ensureDeps(root);

const clean = (err) =>
  `${err.signal ? `killed by ${err.signal}\n` : ''}${err.stdout ?? ''}${err.stderr ?? ''}`
    .split('\n')
    .filter((l) => !/MODULE_TYPELESS|Reparsing|trace-warnings|To eliminate/.test(l))
    .join('\n')
    .trim();

try {
  execFileSync('npx', ['--no-install', 'prettier', '--write', '--ignore-unknown', rel], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
} catch (err) {
  process.stderr.write(`Prettier failed for ${rel}:\n${clean(err)}\n`);
  process.exit(2);
}

if (!/^src\/.*\.(ts|tsx)$/.test(rel)) process.exit(0);

try {
  execFileSync('npx', ['--no-install', 'eslint', '--max-warnings=0', rel], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
} catch (err) {
  process.stderr.write(`ESLint failed for ${rel}:\n${clean(err)}\n`);
  process.exit(2);
}
