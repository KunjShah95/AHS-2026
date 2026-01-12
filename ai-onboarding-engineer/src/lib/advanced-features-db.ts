/**
 * Extended Database Functions for Advanced Features
 * Supports all 15 advanced features
 */

import { db } from './firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc,
  orderBy,
  limit
} from 'firebase/firestore';

import type {
  CodeFlow,
  CriticalPath,
  TechDebtHeatmap,
  DeveloperSkillProfile,
  OnboardingMetrics,
  OnboardingBenchmark,
  ProbationPrediction,
  WhereLookResult,
  LearningStreak,
  ConfidenceMetrics,
  CTOSnapshot,
  KnowledgeCoverage,
  DueDiligenceReport,
  DecisionExplanation,
  LivingDoc,
  TeamMemory,
  FAQ,
  CommonMistake
} from './types/advanced-features';

// ============================================
// #1: FLOW TRACING
// ============================================

export const saveCodeFlow = async (flow: Omit<CodeFlow, 'id'>): Promise<string> => {
  try {
    const flowsRef = collection(db, 'codeFlows');
    const docRef = await addDoc(flowsRef, {
      ...flow,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving code flow:', error);
    throw error;
  }
};

export const getCodeFlows = async (repoId: string): Promise<CodeFlow[]> => {
  try {
    const q = query(
      collection(db, 'codeFlows'),
      where('repoId', '==', repoId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CodeFlow));
  } catch (error) {
    console.error('Error getting code flows:', error);
    throw error;
  }
};

export const getCriticalFlows = async (repoId: string): Promise<CodeFlow[]> => {
  try {
    const q = query(
      collection(db, 'codeFlows'),
      where('repoId', '==', repoId),
      where('isCriticalPath', '==', true)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CodeFlow));
  } catch (error) {
    console.error('Error getting critical flows:', error);
    throw error;
  }
};

// ============================================
// #2: CRITICAL PATH IDENTIFICATION
// ============================================

export const saveCriticalPath = async (path: Omit<CriticalPath, 'id'>): Promise<string> => {
  try {
    const pathsRef = collection(db, 'criticalPaths');
    const docRef = await addDoc(pathsRef, path);
    return docRef.id;
  } catch (error) {
    console.error('Error saving critical path:', error);
    throw error;
  }
};

export const getCriticalPaths = async (repoId: string): Promise<CriticalPath[]> => {
  try {
    const q = query(
      collection(db, 'criticalPaths'),
      where('repoId', '==', repoId),
      orderBy('businessValue', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CriticalPath));
  } catch (error) {
    console.error('Error getting critical paths:', error);
    throw error;
  }
};

export const getMustUnderstandFirst = async (repoId: string): Promise<CriticalPath[]> => {
  try {
    const q = query(
      collection(db, 'criticalPaths'),
      where('repoId', '==', repoId),
      where('mustUnderstandFirst', '==', true)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CriticalPath));
  } catch (error) {
    console.error('Error getting must-understand-first paths:', error);
    throw error;
  }
};

// ============================================
// #3: TECH DEBT HEATMAP
// ============================================

