import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Session, Problem, Attempt, Project } from '../types';

interface AppContextType {
  currentSession: Session | null;
  setCurrentSession: (session: Session | null) => void;
  problems: Problem[];
  setProblems: (problems: Problem[]) => void;
  attempts: Attempt[];
  setAttempts: (attempts: Attempt[]) => void;
  projects: Project[];
  setProjects: (projects: Project[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  return (
    <AppContext.Provider
      value={{
        currentSession,
        setCurrentSession,
        problems,
        setProblems,
        attempts,
        setAttempts,
        projects,
        setProjects,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}; 