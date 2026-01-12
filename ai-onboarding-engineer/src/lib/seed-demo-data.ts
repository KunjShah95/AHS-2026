/**
 * Demo Data Seeding Script for Advanced Features
 * Run this to populate Firestore with realistic demo data
 */

import {
  saveCodeFlow,
  saveCriticalPath,
  saveTechDebtHeatmap,
  saveLearningStreak,
  saveConfidenceMetrics,
  saveCTOSnapshot
} from './advanced-features-db';

import type { CodeFlow, CriticalPath, TechDebtHeatmap, LearningStreak, ConfidenceMetrics, CTOSnapshot } from './types/advanced-features';

export const seedDemoData = async (userId: string, teamId: string = 'demo-team') => {
  console.log('🌱 Seeding demo data...');

  try {
    // Seed Code Flows
    await seedCodeFlows();
    
    // Seed Critical Paths
    await seedCriticalPaths();
    
    // Seed Tech Debt Heatmap
    await seedTechDebtHeatmap();
    
    // Seed Learning Progress
    await seedLearningProgress(userId);
    
    // Seed CTO Dashboard
    await seedCTODashboard(teamId);
    
    console.log('✅ Demo data seeded successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    throw error;
  }
};

// ============================================
// CODE FLOWS
// ============================================

const seedCodeFlows = async () => {
  console.log('  📊 Seeding code flows...');
  
  const flows: Omit<CodeFlow, 'id'>[] = [
    {
      repoId: 'demo-repo',
      entryPoint: 'POST /api/auth/login',
      entryType: 'endpoint',
      flowSteps: [
        {
          id: 'step1',
          type: 'api',
          file: 'src/api/auth/login.ts',
          function: 'handleLogin',
          lineNumber: 15,
          description: 'API endpoint handler - receives email and password',
          code: 'export async function handleLogin(req: Request, res: Response) {\n  const { email, password } = req.body;\n  return await validateCredentials(email, password);\n}',
          nextSteps: ['validateCredentials'],
          duration: 50
        },
        {
          id: 'step2',
          type: 'service',
          file: 'src/services/auth.service.ts',
          function: 'validateCredentials',
          lineNumber: 42,
          description: 'Validates email and password against database',
          code: 'const user = await User.findOne({ email });\nif (!user || !await bcrypt.compare(password, user.password)) {\n  throw new AuthError();\n}',
          nextSteps: ['generateToken'],
          duration: 120
        },
        {
          id: 'step3',
          type: 'service',
          file: 'src/services/token.service.ts',
          function: 'generateToken',
          lineNumber: 28,
          description: 'Generates JWT access and refresh tokens',
          code: 'const accessToken = jwt.sign({ userId: user.id }, SECRET, { expiresIn: "15m" });\nconst refreshToken = jwt.sign({ userId: user.id }, REFRESH_SECRET, { expiresIn: "7d" });',
          nextSteps: ['saveSession'],
          duration: 30
        },
        {
          id: 'step4',
          type: 'database',
          file: 'src/services/session.service.ts',
          function: 'saveSession',
          lineNumber: 35,
          description: 'Persists session to database',
          code: 'await Session.create({\n  userId: user.id,\n  refreshToken,\n  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)\n});',
          nextSteps: [],
          duration: 85
        }
      ],
      isCriticalPath: true,
      complexity: 7,
      estimatedImpact: 95,
      createdAt: new Date().toISOString()
    },
    {
      repoId: 'demo-repo',
      entryPoint: 'GET /api/users/:id',
      entryType: 'endpoint',
      flowSteps: [
        {
          id: 'step1',
          type: 'api',
          file: 'src/api/users/get-user.ts',
          function: 'getUser',
          lineNumber: 10,
          description: 'Fetches user by ID',
          code: 'const userId = req.params.id;\nconst user = await UserService.findById(userId);',
          nextSteps: ['findById'],
          duration: 20
        },
        {
          id: 'step2',
          type: 'database',
          file: 'src/services/user.service.ts',
          function: 'findById',
          lineNumber: 55,
          description: 'Database query for user',
          code: 'return await User.findByPk(userId, {\n  include: [Profile, Settings]\n});',
          nextSteps: [],
          duration: 95
        }
      ],
      isCriticalPath: false,
      complexity: 3,
      estimatedImpact: 45,
      createdAt: new Date().toISOString()
    }
  ];

  for (const flow of flows) {
    await saveCodeFlow(flow);
  }
  
  console.log(`    ✓ Created ${flows.length} code flows`);
};

// ============================================
// CRITICAL PATHS
// ============================================

const seedCriticalPaths = async () => {
  console.log('  🎯 Seeding critical paths...');
  
  const paths: Omit<CriticalPath, 'id'>[] = [
    {
      repoId: 'demo-repo',
      name: 'Authentication Flow',
      description: 'Complete user authentication including login, token generation, and session management',
      files: ['src/api/auth/login.ts', 'src/services/auth.service.ts', 'src/services/token.service.ts'],
      entryPoints: ['POST /api/auth/login', 'POST /api/auth/register'],
      businessValue: 95,
      changeFrequency: 5,
      priority: 'critical',
      mustUnderstandFirst: true,
      tags: ['auth', 'security', 'core']
    },
    {
      repoId: 'demo-repo',
      name: 'Payment Processing',
      description: 'Handles payment transactions, webhooks, and subscription management',
      files: ['src/api/payments/checkout.ts', 'src/services/stripe.service.ts'],
      entryPoints: ['POST /api/payments/checkout', 'POST /webhooks/stripe'],
      businessValue: 98,
      changeFrequency: 8,
      priority: 'critical',
      mustUnderstandFirst: true,
      tags: ['payments', 'revenue', 'core']
    },
    {
      repoId: 'demo-repo',
      name: 'Data Export',
      description: 'User data export for GDPR compliance',
      files: ['src/api/export/data.ts', 'src/services/export.service.ts'],
      entryPoints: ['GET /api/export/my-data'],
      businessValue: 75,
      changeFrequency: 2,
      priority: 'high',
      mustUnderstandFirst: false,
      tags: ['compliance', 'gdpr']
    }
  ];

  for (const path of paths) {
    await saveCriticalPath(path);
  }
  
  console.log(`    ✓ Created ${paths.length} critical paths`);
};

// ============================================
// TECH DEBT HEATMAP
// ============================================

const seedTechDebtHeatmap = async () => {
  console.log('  🔥 Seeding tech debt heatmap...');
  
  const heatmap: Omit<TechDebtHeatmap, 'repoId' | 'generatedAt'> = {
    files: [
      {
        file: 'src/api/auth/login.ts',
        complexity: 45,
        changeFrequency: 23,
        lastModified: '2026-01-10T10:30:00Z',
        contributors: ['alice@example.com', 'bob@example.com'],
        knowledgeOwnership: 60,
        linesOfCode: 234,
        testCoverage: 85,
        riskScore: 52,
        riskLevel: 'medium'
      },
      {
        file: 'src/services/payment-processor.ts',
        complexity: 78,
        changeFrequency: 15,
        lastModified: '2026-01-08T14:20:00Z',
        contributors: ['charlie@example.com'],
        knowledgeOwnership: 20,
        linesOfCode: 567,
        testCoverage: 45,
        riskScore: 85,
        riskLevel: 'critical'
      },
      {
        file: 'src/utils/crypto.ts',
        complexity: 92,
        changeFrequency: 2,
        lastModified: '2025-11-15T09:00:00Z',
        contributors: ['alice@example.com'],
        knowledgeOwnership: 15,
        linesOfCode: 892,
        testCoverage: 95,
        riskScore: 72,
        riskLevel: 'high'
      },
      {
        file: 'src/api/users/list.ts',
        complexity: 25,
        changeFrequency: 8,
        lastModified: '2026-01-11T16:45:00Z',
        contributors: ['alice@example.com', 'bob@example.com', 'charlie@example.com'],
        knowledgeOwnership: 85,
        linesOfCode: 125,
        testCoverage: 90,
        riskScore: 22,
        riskLevel: 'low'
      },
      {
        file: 'src/middleware/rate-limiter.ts',
        complexity: 38,
        changeFrequency: 12,
        lastModified: '2026-01-05T11:30:00Z',
        contributors: ['bob@example.com', 'charlie@example.com'],
        knowledgeOwnership: 55,
        linesOfCode: 178,
        testCoverage: 75,
        riskScore: 48,
        riskLevel: 'medium'
      }
    ],
    overallRisk: 58,
    criticalFiles: ['src/services/payment-processor.ts'],
    recommendations: [
      'Add comprehensive tests to payment-processor.ts (current coverage: 45%)',
      'Refactor crypto.ts to reduce complexity (current: 92)',
      'Document payment-processor.ts - only 1 person understands it',
      'Consider pair programming on critical authentication flows',
      'Add error handling and logging to high-risk modules'
    ]
  };

  await saveTechDebtHeatmap('demo-repo', heatmap);
  console.log(`    ✓ Created tech debt heatmap with ${heatmap.files.length} files`);
};

// ============================================
// LEARNING PROGRESS
// ============================================

const seedLearningProgress = async (userId: string) => {
  console.log('  📚 Seeding learning progress...');
  
  // Generate 90 days of streak history
  const today = new Date();
  const streakHistory = [];
  for (let i = 89; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    streakHistory.push({
      date: date.toISOString(),
      active: Math.random() > 0.3 // 70% active rate
    });
  }

  const streak: Partial<LearningStreak> = {
    currentStreak: 7,
    longestStreak: 15,
    streakHistory,
    achievementsUnlocked: [
      'First Day',
      'First Week',
      'Fast Learner',
      'Consistency Champion',
      '10 Day Streak'
    ]
  };

  await saveLearningStreak(userId, streak);

  // Generate confidence metrics with historical data
  const historicalData = [];
  for (let i = 30; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    historicalData.push({
      date: date.toISOString(),
      score: Math.min(100, 30 + (30 - i) * 2 + Math.random() * 10) // Growing confidence
    });
  }

  const confidence: Partial<ConfidenceMetrics> = {
    overallConfidence: 72,
    confidenceByModule: [
      { module: 'Authentication', score: 85 },
      { module: 'API Endpoints', score: 75 },
      { module: 'Database Models', score: 68 },
      { module: 'Frontend Components', score: 60 },
      { module: 'Testing', score: 55 }
    ],
    growthRate: 5.8,
    historicalData
  };

  await saveConfidenceMetrics(userId, 'demo-repo', confidence);
  console.log('    ✓ Created learning progress with 90-day history');
};

// ============================================
// CTO DASHBOARD
// ============================================

const seedCTODashboard = async (teamId: string) => {
  console.log('  👔 Seeding CTO dashboard...');
  
  const snapshot: Omit<CTOSnapshot, 'teamId' | 'generatedAt'> = {
    onboardingHealth: {
      activeLearners: 8,
      averageProgress: 64,
      atRiskDevelopers: 2
    },
    knowledgeRisk: {
      busFactor: 3,
      criticalSinglePoints: [
        'src/services/payment-processor.ts',
        'src/utils/crypto.ts',
        'src/api/webhooks/stripe.ts'
      ],
      distributionScore: 52
    },
    timeToProductivity: {
      average: 16,
      trend: 'improving',
      byRole: [
        { role: 'Frontend Developer', avgTime: 12 },
        { role: 'Backend Developer', avgTime: 18 },
        { role: 'Full Stack', avgTime: 20 },
        { role: 'DevOps', avgTime: 14 }
      ]
    },
    teamVelocity: {
      tasksPerPerson: 6.8,
      codeQualityScore: 76,
      collaborationIndex: 82
    }
  };

  await saveCTOSnapshot(teamId, snapshot);
  console.log('    ✓ Created CTO dashboard snapshot');
};

// ============================================
// QUICK SEED FUNCTION FOR TESTING
// ============================================

export const quickSeed = async () => {
  // Use demo user and team IDs
  const demoUserId = localStorage.getItem('demoUserId') || 'demo-user-12345';
  const demoTeamId = 'demo-team';
  
  // Store demo IDs for later use
  localStorage.setItem('demoUserId', demoUserId);
  localStorage.setItem('teamId', demoTeamId);
  localStorage.setItem('currentRepoId', 'demo-repo');
  
  await seedDemoData(demoUserId, demoTeamId);
  
  console.log('📦 Quick seed complete! Demo data ready to use.');
  console.log('   Demo User ID:', demoUserId);
  console.log('   Demo Team ID:', demoTeamId);
  console.log('   Demo Repo ID: demo-repo');
};
