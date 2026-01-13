/**
 * Services Index
 * Central export for all backend services
 */

// AI & Generation Services
export { geminiService, GeminiService, PROMPT_TEMPLATES } from './gemini-service';
export type { 
  GeminiConfig, 
  GenerationResult, 
  ConversationMessage, 
  PromptTemplate,
  RateLimitState 
} from './gemini-service';

// GitHub Integration
export { githubService, GitHubService } from './github-service';
export type {
  GitHubRepository,
  GitHubFile,
  GitHubTree,
  GitHubCommit,
  GitHubBranch,
  GitHubContributor,
  GitHubIssue,
  GitHubPullRequest,
  GitHubRateLimit,
  RepositoryStats
} from './github-service';

// Repository Analysis
export { repositoryAnalyzer, RepositoryAnalyzer } from './repository-analyzer';
export type {
  AnalysisJob,
  CodebaseStructure,
  TechnologyStack,
  CodeComplexity,
  DocumentationQuality,
  TestingCoverage,
  DependencyAnalysis,
  OnboardingDifficulty,
  FullAnalysisResult
} from './repository-analyzer';

// Notifications
export { notificationService, NotificationService } from './notification-service';
export type {
  NotificationType,
  NotificationPriority,
  NotificationChannel,
  Notification,
  NotificationPreferences,
  NotificationStats
} from './notification-service';

// Analytics
export { analyticsService, AnalyticsService } from './analytics-service';
export type {
  EventCategory,
  AnalyticsEvent,
  UserSession,
  UserMetrics,
  PlatformMetrics,
  PerformanceMetric,
  ConversionFunnel
} from './analytics-service';

// Background Tasks
export { taskQueueService, TaskQueueService } from './task-queue-service';
export type {
  TaskType,
  TaskStatus,
  TaskPriority,
  BackgroundTask,
  TaskWorker,
  QueueStats
} from './task-queue-service';

// ============================================================================
// SERVICE INITIALIZATION
// ============================================================================

/**
 * Initialize all services with configuration
 */
export async function initializeServices(config: {
  geminiApiKey?: string;
  githubToken?: string;
  enableAnalytics?: boolean;
  enableTaskQueue?: boolean;
}): Promise<void> {
  // Configure Gemini
  if (config.geminiApiKey) {
    const { geminiService } = await import('./gemini-service');
    geminiService.updateConfig({ apiKey: config.geminiApiKey });
  }

  // Configure GitHub
  if (config.githubToken) {
    const { githubService } = await import('./github-service');
    githubService.setAccessToken(config.githubToken);
  }

  // Start analytics session
  if (config.enableAnalytics) {
    // Analytics will be started per-user when they log in
    console.log('[Services] Analytics enabled');
  }

  // Start task queue processing
  if (config.enableTaskQueue) {
    const { taskQueueService } = await import('./task-queue-service');
    taskQueueService.registerDefaultHandlers();
    taskQueueService.startProcessing();
    console.log('[Services] Task queue processing started');
  }

  console.log('[Services] All services initialized');
}

/**
 * Cleanup services on shutdown
 */
export async function shutdownServices(): Promise<void> {
  const { taskQueueService } = await import('./task-queue-service');
  const { analyticsService } = await import('./analytics-service');

  // Stop task queue
  taskQueueService.stopProcessing();

  // Flush analytics
  await analyticsService.flushEventQueue();
  analyticsService.stopAutoFlush();

  console.log('[Services] All services shut down');
}
