/**
 * Advanced Features Type Definitions
 * Supporting all 15 advanced features for CodeFlow
 */

// ============================================
// #1: Flow Tracing
// ============================================

export interface FlowStep {
  id: string;
  type: 'api' | 'controller' | 'service' | 'database' | 'external' | 'util';
  file: string;
  function: string;
  lineNumber: number;
  description: string;
  code: string;
  nextSteps: string[];
  duration?: number; // Estimated execution time in ms
}

export interface CodeFlow {
  id: string;
  repoId: string;
  entryPoint: string;
  entryType: 'endpoint' | 'function' | 'event';
  flowSteps: FlowStep[];
  isCriticalPath: boolean;
  complexity: number;
  estimatedImpact: number; // 0-100 score
  createdAt: string;
}

// ============================================
// #2: Critical Path Identification
// ============================================

export interface CriticalPath {
  id: string;
  repoId: string;
  name: string;
  description: string;
  files: string[];
  entryPoints: string[];
  businessValue: number; // 0-100
  changeFrequency: number; // changes per month
  priority: 'critical' | 'high' | 'medium' | 'low';
  mustUnderstandFirst: boolean;
  tags: string[];
}

// ============================================
// #3: Tech Debt Heatmap
// ============================================

export interface TechDebtMetrics {
  file: string;
  complexity: number; // Cyclomatic complexity
  changeFrequency: number; // Git commits in last 90 days
  lastModified: string;
  contributors: string[];
  knowledgeOwnership: number; // 0-100, how many people understand it
  linesOfCode: number;
  testCoverage: number; // 0-100
  riskScore: number; // 0-100, calculated risk
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
}

export interface TechDebtHeatmap {
  repoId: string;
  files: TechDebtMetrics[];
  overallRisk: number;
  criticalFiles: string[];
  recommendations: string[];
  generatedAt: string;
}

// ============================================
// #4: Skill Gap Detection
// ============================================

export interface SkillGap {
  skill: string;
  reason: string;
  estimatedTimeToFix: number;
  requiredProficiency: number;
  currentProficiency: number;
  suggestedResources: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  technology: string;
  currentLevel: number; // 0-100
  requiredLevel: number; // 0-100
  gap: number; // requiredLevel - currentLevel
  learningResources: string[];
  estimatedTimeToClose: number; // in hours
}

export interface DeveloperSkillProfile {
  gaps: SkillGap[];
  currentLevel: string;
  targetLevel: string;
  userId: string;
  repoId: string;
  skillGaps: SkillGap[];
  strengths: string[];
  recommendations: string[];
  overallReadiness: number; // 0-100
  assessedAt: string;
}

// ============================================
// #5: Onboarding Benchmarks
// ============================================

export interface OnboardingMetrics {
  userId: string;
  repoId: string;
  startedAt: string;
  timeToFirstTask: number; // hours
  timeToFirstPR: number; // hours
  totalOnboardingTime: number; // hours
  tasksCompleted: number;
  quizScore: number; // 0-100
  confidenceLevel: number; // 0-100
  completedAt?: string;
}

export interface OnboardingBenchmark {
  repoId: string;
  averageOnboardingTime: number;
  fastestOnboardingTime: number;
  slowestOnboardingTime: number;
  teamAverage: number;
  monthlyTrend: { month: string; avgTime: number }[];
  topPerformers: { name: string; role: string; time: number }[];
}

// ============================================
// #6: Probation Success Predictor
// ============================================

export interface ProbationPrediction {
  userId: string;
  repoId: string;
  successProbability: number; // 0-100
  confidenceLevel: number; // 0-100
  factors: {
    learningVelocity: number;
    taskSuccessRate: number;
    engagementLevel: number;
    codeQuality: number;
    teamCollaboration: number;
  };
  risks: string[];
  recommendations: string[];
  predictedAt: string;
}

// ============================================
// #7: "Where Should I Look?" Feature
// ============================================

export interface FileSuggestion {
  file: string;
  relevanceScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  reason: string;
  suggestedAction: 'start_here' | 'review' | 'avoid';
  relatedFiles: string[];
  estimatedComplexity: number; // 0-100
}

export interface WhereLookResult {
  query: string;
  repoId: string;
  suggestions: FileSuggestion[];
  confidence: number; // 0-100
  generatedAt: string;
}

// ============================================
// #8: Experience Level Toggle
// ============================================

