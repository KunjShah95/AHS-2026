import { db } from './firebase';
import { doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, QueryDocumentSnapshot, type DocumentData, orderBy, limit, updateDoc, deleteDoc } from 'firebase/firestore';

export interface UserProgress {
  userId: string;
  completedTasks: string[];
  currentModule: string;
  totalTimeSpent: number; // in minutes
  streak: number;
  lastActiveDate: string;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number; // in USD
}

export interface RepoMetadata {
  name: string;
  owner: string;
  language: string;
  technologies: string[];
  fileCount: number;
  totalLines: number;
  complexity: 'beginner' | 'intermediate' | 'advanced';
}

export interface SavedAnalysis {
  id: string;
  userId: string;
  repoUrl: string;
  repoName: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  metadata?: RepoMetadata;
  tokenUsage?: TokenUsage;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  lastAccessedAt: string;
  isFavorite: boolean;
}

export const saveUserProgress = async (userId: string, progress: Partial<UserProgress>) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, progress, { merge: true });
  } catch (error) {
    console.error("Error saving user progress:", error);
    throw error;
  }
};

export const getUserProgress = async (userId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProgress;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting user progress:", error);
    throw error;
  }
};

// Extract repo name from URL
const extractRepoName = (url: string): string => {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (match) {
    return match[2].replace('.git', '');
  }
  return url.split('/').pop()?.replace('.git', '') || 'Unknown';
};

// Extract owner from URL
const extractOwner = (url: string): string => {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (match) {
    return match[1];
  }
  return 'Unknown';
};

export interface SaveAnalysisOptions {
  metadata?: Partial<RepoMetadata>;
  tokenUsage?: TokenUsage;
}

export const saveRepoAnalysis = async (
  userId: string, 
  repoUrl: string, 
  analysisData: Record<string, unknown>,
  options?: SaveAnalysisOptions
): Promise<string> => {
  try {
    const now = new Date().toISOString();
    const repoName = extractRepoName(repoUrl);
    const owner = extractOwner(repoUrl);

    const analysisRef = collection(db, 'analyses');
    const docRef = await addDoc(analysisRef, {
      userId,
      repoUrl,
      repoName,
      data: analysisData,
      createdAt: now,
      updatedAt: now,
      lastAccessedAt: now,
      status: 'completed',
      isFavorite: false,
      metadata: {
        name: repoName,
        owner,
        language: options?.metadata?.language || 'Unknown',
        technologies: options?.metadata?.technologies || [],
        fileCount: options?.metadata?.fileCount || 0,
        totalLines: options?.metadata?.totalLines || 0,
        complexity: options?.metadata?.complexity || 'intermediate',
      },
      tokenUsage: options?.tokenUsage || {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        estimatedCost: 0,
      }
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving repo analysis:", error);
    throw error;
  }
};

// Update analysis status
export const updateAnalysisStatus = async (
  analysisId: string, 
  status: SavedAnalysis['status']
): Promise<void> => {
  try {
    const analysisRef = doc(db, 'analyses', analysisId);
    await updateDoc(analysisRef, {
      status,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error updating analysis status:", error);
    throw error;
  }
};

// Update last accessed time (for tracking recent repos)
export const updateLastAccessed = async (analysisId: string): Promise<void> => {
  try {
    const analysisRef = doc(db, 'analyses', analysisId);
    await updateDoc(analysisRef, {
      lastAccessedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error updating last accessed:", error);
    throw error;
  }
};

// Toggle favorite status
export const toggleFavorite = async (analysisId: string, isFavorite: boolean): Promise<void> => {
  try {
    const analysisRef = doc(db, 'analyses', analysisId);
    await updateDoc(analysisRef, {
      isFavorite,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error toggling favorite:", error);
    throw error;
  }
};

// Delete analysis
export const deleteAnalysis = async (analysisId: string): Promise<void> => {
  try {
    const analysisRef = doc(db, 'analyses', analysisId);
    await deleteDoc(analysisRef);
  } catch (error) {
    console.error("Error deleting analysis:", error);
    throw error;
  }
};

// Get analysis by ID
export const getAnalysisById = async (analysisId: string): Promise<SavedAnalysis | null> => {
  try {
    const analysisRef = doc(db, 'analyses', analysisId);
    const docSnap = await getDoc(analysisRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as SavedAnalysis;
    }
    return null;
  } catch (error) {
    console.error("Error getting analysis by ID:", error);
    throw error;
  }
};

// Get user's favorite analyses
export const getUserFavoriteAnalyses = async (userId: string): Promise<SavedAnalysis[]> => {
  try {
    const q = query(
      collection(db, 'analyses'),
      where("userId", "==", userId),
      where("isFavorite", "==", true),
      orderBy("updatedAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
      id: doc.id,
      ...doc.data()
    } as SavedAnalysis));
  } catch (error) {
    console.error("Error getting favorite analyses:", error);
    throw error;
  }
};

// Get user's token usage stats
export const getUserTokenStats = async (userId: string): Promise<{
  totalTokensUsed: number;
  totalCost: number;
  analysisCount: number;
}> => {
  try {
    const analyses = await getAllUserAnalyses(userId);
    return analyses.reduce((acc, analysis) => ({
      totalTokensUsed: acc.totalTokensUsed + (analysis.tokenUsage?.totalTokens || 0),
      totalCost: acc.totalCost + (analysis.tokenUsage?.estimatedCost || 0),
      analysisCount: acc.analysisCount + 1
    }), { totalTokensUsed: 0, totalCost: 0, analysisCount: 0 });
  } catch (error) {
    console.error("Error getting user token stats:", error);
    throw error;
  }
};

export const getRepoAnalysis = async (userId: string, repoUrl: string) => {
  try {
    const q = query(
      collection(db, 'analyses'), 
      where("userId", "==", userId),
      where("repoUrl", "==", repoUrl)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting repo analysis:", error);
    throw error;
  }
};

export const getUserLatestRoadmap = async (userId: string): Promise<SavedAnalysis | null> => {
  try {
    const q = query(
      collection(db, 'analyses'), 
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return { 
      id: doc.id, 
      ...doc.data() 
    } as SavedAnalysis;
  } catch (error) {
    console.error("Error getting user's latest roadmap:", error);
    throw error;
  }
};

export const getAllUserAnalyses = async (userId: string): Promise<SavedAnalysis[]> => {
  try {
    const q = query(
      collection(db, 'analyses'), 
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({ 
      id: doc.id, 
      ...doc.data() 
    } as SavedAnalysis));
  } catch (error) {
    console.error("Error getting user analyses:", error);
    throw error;
  }
};
