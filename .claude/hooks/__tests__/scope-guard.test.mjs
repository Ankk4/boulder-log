import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('../../../', import.meta.url));
const hook = fileURLToPath(new URL('../scope-guard.mjs', import.meta.url));

function call(agent_type, tool_name, tool_input, env = {}) {
  const r = spawnSync(process.execPath, [hook], {
    input: JSON.stringify({ agent_type, tool_name, tool_input, cwd: repo }),
    encoding: 'utf8',
    env: { ...process.env, CLAUDE_PROJECT_DIR: repo, ...env },
  });
  return r.status;
}

function run(file_path, agent_type) {
  return call(agent_type, 'Edit', { file_path });
}

for (const [tool, input] of [
  ['Read', { file_path: 'research/README.md' }],
  ['Read', { file_path: join(repo, 'src/main.tsx') }],
  ['Grep', { pattern: 'foo' }],
  ['Grep', { pattern: 'foo', path: 'research' }],
  ['Glob', { pattern: 'research/**/*.md' }],
]) {
  test(`allows researcher ${tool} ${JSON.stringify(input)}`, () => {
    assert.equal(call('researcher', tool, input), 0);
  });
}

for (const [tool, input] of [
  ['Read', { file_path: join(homedir(), '.ssh/id_ed25519') }],
  ['Read', { file_path: '../other-repo/.env' }],
  ['Grep', { pattern: 'token', path: join(homedir(), '.config') }],
  ['Grep', { pattern: 'token', glob: '../../**/*' }],
  ['Glob', { pattern: '/etc/*' }],
  ['Glob', { pattern: '../**/*.env' }],
]) {
  test(`blocks researcher ${tool} ${JSON.stringify(input)}`, () => {
    assert.equal(call('researcher', tool, input), 2);
  });
}

test('blocks researcher reading through a symlink that leaves the project', () => {
  const outside = mkdtempSync(join(tmpdir(), 'scope-guard-'));
  const link = join(repo, `.scope-guard-link-${process.pid}`);
  try {
    symlinkSync(outside, link);
    assert.equal(call('researcher', 'Read', { file_path: join(link, 'secret') }), 2);
  } finally {
    rmSync(link, { force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});

test('allows implementer and main session to read outside the project', () => {
  const file = join(homedir(), '.gitconfig');
  assert.equal(call('implementer', 'Read', { file_path: file }), 0);
  assert.equal(call(undefined, 'Read', { file_path: file }), 0);
});

test('still blocks researcher writes outside research/', () => {
  assert.equal(run('src/x.ts', 'researcher'), 2);
});

for (const f of [
  '.prettierrc.json',
  '.prettierignore',
  '.git-blame-ignore-revs',
  'knip.json',
  'eslint-suppressions.json',
]) {
  test(`blocks implementer on ${f}`, () => {
    assert.equal(run(f, 'implementer'), 2);
  });
}

test('allows implementer on src/x.ts', () => {
  assert.equal(run('src/x.ts', 'implementer'), 0);
});

test('allows the main session (no agent_type) on .prettierrc.json', () => {
  assert.equal(run('.prettierrc.json', undefined), 0);
});
