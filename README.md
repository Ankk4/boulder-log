# Boulder Notes

An offline-first PWA for logging bouldering sessions, problems and attempts.

[![Deploy](https://github.com/Ankk4/boulder-log/actions/workflows/deploy.yml/badge.svg?branch=master)](https://github.com/Ankk4/boulder-log/actions/workflows/deploy.yml)
[![CI](https://github.com/Ankk4/boulder-log/actions/workflows/ci.yml/badge.svg)](https://github.com/Ankk4/boulder-log/actions/workflows/ci.yml)
![Coverage](https://img.shields.io/endpoint?url=https://ankk4.github.io/boulder-log/coverage-badge.json)
[![License](https://img.shields.io/badge/license-GPLv3-blue.svg)](LICENSE)

**[Live app: https://ankk4.github.io/boulder-log/](https://ankk4.github.io/boulder-log/)**

It installs as a PWA and works offline.

## Features

- **Sessions**: start and end sessions with timestamps, record pre-session conditions (sleep, energy, finger soreness, motivation, rest days, nutrition, stress, goals) and post-session notes.
- **Problems & attempts**: quickly log problems with French or color grades, and track flashes, sends and regular attempts with an attempt counter per problem.
- **Stats**: live session statistics for duration, problems attempted, total attempts, flashes, sends and success rate.
- **Offline storage**: data is stored locally in IndexedDB (through Dexie.js) and works without a network.

## Privacy

All session, health, and notes data stay on your device in **cleartext IndexedDB**. Anyone with access to your browser profile (shared computers, extensions, DevTools) can read it. There is no server sync or account login today. Treat shared devices accordingly. See [SECURITY.md](SECURITY.md) for the threat model and reporting guidance.

## Getting started

Prerequisites: Node.js 20+

```bash
npm install
npm start
```

## Scripts

| Script | Description |
| --- | --- |
| `npm start` | Start the Vite dev server |
| `npm run build` | Typecheck and build for production |
| `npm run verify` | Typecheck, lint and tests (the definition of done) |
| `npm run test:coverage` | Run tests with coverage |
| `npm run verify:full` | `verify`, production build and dependency audit |

## Tech stack

React, TypeScript, Material-UI, Dexie.js (IndexedDB), Vite.

## How it's built

Development is AI-assisted with Claude Code. Features are specced in `specs/` (via `/spec`) and implemented by subagents (via `/run-spec`). Every change is gated by `npm run verify`, enforced in hooks and in CI. See the "Agent workflow" section of [CLAUDE.md](CLAUDE.md) for details.

## Contributing / security notes

- Never put Google API keys or other secrets in `VITE_*` env vars or client code; they are visible in the built bundle on GitHub Pages.
- Prefer OAuth user consent (or a backend proxy) for any future Sheets integration.
- GitHub Pages has limited custom HTTP headers; CSP is applied via meta tags in `index.html`. Hosts that support custom headers can add `X-Frame-Options` / COOP beyond what meta tags provide.

## Roadmap

- Google Sheets integration for data export
- Historical data analysis
- Problem difficulty tracking over time
- Session statistics and trends
- Project tracking
- Multi-gym support
- Better timer & active exercise functions

## License

GNU General Public License v3.0. See [LICENSE](LICENSE).

You may use, modify and redistribute this software, but derivative works must also be GPLv3 and ship their source.
