import { Session, Attempt } from '../types';

/**
 * Google Sheets integration stub.
 *
 * Do NOT pass API keys or other secrets into the browser. Any value shipped
 * in client bundles (including VITE_* env vars) is extractable from GitHub Pages.
 * Future implementation must use OAuth user consent (or a backend proxy),
 * with only a public spreadsheet ID stored client-side.
 */
class SheetsService {
  private spreadsheetId: string = '';

  constructor(spreadsheetId: string) {
    this.spreadsheetId = spreadsheetId;
  }

  // TODO: Implement Google Sheets API via OAuth user tokens (never API keys)
  async getSessions(): Promise<Session[]> {
    void this.spreadsheetId;
    return [];
  }

  async getAttempts(): Promise<Attempt[]> {
    return [];
  }

  async saveSession(_session: Session): Promise<void> {
    // Placeholder — OAuth-authenticated write only
  }

  async saveAttempt(_attempt: Attempt): Promise<void> {
    // Placeholder
  }
}

export default SheetsService;
