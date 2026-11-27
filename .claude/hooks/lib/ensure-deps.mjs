#!/usr/bin/env node
// A fresh git worktree (e.g. a subagent run with isolation: "worktree") has no
// node_modules, so lint/typecheck/tests can't run there. If `dir` is inside a
// linked worktree without node_modules, symlink the main checkout's node_modules
// (or, when that isn't visible, e.g. inside claude-box, another worktree's).
// `node_modules` is gitignored, so the symlink never shows up in git status.
//
// Library: ensureDeps(dir) -> worktree root it linked, or null.
// CLI:     node .claude/hooks/lib/ensure-deps.mjs [dir]
import { execFileSync } from 'node:child_process';
import { existsSync, symlinkSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const git = (cwd, ...args) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

export function ensureDeps(dir) {
  let top;
  let common;
  try {
    top = git(dir, 'rev-parse', '--show-toplevel');
    common = resolve(dir, git(dir, 'rev-parse', '--git-common-dir'));
  } catch {
    return null; // not a git checkout
  }
  if (existsSync(join(top, 'node_modules'))) return null;
  const mainRoot = dirname(common); // the common dir is <main checkout>/.git
  if (resolve(mainRoot) === resolve(top)) return null; // main checkout: run npm install yourself
  // Prefer the main checkout's node_modules. In claude-box a session started in a worktree
  // can't see the main checkout, so fall back to any other worktree that has one.
  let others = [];
  try {
    others = git(dir, 'worktree', 'list', '--porcelain')
      .split('\n')
      .filter((l) => l.startsWith('worktree '))
      .map((l) => l.slice('worktree '.length));
  } catch {
    // keep just the main checkout
  }
  const source = [mainRoot, ...others]
    .filter((p) => resolve(p) !== resolve(top))
    .map((p) => join(p, 'node_modules'))
    .find((p) => existsSync(p));
  if (!source) return null;
  symlinkSync(source, join(top, 'node_modules'), 'dir');
  return top;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const linked = ensureDeps(process.argv[2] ?? process.cwd());
  console.log(
    linked
      ? `Linked node_modules into ${linked}`
      : 'node_modules already available (nothing to do)',
  );
}
