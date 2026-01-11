import { useRepository } from '@/context/RepositoryContext';

export const useRepositoryContext = () => {
  return useRepository();
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
