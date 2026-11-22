#!/usr/bin/env node
// PreToolUse (Bash): block `rg` calls that have no path operand.
// In agent shells stdin is not a TTY, so a pathless `rg foo` waits on stdin
// forever instead of searching the working directory.
//
// A command segment counts when it starts the command or follows `;`, `&&`,
// `||`, `(` or `$(`. A segment on the right of `|` reads piped input, so it is
// allowed. Anything this can't parse is allowed (fail open).
//
// Exit 2 blocks the call and sends the reason back to the agent.
import { pathToFileURL } from 'node:url';

// Flags whose value is the next token (or the rest of the token).
const SHORT_VALUE = new Set(['A', 'B', 'C', 'd', 'E', 'e', 'f', 'g', 'j', 'M', 'm', 'r', 'T', 't']);
const LONG_VALUE = new Set([
  'after-context',
  'before-context',
  'color',
  'colors',
  'context',
  'context-separator',
  'dfa-size-limit',
  'encoding',
  'engine',
  'field-context-separator',
  'field-match-separator',
  'file',
  'generate',
  'glob',
  'hostname-bin',
  'hyperlink-format',
  'iglob',
  'ignore-file',
  'max-columns',
  'max-count',
  'max-depth',
  'max-filesize',
  'path-separator',
  'pre',
  'pre-glob',
  'regex-size-limit',
  'regexp',
  'replace',
  'sort',
  'sortr',
  'threads',
  'type',
  'type-add',
  'type-clear',
  'type-not',
]);
// Flags that give the pattern, so every positional is a path.
const PATTERN_SHORT = new Set(['e', 'f']);
const PATTERN_LONG = new Set(['regexp', 'file']);
// Flags that make rg not search at all, so it never reads stdin.
const NO_SEARCH = new Set([
  '--files',
  '--version',
  '-V',
  '--help',
  '-h',
  '--type-list',
  '--pcre2-version',
  '--generate',
]);

// Split into segments of words, honouring quotes. Returns null if unbalanced.
export function segments(command) {
  const out = [];
  let words = [];
  let word = null;
  let quote = null;
  let afterPipe = false;
  const endWord = () => {
    if (word !== null) words.push(word);
    word = null;
  };
  const endSegment = (pipe) => {
    endWord();
    if (words.length) out.push({ words, afterPipe });
    words = [];
    afterPipe = pipe;
  };
  for (let i = 0; i < command.length; i++) {
    const c = command[i];
    const next = command[i + 1];
    if (quote) {
      if (c === quote) quote = null;
      else if (c === '\\' && quote === '"' && next !== undefined) word += command[++i];
      else word += c;
      continue;
    }
    if (c === "'" || c === '"') {
      quote = c;
      word ??= '';
    } else if (c === '\\' && next !== undefined) {
      word = (word ?? '') + command[++i];
    } else if (c === ' ' || c === '\t') {
      endWord();
    } else if (c === '\n' || c === ';' || c === '(' || c === ')') {
      endSegment(false);
    } else if (c === '$' && next === '(') {
      endSegment(false);
      i++;
    } else if ((c === '&' || c === '|') && next === c) {
      endSegment(false);
      i++;
    } else if (c === '|') {
      endSegment(true);
    } else if (c === '&') {
      endSegment(false);
    } else {
      word = (word ?? '') + c;
    }
  }
  if (quote) return null;
  endSegment(false);
  return out;
}

// True when an `rg` invocation (words after `rg`) has no path to search.
function lacksPath(args) {
  const positionals = [];
  let patternFromFlag = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (NO_SEARCH.has(a)) return false;
    if (/^\d*<|^<</.test(a)) return false; // stdin comes from a file or heredoc
    if (/^\d*>|^&>/.test(a)) {
      if (/^(\d*>>?|&>>?)$/.test(a)) i++; // `> out`: skip the target too
      continue;
    }
    if (a === '--') {
      positionals.push(...args.slice(i + 1));
      break;
    }
    if (a.startsWith('--')) {
      const [name, inline] = a.slice(2).split(/=(.*)/s);
      if (PATTERN_LONG.has(name)) patternFromFlag = true;
      if (LONG_VALUE.has(name) && inline === undefined) i++;
      continue;
    }
    if (a.startsWith('-') && a.length > 1) {
      for (let j = 1; j < a.length; j++) {
        const f = a[j];
        if (PATTERN_SHORT.has(f)) patternFromFlag = true;
        if (SHORT_VALUE.has(f)) {
          if (j === a.length - 1) i++;
          break;
        }
      }
      continue;
    }
    positionals.push(a);
  }
  return positionals.length < (patternFromFlag ? 1 : 2);
}

export function check(command) {
  if (typeof command !== 'string' || !command.includes('rg')) return { block: false };
  const segs = segments(command);
  if (!segs) return { block: false };
  for (const { words, afterPipe } of segs) {
    let k = 0;
    while (k < words.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(words[k])) k++; // FOO=1 rg …
    if (words[k] !== 'rg' || afterPipe) continue;
    if (lacksPath(words.slice(k + 1))) {
      return {
        block: true,
        reason:
          'block-pathless-rg: `rg` without a path reads stdin and hangs in agent shells. ' +
          'Add `.` or a path, e.g. `rg -n foo .` or `rg -n foo src`.',
      };
    }
  }
  return { block: false };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  let command;
  try {
    command = JSON.parse(input || '{}').tool_input?.command;
  } catch {
    process.exit(0);
  }
  const result = check(command);
  if (result.block) {
    process.stderr.write(`${result.reason}\n`);
    process.exit(2);
  }
  process.exit(0);
}
