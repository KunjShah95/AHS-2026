import { createContext } from 'react';
import type { SavedAnalysis } from '@/lib/db';

export interface RepositoryContextType {
  currentRepository: SavedAnalysis | null;
  recentRepositories: SavedAnalysis[];
  selectRepository: (repo: SavedAnalysis) => void;
  loading: boolean;
  error: string | null;
  refreshRepositories: () => Promise<void>;
  clearCurrentRepository: () => void;
}

export const RepositoryContext = createContext<RepositoryContextType | undefined>(undefined);
