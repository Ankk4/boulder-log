#!/usr/bin/env node
// PostToolUse (Edit|Write|MultiEdit): lint the file Claude just changed.
// Exit 2 sends ESLint's findings back to Claude so it fixes them right away.
import { execFileSync } from 'node:child_process';
import { relative } from 'node:path';

let input = '';
for await (const chunk of process.stdin) input += chunk;
const { tool_input = {}, cwd = process.cwd() } = JSON.parse(input || '{}');
const file = tool_input.file_path;
if (!file) process.exit(0);

const rel = relative(cwd, file);
if (!/^src\/.*\.(ts|tsx)$/.test(rel)) process.exit(0);

try {
  execFileSync('npx', ['--no-install', 'eslint', '--max-warnings=0', rel], {
    cwd,
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
