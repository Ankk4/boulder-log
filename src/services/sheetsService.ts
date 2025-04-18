import { Session, Problem, Attempt, Project } from '../types';

class SheetsService {
  private spreadsheetId: string = '';
  private apiKey: string = '';

  constructor(spreadsheetId: string, apiKey: string) {
    this.spreadsheetId = spreadsheetId;
    this.apiKey = apiKey;
  }

  // TODO: Implement actual Google Sheets API integration
  async getSessions(): Promise<Session[]> {
    // Placeholder implementation
    return [];
  }

  async getProblems(): Promise<Problem[]> {
    // Placeholder implementation
    return [];
  }

  async getAttempts(): Promise<Attempt[]> {
    // Placeholder implementation
    return [];
  }

  async getProjects(): Promise<Project[]> {
    // Placeholder implementation
    return [];
  }

  async saveSession(session: Session): Promise<void> {
    // Placeholder implementation
  }

  async saveProblem(problem: Problem): Promise<void> {
    // Placeholder implementation
  }

  async saveAttempt(attempt: Attempt): Promise<void> {
    // Placeholder implementation
  }

  async saveProject(project: Project): Promise<void> {
    // Placeholder implementation
  }
}

export default SheetsService; 