export const saveTechDebtHeatmap = async (
  repoId: string,
  heatmap: Omit<TechDebtHeatmap, 'repoId' | 'generatedAt'>
): Promise<void> => {
  try {
    const heatmapRef = doc(db, 'techDebtHeatmaps', repoId);
    await setDoc(heatmapRef, {
      repoId,
      ...heatmap,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving tech debt heatmap:', error);
    throw error;
  }
};

export const getTechDebtHeatmap = async (repoId: string): Promise<TechDebtHeatmap | null> => {
  try {
    const heatmapRef = doc(db, 'techDebtHeatmaps', repoId);
    const snapshot = await getDoc(heatmapRef);
    if (snapshot.exists()) {
      return snapshot.data() as TechDebtHeatmap;
    }
    return null;
  } catch (error) {
    console.error('Error getting tech debt heatmap:', error);
    throw error;
  }
};

// ============================================
// #4: SKILL GAP DETECTION
// ============================================

export const saveDeveloperSkillProfile = async (
  userId: string,
  repoId: string,
  profile: Omit<DeveloperSkillProfile, 'userId' | 'repoId' | 'assessedAt'>
): Promise<void> => {
  try {
    const profileRef = doc(db, 'skillProfiles', `${userId}_${repoId}`);
    await setDoc(profileRef, {
      userId,
      repoId,
      ...profile,
      assessedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving skill profile:', error);
    throw error;
  }
};

export const getDeveloperSkillProfile = async (
  userId: string,
  repoId: string
): Promise<DeveloperSkillProfile | null> => {
  try {
    const profileRef = doc(db, 'skillProfiles', `${userId}_${repoId}`);
    const snapshot = await getDoc(profileRef);
    if (snapshot.exists()) {
      return snapshot.data() as DeveloperSkillProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting skill profile:', error);
    throw error;
  }
};

// ============================================
// #5: ONBOARDING BENCHMARKS
// ============================================

export const saveOnboardingMetrics = async (
  metrics: Omit<OnboardingMetrics, 'id'>
): Promise<string> => {
  try {
    const metricsRef = collection(db, 'onboardingMetrics');
    const docRef = await addDoc(metricsRef, metrics);
    return docRef.id;
  } catch (error) {
    console.error('Error saving onboarding metrics:', error);
    throw error;
  }
};

export const getOnboardingMetrics = async (userId: string, repoId: string): Promise<OnboardingMetrics | null> => {
  try {
    const q = query(
      collection(db, 'onboardingMetrics'),
      where('userId', '==', userId),
      where('repoId', '==', repoId),
      orderBy('startedAt', 'desc'),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs[0].data() as OnboardingMetrics;
    }
    return null;
  } catch (error) {
    console.error('Error getting onboarding metrics:', error);
    throw error;
  }
};

export const calculateOnboardingBenchmark = async (repoId: string): Promise<OnboardingBenchmark> => {
  try {
    const q = query(
      collection(db, 'onboardingMetrics'),
      where('repoId', '==', repoId)
    );
    const snapshot = await getDocs(q);
    const metrics = snapshot.docs.map(doc => doc.data() as OnboardingMetrics);
    
    const completedMetrics = metrics.filter(m => m.completedAt);
    const times = completedMetrics.map(m => m.totalOnboardingTime);
    
    return {
      repoId,
      averageOnboardingTime: times.reduce((a, b) => a + b, 0) / times.length || 0,
      fastestOnboardingTime: Math.min(...times) || 0,
      slowestOnboardingTime: Math.max(...times) || 0,
      teamAverage: times.reduce((a, b) => a + b, 0) / times.length || 0,
      monthlyTrend: [], // Calculate from historical data
      topPerformers: [] // Calculate from metrics
    };
  } catch (error) {
    console.error('Error calculating benchmark:', error);
    throw error;
  }
};

// #6: PROBATION SUCCESS PREDICTOR

export const saveProbationPrediction = async (
  prediction: Omit<ProbationPrediction, 'predictedAt'>
): Promise<void> => {
  try {
    const predRef = doc(db, 'probationPredictions', `${prediction.userId}_${prediction.repoId}`);
    await setDoc(predRef, {
      ...prediction,
      predictedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving probation prediction:', error);
    throw error;
  }
};

export const getProbationPrediction = async (
  userId: string,
  repoId: string
): Promise<ProbationPrediction | null> => {
  try {
    const predRef = doc(db, 'probationPredictions', `${userId}_${repoId}`);
    const snapshot = await getDoc(predRef);
    if (snapshot.exists()) {
      return snapshot.data() as ProbationPrediction;
    }
    return null;
  } catch (error) {
    console.error('Error getting probation prediction:', error);
    throw error;
  }
};

// ============================================
// #7: "WHERE SHOULD I LOOK?"
// ============================================

export const saveWhereLookResult = async (
  result: Omit<WhereLookResult, 'generatedAt'>
): Promise<string> => {
  try {
    const resultsRef = collection(db, 'whereLookResults');
    const docRef = await addDoc(resultsRef, {
      ...result,
      generatedAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving where-look result:', error);
    throw error;
  }
};

// ============================================
// #9: LEARNING STREAKS & CONFIDENCE
// ============================================

export const saveLearningStreak = async (
  userId: string,
  streak: Partial<LearningStreak>
): Promise<void> => {
  try {
    const streakRef = doc(db, 'learningStreaks', userId);
    await setDoc(streakRef, {
      userId,
      ...streak,
      lastActiveDate: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error('Error saving learning streak:', error);
    throw error;
  }
};

export const getLearningStreak = async (userId: string): Promise<LearningStreak | null> => {
  try {
    const streakRef = doc(db, 'learningStreaks', userId);
    const snapshot = await getDoc(streakRef);
    if (snapshot.exists()) {
      return snapshot.data() as LearningStreak;
    }
    return null;
  } catch (error) {
    console.error('Error getting learning streak:', error);
    throw error;
  }
};

export const saveConfidenceMetrics = async (
  userId: string,
  repoId: string,
  metrics: Partial<ConfidenceMetrics>
): Promise<void> => {
  try {
    const metricsRef = doc(db, 'confidenceMetrics', `${userId}_${repoId}`);
    const currentMetrics = await getDoc(metricsRef);
    
    const historicalData = currentMetrics.exists() 
      ? (currentMetrics.data().historicalData || [])
      : [];
    
    if (metrics.overallConfidence !== undefined) {
      historicalData.push({
        date: new Date().toISOString(),
        score: metrics.overallConfidence
      });
    }
    
    await setDoc(metricsRef, {
      userId,
      repoId,
      ...metrics,
      historicalData
    }, { merge: true });
  } catch (error) {
    console.error('Error saving confidence metrics:', error);
    throw error;
  }
};

export const getConfidenceMetrics = async (userId: string, repoId: string): Promise<ConfidenceMetrics | null> => {
  try {
    const metricsRef = doc(db, 'confidenceMetrics', `${userId}_${repoId}`);
    const snapshot = await getDoc(metricsRef);
    if (snapshot.exists()) {
      return snapshot.data() as ConfidenceMetrics;
    }
    return null;
  } catch (error) {
    console.error('Error getting confidence metrics:', error);
    throw error;
  }
};

// ============================================
// #10: CTO DASHBOARD
// ============================================

export const saveCTOSnapshot = async (
  teamId: string,
  snapshot: Omit<CTOSnapshot, 'teamId' | 'generatedAt'>
): Promise<void> => {
  try {
    const snapshotRef = doc(db, 'ctoSnapshots', teamId);
    await setDoc(snapshotRef, {
      teamId,
      ...snapshot,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving CTO snapshot:', error);
    throw error;
  }
};

export const getCTOSnapshot = async (teamId: string): Promise<CTOSnapshot | null> => {
  try {
    const snapshotRef = doc(db, 'ctoSnapshots', teamId);
    const snapshot = await getDoc(snapshotRef);
    if (snapshot.exists()) {
      return snapshot.data() as CTOSnapshot;
    }
    return null;
  } catch (error) {
    console.error('Error getting CTO snapshot:', error);
    throw error;
  }
};

// ============================================
// #11: COMPLIANCE & AUDIT
// ============================================

export const saveKnowledgeCoverage = async (
  repoId: string,
  coverage: Omit<KnowledgeCoverage, 'repoId'>
): Promise<void> => {
  try {
    const coverageRef = doc(db, 'knowledgeCoverage', repoId);
    await setDoc(coverageRef, {
      repoId,
      ...coverage
    });
  } catch (error) {
    console.error('Error saving knowledge coverage:', error);
    throw error;
  }
};

export const getKnowledgeCoverage = async (repoId: string): Promise<KnowledgeCoverage | null> => {
  try {
    const coverageRef = doc(db, 'knowledgeCoverage', repoId);
    const snapshot = await getDoc(coverageRef);
    if (snapshot.exists()) {
      return snapshot.data() as KnowledgeCoverage;
    }
    return null;
  } catch (error) {
    console.error('Error getting knowledge coverage:', error);
    throw error;
  }
};

// ============================================
// #12: DUE DILIGENCE
// ============================================

export const saveDueDiligenceReport = async (
  repoUrl: string,
  report: Omit<DueDiligenceReport, 'repoUrl' | 'generatedAt'>
): Promise<string> => {
  try {
    const reportsRef = collection(db, 'dueDiligenceReports');
    const docRef = await addDoc(reportsRef, {
      repoUrl,
      ...report,
      generatedAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving due diligence report:', error);
    throw error;
  }
};

export const getDueDiligenceReport = async (repoUrl: string): Promise<DueDiligenceReport | null> => {
  try {
    const q = query(
      collection(db, 'dueDiligenceReports'),
      where('repoUrl', '==', repoUrl),
      orderBy('generatedAt', 'desc'),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs[0].data() as DueDiligenceReport;
    }
    return null;
  } catch (error) {
    console.error('Error getting due diligence report:', error);
    throw error;
  }
};

// ============================================
// #13: DECISION EXPLANATION
// ============================================

export const saveDecisionExplanation = async (
  userId: string,
  context: string,
  explanation: DecisionExplanation
): Promise<void> => {
  try {
    const expRef = doc(db, 'decisionExplanations', `${userId}_${btoa(context).slice(0, 20)}`);
    await setDoc(expRef, {
      userId,
      context,
      ...explanation,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving decision explanation:', error);
    throw error;
  }
};

export const getDecisionExplanation = async (
  userId: string,
  context: string
): Promise<DecisionExplanation | null> => {
  try {
    const expRef = doc(db, 'decisionExplanations', `${userId}_${btoa(context).slice(0, 20)}`);
    const snapshot = await getDoc(expRef);
    if (snapshot.exists()) {
      return snapshot.data() as DecisionExplanation;
    }
    return null;
  } catch (error) {
    console.error('Error getting decision explanation:', error);
    throw error;
  }
};

// ============================================
// #14: LIVING DOCUMENTATION
// ============================================

export const saveLivingDoc = async (doc_data: Omit<LivingDoc, 'id'>): Promise<string> => {
  try {
    const docsRef = collection(db, 'livingDocs');
    const docRef = await addDoc(docsRef, doc_data);
    return docRef.id;
  } catch (error) {
    console.error('Error saving living doc:', error);
    throw error;
  }
};

export const getLivingDocs = async (repoId: string): Promise<LivingDoc[]> => {
  try {
    const q = query(
      collection(db, 'livingDocs'),
      where('repoId', '==', repoId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LivingDoc));
  } catch (error) {
    console.error('Error getting living docs:', error);
    throw error;
  }
};

export const updateLivingDoc = async (id: string, updates: Partial<LivingDoc>): Promise<void> => {
  try {
    const docRef = doc(db, 'livingDocs', id);
    await updateDoc(docRef, {
      ...updates,
      lastGenerated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating living doc:', error);
    throw error;
  }
};

// ============================================
// #15: TEAM MEMORY
// ============================================

export const saveTeamMemory = async (
  repoId: string,
  memory: Omit<TeamMemory, 'repoId' | 'lastUpdated'>
): Promise<void> => {
  try {
    const memoryRef = doc(db, 'teamMemory', repoId);
    await setDoc(memoryRef, {
      repoId,
      ...memory,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error('Error saving team memory:', error);
    throw error;
  }
};

export const getTeamMemory = async (repoId: string): Promise<TeamMemory | null> => {
  try {
    const memoryRef = doc(db, 'teamMemory', repoId);
    const snapshot = await getDoc(memoryRef);
    if (snapshot.exists()) {
      return snapshot.data() as TeamMemory;
    }
    return null;
  } catch (error) {
    console.error('Error getting team memory:', error);
    throw error;
  }
};

export const addFAQ = async (repoId: string, faq: Omit<FAQ, 'id' | 'addedAt'>): Promise<void> => {
  try {
    const memory = await getTeamMemory(repoId);
    const newFAQ = {
      ...faq,
      id: `faq_${Date.now()}`,
      addedAt: new Date().toISOString()
    };
    
    const updatedFAQs = memory ? [...memory.faqs, newFAQ] : [newFAQ];
    
    await saveTeamMemory(repoId, {
      faqs: updatedFAQs,
      commonMistakes: memory?.commonMistakes || [],
      learningPaths: memory?.learningPaths || [],
      knowledgeGraph: memory?.knowledgeGraph || { nodes: [], edges: [] }
    });
  } catch (error) {
    console.error('Error adding FAQ:', error);
    throw error;
  }
};

export const addCommonMistake = async (
  repoId: string,
  mistake: Omit<CommonMistake, 'id' | 'detectedAt'>
): Promise<void> => {
  try {
    const memory = await getTeamMemory(repoId);
    const newMistake = {
      ...mistake,
      id: `mistake_${Date.now()}`,
      detectedAt: new Date().toISOString()
    };
    
    const updatedMistakes = memory ? [...memory.commonMistakes, newMistake] : [newMistake];
    
    await saveTeamMemory(repoId, {
      faqs: memory?.faqs || [],
      commonMistakes: updatedMistakes,
      learningPaths: memory?.learningPaths || [],
      knowledgeGraph: memory?.knowledgeGraph || { nodes: [], edges: [] }
    });
  } catch (error) {
    console.error('Error adding common mistake:', error);
    throw error;
  }
};
