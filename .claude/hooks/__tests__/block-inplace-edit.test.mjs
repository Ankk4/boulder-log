import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { check } from '../block-inplace-edit.mjs';

const hook = fileURLToPath(new URL('../block-inplace-edit.mjs', import.meta.url));

const blocked = [
  "sed -i 's/a/b/' src/x.ts",
  "sed -Ei 's/a/b/' src/x.ts",
  "sed -i.bak 's/a/b/' x",
  "sed --in-place 's/a/b/' x",
  "cd src && sed -i 's/a/b/' x.ts",
  "perl -pi -e 's/a/b/' src/x.ts",
  "perl -i -pe 's/a/b/' x",
  "LC_ALL=C sed -i 's/a/b/' x",
];
const allowed = [
  'sed -n 1,40p src/x.ts',
  "sed 's/a/b/' src/x.ts > /dev/null",
  "git log | sed -e 's/^/  /'",
  "perl -ne 'print if /x/' src/x.ts",
  "echo 'sed -i is blocked'",
  'rg -n sed .',
];

for (const command of blocked) {
  test(`blocks: ${command}`, () => {
    const result = check(command);
    assert.equal(result.block, true);
    assert.match(result.reason, /Edit or Write/);
  });
}

for (const command of allowed) {
  test(`allows: ${command}`, () => {
    assert.equal(check(command).block, false);
  });
}

function run(agent_type) {
  return spawnSync(process.execPath, [hook], {
    input: JSON.stringify({ agent_type, tool_input: { command: "sed -i 's/a/b/' src/x.ts" } }),
    encoding: 'utf8',
  });
}

test('exits 2 for the implementer', () => {
  const r = run('implementer');
  assert.equal(r.status, 2);
  assert.match(r.stderr, /block-inplace-edit/);
});

test('allows the main session and other agents', () => {
  assert.equal(run(undefined).status, 0);
  assert.equal(run('reviewer').status, 0);
});