export type ExperienceLevel = 'junior' | 'mid' | 'senior' | 'expert';

export interface AdaptiveExplanation {
  code: string;
  level: ExperienceLevel;
  explanation: string;
  concepts: string[];
  resources: string[];
  verbosity: 'concise' | 'detailed' | 'comprehensive';
}

// ============================================
// #9: Learning Streaks & Confidence
// ============================================

export interface LearningStreak {
  userId: string;
  currentStreak: number; // days
  longestStreak: number; // days
  lastActiveDate: string;
  streakHistory: { date: string; active: boolean }[];
  achievementsUnlocked: string[];
}

export interface ConfidenceMetrics {
  userId: string;
  repoId: string;
  overallConfidence: number; // 0-100
  confidenceByModule: { module: string; score: number }[];
  growthRate: number; // % per week
  historicalData: { date: string; score: number }[];
}

// ============================================
// #10: CTO Dashboard
// ============================================

export interface CTOSnapshot {
  teamId: string;
  onboardingHealth: {
    activeLearners: number;
    averageProgress: number; // 0-100
    atRiskDevelopers: number;
  };
  knowledgeRisk: {
    busFactor: number; // How many people need to leave before critical knowledge is lost
    criticalSinglePoints: string[]; // Files only  one person knows
    distributionScore: number; // 0-100, how well knowledge is distributed
  };
  timeToProductivity: {
    average: number; // days
    trend: 'improving' | 'stable' | 'declining';
    byRole: { role: string; avgTime: number }[];
  };
  teamVelocity: {
    tasksPerPerson: number;
    codeQualityScore: number;
    collaborationIndex: number;
  };
  generatedAt: string;
}

// ============================================
// #11: Compliance & Audit
// ============================================

export interface ComplianceRecord {
  userId: string;
  repoId: string;
  module: string;
  competencyLevel: number; // 0-100
  assessedAt: string;
  assessmentMethod: 'quiz' | 'task' | 'review';
  certifiedBy?: string;
}

export interface KnowledgeCoverage {
  repoId: string;
  totalModules: number;
  coveredModules: number;
  coveragePercentage: number;
  coverageByPerson: { userId: string; modules: string[] }[];
  gaps: string[];
  auditTrail: ComplianceRecord[];
}

// ============================================
// #12: Acquisition/Due Diligence
// ============================================

export interface DueDiligenceReport {
  repoUrl: string;
  complexityScore: number; // 0-100
  knowledgeRisk: number; // 0-100
  onboardingDifficulty: number; // 0-100
  estimatedOnboardingTime: number; // weeks
  technicalDebt: {
    overall: number;
    criticalIssues: string[];
  };
  teamSizeEstimate: {
    current: number;
    recommended: number;
  };
  recommendations: string[];
  comparisonMetrics: {
    vsIndustryAverage: number;
    vsSimilarProjects: number;
  };
  generatedAt: string;
}

// ============================================
// #13: Decision Explanation
// ============================================

export interface DecisionExplanation {
  decision: string;
  reasoning: string[];
  confidence: number; // 0-100
  alternatives: {
    option: string;
    probability: number;
    reason: string;
  }[];
  dataPoints: string[];
  sources: string[];
}

// ============================================
// #14: Living Documentation
// ============================================

export interface LivingDoc {
  id: string;
  repoId: string;
  title: string;
  content: string;
  format: 'markdown' | 'html';
  sections: {
    title: string;
    content: string;
    sourceFiles: string[];
  }[];
  lastGenerated: string;
  autoUpdateEnabled: boolean;
  versionHistory: {
    version: number;
    generatedAt: string;
    changes: string[];
  }[];
}

// ============================================
// #15: Team Memory
// ============================================

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  frequency: number;
  category: string;
  relatedFiles: string[];
  addedAt: string;
}

export interface CommonMistake {
  id: string;
  description: string;
  context: string;
  frequency: number;
  userIds: string[];
  solution: string;
  prevention: string;
  severity: 'low' | 'medium' | 'high';
  detectedAt: string;
}

export interface TeamMemory {
  repoId: string;
  faqs: FAQ[];
  commonMistakes: CommonMistake[];
  learningPaths: {
    id: string;
    name: string;
    steps: string[];
    successRate: number;
  }[];
  knowledgeGraph: {
    nodes: { id: string; label: string; type: string }[];
    edges: { from: string; to: string; relation: string }[];
  };
  lastUpdated: string;
}
