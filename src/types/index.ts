export interface Session {
  id: string;
  startTime: string;
  endTime?: string | null;
  preSessionData: PreSessionData;
  postSessionNotes?: string;
  duration?: number; // in minutes
  problems: SessionProblem[];
}

export interface PreSessionData {
  sleepQuality: number;
  energyLevel: number;
  fingerSoreness: number;
  motivation: number;
  restDays: number;
  nutrition: 'poor' | 'moderate' | 'good';
  stress: 'low' | 'medium' | 'high';
  goals: string[];
  additionalNotes: string;
}

export interface SessionProblem {
  id: string;
  name: string;
  frenchGrade: string;
  colorGrade: string;
  attempts: Attempt[];
  flash?: boolean;  // Completed on first attempt
  send?: boolean;   // Completed after multiple attempts
  sessionId: string;
  createdAt: string;
}

export enum AttemptType {
  ATTEMPT = 'attempt',
  FLASH = 'flash',
  SEND = 'send'
}

export interface Attempt {
  id: string;
  problemId: string;
  sessionId: string;
  timestamp: string;
  type: AttemptType;
  notes?: string;
}

export interface IntervalWorkout {
  id: string;
  name: string;
  workSeconds: number;
  restSeconds: number;
  intervals: number;
  muted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IntervalRun {
  id: string;
  workoutId: string;
  workoutName: string;
  workSeconds: number;
  restSeconds: number;
  intervals: number;
  completedIntervals: number;
  startedAt: string;
  completedAt?: string;
  status: 'completed' | 'aborted';
  notes?: string;
} 