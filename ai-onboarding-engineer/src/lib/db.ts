import { db } from './firebase';
import { doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, QueryDocumentSnapshot, type DocumentData } from 'firebase/firestore';

export interface UserProgress {
  userId: string;
  completedTasks: string[];
  currentModule: string;
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

export const saveRepoAnalysis = async (userId: string, repoUrl: string, analysisData: Record<string, unknown>) => {
  try {
    const analysisRef = collection(db, 'analyses');
    await addDoc(analysisRef, {
      userId,
      repoUrl,
      data: analysisData,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error saving repo analysis:", error);
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
