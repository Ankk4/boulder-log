import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const srcDir = path.join(process.cwd(), 'src');
const literal = /#[0-9a-fA-F]{3,8}\b|rgba?\(/;
const gradeLine = /\{ name: '[^']*', color: '#[0-9a-fA-F]+'/;

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || full === path.join(srcDir, 'theme')) continue;
      out.push(...walk(full));
    } else if (entry.name.endsWith('.tsx')) {
      out.push(full);
    }
  }
  return out;
}

describe('theme usage', () => {
  it('no colour literals outside theme', () => {
    const hits: string[] = [];
    for (const file of walk(srcDir)) {
      const isDifficulty = path.basename(file) === 'DifficultySelect.tsx';
      fs.readFileSync(file, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          if (!literal.test(line)) return;
          if (isDifficulty && gradeLine.test(line)) return;
          hits.push(`${path.relative(process.cwd(), file)}:${i + 1}: ${line.trim()}`);
        });
    }
    expect(hits, hits.join('\n')).toEqual([]);
  });
});
