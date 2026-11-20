import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('../../../', import.meta.url));
const hook = fileURLToPath(new URL('../scope-guard.mjs', import.meta.url));

function run(file_path, agent_type) {
  const r = spawnSync(process.execPath, [hook], {
    input: JSON.stringify({ agent_type, tool_input: { file_path }, cwd: repo }),
    encoding: 'utf8',
  });
  return r.status;
}

for (const f of ['.prettierrc.json', '.prettierignore', '.git-blame-ignore-revs']) {
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
