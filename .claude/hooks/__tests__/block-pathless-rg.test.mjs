import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { check } from '../block-pathless-rg.mjs';

const blocked = ['rg foo', 'cd x && rg -n foo', 'rg -e foo', "rg -g '*.ts' foo"];
const allowed = [
  'rg foo .',
  'rg -n foo src',
  'rg -e foo src',
  'git log | rg foo',
  'rg --files',
  'rg --version',
  'rg foo < /dev/null',
  'grep foo',
  'echo "rg foo"',
];

for (const command of blocked) {
  test(`blocks: ${command}`, () => {
    const result = check(command);
    assert.equal(result.block, true);
    assert.match(result.reason, /path/);
  });
}

for (const command of allowed) {
  test(`allows: ${command}`, () => {
    assert.equal(check(command).block, false);
  });
}

test('a value flag and its value do not count as a path', () => {
  assert.equal(check('rg -t ts -m 3 -A 2 foo').block, true);
  assert.equal(check('rg --glob=*.ts --max-count 3 foo').block, true);
  assert.equal(check('rg -t ts foo src').block, false);
});

test('allows an empty command', () => {
  assert.equal(check('').block, false);
});

test('allows input it cannot parse (unbalanced quote)', () => {
  assert.equal(check('rg "foo').block, false);
});

test('allows a non-string command', () => {
  assert.equal(check(undefined).block, false);
});

test('fails open on malformed hook input', () => {
  const hook = fileURLToPath(new URL('../block-pathless-rg.mjs', import.meta.url));
  const run = (input) => spawnSync(process.execPath, [hook], { input, encoding: 'utf8' });
  assert.equal(run('not json').status, 0);
  assert.equal(run(JSON.stringify({ tool_input: { command: 'rg foo' } })).status, 2);
});
