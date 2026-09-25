# Boulder Notes

⚠️ **AI-Generated Code Disclaimer**: The majority of the code in this project was generated with the assistance of AI tools. While the code has been reviewed and tested, please be aware that it may contain unconventional patterns or approaches that differ from traditional hand-written code. Use at your own discretion.

A Progressive Web App (PWA) for tracking bouldering sessions, problems, and progress.

## Features

### Session Tracking
- Start and end climbing sessions with timestamps
- Pre-session condition tracking:
  - Sleep quality
  - Energy level
  - Finger soreness
  - Motivation
  - Rest days since last session
  - Nutrition quality
  - Stress level
  - Session goals
- Post-session notes
- Real-time session statistics:
  - Duration
  - Problems attempted
  - Total attempts
  - Flashes and sends
  - Success rate

### Problem Tracking
- Quick logging of problems during sessions
- Grade tracking (French and color grades)
- Attempt tracking:
  - Flash (first try success)
  - Send (success after attempts)
  - Regular attempts
- Visual indicators for flashed and sent problems
- Attempt counter for each problem

### Data Storage
- Local storage using IndexedDB (through Dexie.js)
- Offline functionality
- Structured data storage for:
  - Sessions
  - Problems
  - Attempts
  - Pre-session data

## Privacy

All session, health, and notes data stay on your device in **cleartext IndexedDB**. Anyone with access to your browser profile (shared computers, extensions, DevTools) can read it. There is no server sync or account login today. Treat shared devices accordingly. See [SECURITY.md](SECURITY.md) for the threat model and reporting guidance.

## Development

### Prerequisites
- Node.js 20+
- npm or yarn

### Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

### Building for Production
```bash
npm run build
```

### Security notes for contributors
- Never put Google API keys or other secrets in `VITE_*` env vars or client code; they are visible in the built bundle on GitHub Pages.
- Prefer OAuth user consent (or a backend proxy) for any future Sheets integration.
- GitHub Pages has limited custom HTTP headers; CSP is applied via meta tags in `index.html`. Hosts that support custom headers can add `X-Frame-Options` / COOP beyond what meta tags provide.
## Technology Stack
- React
- TypeScript
- Material-UI
- Dexie.js (IndexedDB)
- Vite

## Future Features
- Google Sheets integration for data export
- Historical data analysis
- Problem difficulty tracking over time
- Session statistics and trends
- Project tracking
- Multi-gym support
