#!/usr/bin/env node
// Push the current feature branch and open a draft PR. Used by `/run-spec <feature> --draft-pr`.
// The orchestrator writes the body; this script only checks and runs commands, so no model is involved.
//
//   node .claude/hooks/lib/open-pr.mjs --title "<title>" --body-file <path> [--base master] [--dry-run]
//
// Refuses (exit 1, one line on stderr) before pushing anything if:
//   - --title is missing, or the body file is missing or empty
//   - the current branch is not feature/*
//   - tracked files have uncommitted changes
//   - `npm run verify` fails
//   - the body or a commit message headed for the PR mentions research/ (private repo; this one is public)
// It never merges, marks a PR ready, force-pushes, or pushes any branch but the current one.
//
// Inside claude-box without a GitHub token (the normal case), it runs every check above, then
// writes the title and body to <git-dir>/claude-box-pr.json instead of pushing. The user
// reviews the branch and pushes from the host with `tx ship` (Alt-u), which reads that file.
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};
const title = opt('--title');
const bodyFile = opt('--body-file');
const base = opt('--base') ?? 'master';
const dryRun = args.includes('--dry-run');

const refuse = (reason) => {
  process.stderr.write(`open-pr: refused. ${reason}\n`);
  process.exit(1);
};
const run = (cmd, cmdArgs) =>
  execFileSync(cmd, cmdArgs, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const tryRun = (cmd, cmdArgs) => {
  try {
    return run(cmd, cmdArgs);
  } catch (err) {
    refuse(
      `\`${cmd} ${cmdArgs.join(' ')}\` failed: ${String(err.stderr || err.message)
        .trim()
        .split('\n')
        .pop()}`,
    );
  }
};

// 1. Inputs
if (!title || title.startsWith('--')) refuse('Missing --title.');
if (!bodyFile || bodyFile.startsWith('--')) refuse('Missing --body-file.');
let body;
try {
  body = readFileSync(resolve(bodyFile), 'utf8');
} catch {
  refuse(`Body file ${bodyFile} does not exist.`);
}
if (!body.trim()) refuse(`Body file ${bodyFile} is empty.`);

// 2. Branch
const branch = tryRun('git', ['branch', '--show-current']);
if (!branch.startsWith('feature/'))
  refuse(`Current branch is "${branch || '(detached)'}", not feature/*.`);

// 3. Clean tracked files
if (tryRun('git', ['status', '--porcelain', '--untracked-files=no'])) {
  refuse('Tracked files have uncommitted changes. Commit or stash them first.');
}

// 4. Verify. The tree is clean here, so the stop hook's --check would skip; run verify itself.
const verify = spawnSync('npm', ['run', '-s', 'verify'], {
  encoding: 'utf8',
  env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
});
if (verify.status !== 0) refuse('`npm run verify` failed. Run it to see the failures.');

// 5. Public-repo guard
tryRun('git', ['fetch', '-q', 'origin', base]);
if (body.includes('research/')) refuse('The PR body mentions research/, which is private.');
const messages = tryRun('git', ['log', '--format=%H%n%B', `origin/${base}..HEAD`]);
if (messages.includes('research/'))
  refuse(`A commit message in origin/${base}..HEAD mentions research/, which is private.`);

// Push and open (or reuse) the draft PR
const push = ['push', '-u', 'origin', branch];
const create = [
  'pr',
  'create',
  '--draft',
  '--base',
  base,
  '--head',
  branch,
  '--title',
  title,
  '--body-file',
  bodyFile,
];
if (dryRun) {
  console.log(`would run: git ${push.join(' ')}`);
  console.log(
    `would run: gh ${create.map((a) => (/\s/.test(a) ? JSON.stringify(a) : a)).join(' ')}`,
  );
  process.exit(0);
}

if (process.env.CLAUDE_BOX_MODE && !process.env.GH_TOKEN) {
  const handoff = resolve(tryRun('git', ['rev-parse', '--absolute-git-dir']), 'claude-box-pr.json');
  writeFileSync(handoff, `${JSON.stringify({ branch, base, title, body }, null, 2)}\n`);
  console.log(
    `Checks passed. No GitHub token in this box, so nothing was pushed. Wrote the PR title and body to ${handoff}; the user pushes and opens the draft PR from the host with Alt-u (tx ship).`,
  );
  process.exit(0);
}

tryRun('git', push);
const existing = JSON.parse(
  tryRun('gh', ['pr', 'list', '--head', branch, '--state', 'open', '--json', 'url']) || '[]',
);
if (existing.length > 0) {
  console.log(`PR already open, left unchanged: ${existing[0].url}`);
  process.exit(0);
}
console.log(tryRun('gh', create));
