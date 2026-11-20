import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('../../../', import.meta.url));
const hook = fileURLToPath(new URL('../lint-edited-file.mjs', import.meta.url));
let dir;

before(() => {
  dir = mkdtempSync(join(tmpdir(), 'lint-edited-file-'));
  execFileSync('git', ['init', '-q'], { cwd: dir });
  for (const f of ['.prettierrc.json', '.prettierignore', 'eslint.config.js']) {
    copyFileSync(join(repo, f), join(dir, f));
  }
  writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
  symlinkSync(join(repo, 'node_modules'), join(dir, 'node_modules'), 'dir');
});

after(() => rmSync(dir, { recursive: true, force: true }));

function run(rel, content) {
  const file = join(dir, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
  const r = spawnSync(process.execPath, [hook], {
    input: JSON.stringify({ tool_input: { file_path: rel }, cwd: dir }),
    encoding: 'utf8',
  });
  return { code: r.status, stderr: r.stderr, after: readFileSync(file, 'utf8') };
}

test('formats an unformatted src/*.ts file', () => {
  const r = run('src/a.ts', 'export const a = "x"\n');
  assert.equal(r.code, 0, r.stderr);
  assert.equal(r.after, "export const a = 'x';\n");
});

test('formats an unformatted .mjs file outside src/', () => {
  const r = run('scripts/b.mjs', 'export const b = {x:1}\n');
  assert.equal(r.code, 0, r.stderr);
  assert.equal(r.after, 'export const b = { x: 1 };\n');
});

test('leaves a Markdown file byte-identical', () => {
  const md = '#  Title\n*  item*\n';
  const r = run('specs/zz.md', md);
  assert.equal(r.code, 0, r.stderr);
  assert.equal(r.after, md);
});

test('leaves a file Prettier cannot parse by extension untouched', () => {
  const r = run('.gitignore', 'dist\n  node_modules\n');
  assert.equal(r.code, 0, r.stderr);
  assert.equal(r.after, 'dist\n  node_modules\n');
});

test("a syntax error exits 2 with Prettier's message", () => {
  const r = run('src/bad.ts', 'const = ;\n');
  assert.equal(r.code, 2);
  assert.match(r.stderr, /Prettier failed for src\/bad\.ts/);
  assert.match(r.stderr, /SyntaxError|Expression expected|Variable declaration expected/);
});

test("a formatted file with an ESLint error exits 2 with ESLint's message", () => {
  const r = run('src/c.ts', 'const unused = 1;\n');
  assert.equal(r.code, 2);
  assert.match(r.stderr, /ESLint failed for src\/c\.ts/);
  assert.match(r.stderr, /no-unused-vars/);
});
