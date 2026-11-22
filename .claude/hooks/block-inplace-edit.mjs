#!/usr/bin/env node
// PreToolUse (Bash): stop the implementer editing files in place with `sed -i` or `perl -i`.
// Shell edits skip both scope-guard (protected files) and the PostToolUse Prettier/ESLint
// hook, so the first sign of them is a failed verify. Edit/Write go through both.
// Other agents and the main session are not restricted. Fails open on unparsable input.
//
// Exit 2 blocks the call and sends the reason back to the agent.
import { pathToFileURL } from 'node:url';
import { segments } from './block-pathless-rg.mjs';

const inPlace = {
  sed: (a) => a === '--in-place' || a.startsWith('--in-place=') || /^-[a-zA-Z]*i/.test(a),
  perl: (a) => /^-[a-zA-Z]*i/.test(a),
};

export function check(command) {
  if (typeof command !== 'string' || !/\b(sed|perl)\b/.test(command)) return { block: false };
  const segs = segments(command);
  if (!segs) return { block: false };
  for (const { words } of segs) {
    let k = 0;
    while (k < words.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(words[k])) k++;
    const isInPlace = inPlace[words[k]];
    if (isInPlace && words.slice(k + 1).some(isInPlace)) {
      return {
        block: true,
        reason:
          `block-inplace-edit: \`${words[k]} -i\` skips scope-guard and the Prettier/ESLint hook. ` +
          'Make the change with Edit or Write.',
      };
    }
  }
  return { block: false };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  let parsed;
  try {
    parsed = JSON.parse(input || '{}');
  } catch {
    process.exit(0);
  }
  if (parsed.agent_type !== 'implementer') process.exit(0);
  const result = check(parsed.tool_input?.command);
  if (result.block) {
    process.stderr.write(`${result.reason}\n`);
    process.exit(2);
  }
  process.exit(0);
}
