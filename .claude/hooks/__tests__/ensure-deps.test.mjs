import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readlinkSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ensureDeps } from '../lib/ensure-deps.mjs';

const git = (cwd, ...args) =>
  execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], {
    cwd,
    stdio: 'ignore',
  });

// main checkout + two linked worktrees; returns their paths
const setup = () => {
  const root = mkdtempSync(join(tmpdir(), 'ensure-deps-'));
  const main = join(root, 'main');
  mkdirSync(main);
  git(main, 'init', '-q', '-b', 'main');
  git(main, 'commit', '-q', '--allow-empty', '-m', 'init');
  const a = join(root, 'a');
  const b = join(root, 'b');
  git(main, 'worktree', 'add', '-q', a, '-b', 'a');
  git(main, 'worktree', 'add', '-q', b, '-b', 'b');
  return { root, main, a, b };
};

test('links the main checkout node_modules into a worktree', () => {
  const { root, main, a } = setup();
  try {
    mkdirSync(join(main, 'node_modules'));
    assert.equal(ensureDeps(a), a);
    assert.equal(readlinkSync(join(a, 'node_modules')), join(main, 'node_modules'));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("falls back to another worktree's node_modules when the main checkout has none", () => {
  const { root, a, b } = setup();
  try {
    mkdirSync(join(b, 'node_modules'));
    assert.equal(ensureDeps(a), a);
    assert.equal(readlinkSync(join(a, 'node_modules')), join(b, 'node_modules'));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('does nothing when no checkout has node_modules, or in the main checkout', () => {
  const { root, main, a } = setup();
  try {
    assert.equal(ensureDeps(a), null);
    assert.equal(existsSync(join(a, 'node_modules')), false);
    assert.equal(ensureDeps(main), null);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
