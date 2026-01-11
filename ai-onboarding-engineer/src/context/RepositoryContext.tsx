import React, { createContext, useContext, useEffect, useState } from 'react';
import type { SavedAnalysis } from '@/lib/db';
import { getAllUserAnalyses, updateLastAccessed } from '@/lib/db';
import { useAuth } from '@/hooks/useAuth';

interface RepositoryContextType {
  currentRepository: SavedAnalysis | null;
  recentRepositories: SavedAnalysis[];
  selectRepository: (repo: SavedAnalysis) => void;
  loading: boolean;
  error: string | null;
  refreshRepositories: () => Promise<void>;
  clearCurrentRepository: () => void;
}

const RepositoryContext = createContext<RepositoryContextType | undefined>(undefined);

export const RepositoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentRepository, setCurrentRepository] = useState<SavedAnalysis | null>(null);
  const [recentRepositories, setRecentRepositories] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load repositories on user login
  useEffect(() => {
    if (!user) {
      // On sign out, keep repository data but don't load new ones
      setLoading(false);
      return;
    }

    const loadRepositories = async () => {
      try {
        setLoading(true);
        setError(null);
        const analyses = await getAllUserAnalyses(user.uid);
        setRecentRepositories(analyses);
        
        // If there's no current repository and user has analyses, set the most recent one
        if (!currentRepository && analyses.length > 0) {
          setCurrentRepository(analyses[0]);
        }
      } catch (err) {
        console.error('Error loading repositories:', err);
        setError('Failed to load repositories');
      } finally {
        setLoading(false);
      }
    };

    loadRepositories();
  }, [user]);

  const selectRepository = async (repo: SavedAnalysis) => {
    try {
      setCurrentRepository(repo);
      // Update last accessed time
      if (user) {
        await updateLastAccessed(repo.id);
      }
    } catch (err) {
      console.error('Error selecting repository:', err);
    }
  };

  const clearCurrentRepository = () => {
    setCurrentRepository(null);
  };

  const refreshRepositories = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const analyses = await getAllUserAnalyses(user.uid);
      setRecentRepositories(analyses);
    } catch (err) {
      console.error('Error refreshing repositories:', err);
      setError('Failed to refresh repositories');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RepositoryContext.Provider
      value={{
        currentRepository,
        recentRepositories,
        selectRepository,
        loading,
        error,
        refreshRepositories,
        clearCurrentRepository,
      }}
    >
      {children}
    </RepositoryContext.Provider>
  );
};

export const useRepository = () => {
  const context = useContext(RepositoryContext);
  if (context === undefined) {
    throw new Error('useRepository must be used within RepositoryProvider');
  }
  return context;
};


