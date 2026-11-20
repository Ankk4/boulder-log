---
name: research
description: Research a topic for boulder-log (competitor apps, bouldering/climbing training, session and grade tracking) with parallel researcher subagents, writing cited notes into the private research/ repo.
argument-hint: "<topic or question>"
disable-model-invocation: true
---

You are the planner. Running this skill is the user's request to spawn `researcher` subagents.

Topic: `$ARGUMENTS`

1. **Preflight:** `research/` must exist and be its own git repo (`git -C research rev-parse --show-toplevel` prints `.../research`). If it doesn't, stop and tell the user. It is a private repo cloned there and gitignored in boulder-log.
2. **Scope:** read `research/README.md` and the note titles. Split the topic into 2–4 non-overlapping sub-questions that would change what we build. Example for "competitors": feature matrix of the top logging apps; how they model grades and attempts; pricing and what users complain about. Show the sub-questions and target note paths in one short message, then proceed. The user can interrupt.
3. **Fan out:** spawn one `researcher` per sub-question, all in the same message. Each prompt has the question, the exact note path `research/<competitors|sport|tracking>/<kebab>.md`, today's date, and what to skip because it's already covered.
4. **Synthesize:** when all are back, read the notes yourself and check them. Flag thin sourcing or claims that contradict each other. Then update `research/README.md`:
   - an index line per note
   - a dated "Takeaways" entry with 3–5 cross-note conclusions and spec ideas, each with an S/M/L effort
5. **Report:** give the user the takeaways and the note paths. Suggest which idea could become `/spec <name>`. Commit in `research/` only if the user asks (`git -C research ...`), and never commit research into the main repo.
