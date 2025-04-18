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

## Development

### Prerequisites
- Node.js
- npm or yarn

### Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Building for Production
```bash
npm run build
```

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
