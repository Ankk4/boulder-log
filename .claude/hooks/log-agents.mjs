#!/usr/bin/env node
// SubagentStart / SubagentStop: append one JSON line per event to
// .claude/logs/agents.jsonl (gitignored). Watch live with:
//   tail -f .claude/logs/agents.jsonl
// Never blocks: any error is swallowed and the hook exits 0.
import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

try {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  const e = JSON.parse(input || '{}');
  const dir = join(process.env.CLAUDE_PROJECT_DIR ?? e.cwd ?? process.cwd(), '.claude', 'logs');
  mkdirSync(dir, { recursive: true });
  const line = {
    ts: new Date().toISOString(),
    event: e.hook_event_name,
    agent_type: e.agent_type,
    agent_id: e.agent_id,
    cwd: e.cwd,
    ...(e.hook_event_name === 'SubagentStop' && {
      stop_hook_active: e.stop_hook_active,
      transcript: e.agent_transcript_path,
      last_message: typeof e.last_assistant_message === 'string'
        ? e.last_assistant_message.slice(0, 300)
        : undefined,
    }),
  };
  appendFileSync(join(dir, 'agents.jsonl'), JSON.stringify(line) + '\n');
} catch {
  // logging must never get in the way
}
process.exit(0);
