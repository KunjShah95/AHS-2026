import { useContext } from 'react';
import { RepositoryContext } from '@/context/repositoryContextDef';

export const useRepository = () => {
  const context = useContext(RepositoryContext);
  if (context === undefined) {
    throw new Error('useRepository must be used within RepositoryProvider');
  }
  return context;
};

// Helper hook to get current repository data
export const useCurrentRepositoryData = () => {
  const { currentRepository } = useRepository();
  
  return {
    analysisData: currentRepository?.data,
    repoUrl: currentRepository?.repoUrl,
    repoName: currentRepository?.repoName,
    repoId: currentRepository?.id,
    metadata: currentRepository?.metadata,
  };
};
