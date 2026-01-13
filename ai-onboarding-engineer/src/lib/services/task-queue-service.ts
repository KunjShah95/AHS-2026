/**
 * Background Task Queue Service
 * Async job processing for long-running operations
 */

import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc,
  orderBy,
  limit,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { db } from '../firebase';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type TaskType = 
  | 'repository_analysis'
  | 'roadmap_generation'
  | 'documentation_generation'
  | 'code_graph_build'
  | 'ai_batch_process'
  | 'export_data'
  | 'cleanup'
  | 'notification_batch'
  | 'metrics_calculation';

export type TaskStatus = 
  | 'pending'
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'retrying';

export type TaskPriority = 'low' | 'normal' | 'high' | 'critical';

export interface BackgroundTask {
  id: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  payload: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: string;
  progress: number; // 0-100
  progressMessage?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  retries: number;
  maxRetries: number;
  userId: string;
  workerId?: string;
  timeout: number; // milliseconds
  scheduledFor?: string; // ISO date for scheduled tasks
  dependencies?: string[]; // IDs of tasks that must complete first
  metadata?: Record<string, unknown>;
}

export interface TaskWorker {
  id: string;
  type: TaskType;
  handler: (task: BackgroundTask) => Promise<Record<string, unknown> | void>;
  concurrency: number;
  timeout: number;
}

export interface QueueStats {
  pending: number;
  running: number;
  completed: number;
  failed: number;
  byType: Record<TaskType, number>;
  byPriority: Record<TaskPriority, number>;
  averageWaitTime: number;
  averageProcessingTime: number;
}

// ============================================================================
// TASK QUEUE SERVICE
// ============================================================================

export class TaskQueueService {
  private static instance: TaskQueueService;
  private workers: Map<TaskType, TaskWorker> = new Map();
  private runningTasks: Map<string, AbortController> = new Map();
  private listeners: Map<string, Unsubscribe> = new Map();
  private isProcessing: boolean = false;
  private processInterval: ReturnType<typeof setInterval> | null = null;

  private constructor() {}

  static getInstance(): TaskQueueService {
    if (!TaskQueueService.instance) {
      TaskQueueService.instance = new TaskQueueService();
    }
    return TaskQueueService.instance;
  }

  // ============================================
  // TASK CREATION
  // ============================================

  /**
   * Create and queue a new task
   */
  async createTask(
    userId: string,
    type: TaskType,
    payload: Record<string, unknown>,
    options: {
      priority?: TaskPriority;
      maxRetries?: number;
      timeout?: number;
      scheduledFor?: Date;
      dependencies?: string[];
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<BackgroundTask> {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const task: BackgroundTask = {
      id: taskId,
      type,
      status: 'pending',
      priority: options.priority || 'normal',
      payload,
      progress: 0,
      createdAt: new Date().toISOString(),
      retries: 0,
      maxRetries: options.maxRetries ?? 3,
      userId,
      timeout: options.timeout || 300000, // 5 minutes default
      scheduledFor: options.scheduledFor?.toISOString(),
      dependencies: options.dependencies,
      metadata: options.metadata
    };

    await setDoc(doc(db, 'backgroundTasks', taskId), task);

    return task;
  }

  /**
   * Create a batch of tasks
   */
  async createBatchTasks(
    userId: string,
    type: TaskType,
    payloads: Record<string, unknown>[],
    options: {
      priority?: TaskPriority;
      sequential?: boolean;
    } = {}
  ): Promise<BackgroundTask[]> {
    const tasks: BackgroundTask[] = [];
    let previousTaskId: string | undefined;

    for (const payload of payloads) {
      const dependencies = options.sequential && previousTaskId 
        ? [previousTaskId] 
        : undefined;

      const task = await this.createTask(userId, type, payload, {
        priority: options.priority,
        dependencies
      });

      tasks.push(task);
      previousTaskId = task.id;
    }

    return tasks;
  }

  // ============================================
  // TASK RETRIEVAL
  // ============================================

  /**
   * Get task by ID
   */
  async getTask(taskId: string): Promise<BackgroundTask | null> {
    const docRef = doc(db, 'backgroundTasks', taskId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as BackgroundTask;
    }

    return null;
  }

  /**
   * Get user's tasks
   */
  async getUserTasks(
    userId: string,
    options: {
      status?: TaskStatus[];
      type?: TaskType;
      limit?: number;
    } = {}
  ): Promise<BackgroundTask[]> {
    const q = query(
      collection(db, 'backgroundTasks'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(options.limit || 50)
    );

    const snapshot = await getDocs(q);
    let tasks = snapshot.docs.map(doc => doc.data() as BackgroundTask);

    // Filter by status
    if (options.status && options.status.length > 0) {
      tasks = tasks.filter(t => options.status?.includes(t.status));
    }

    // Filter by type
    if (options.type) {
      tasks = tasks.filter(t => t.type === options.type);
    }

    return tasks;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<QueueStats> {
    const snapshot = await getDocs(collection(db, 'backgroundTasks'));
    const tasks = snapshot.docs.map(doc => doc.data() as BackgroundTask);

    const stats: QueueStats = {
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0,
      byType: {} as Record<TaskType, number>,
      byPriority: {} as Record<TaskPriority, number>,
      averageWaitTime: 0,
      averageProcessingTime: 0
    };

    let totalWaitTime = 0;
    let totalProcessingTime = 0;
    let completedCount = 0;

    for (const task of tasks) {
      // Count by status
      if (task.status === 'pending' || task.status === 'queued') stats.pending++;
      else if (task.status === 'running') stats.running++;
      else if (task.status === 'completed') stats.completed++;
      else if (task.status === 'failed') stats.failed++;

      // Count by type
      stats.byType[task.type] = (stats.byType[task.type] || 0) + 1;

      // Count by priority
      stats.byPriority[task.priority] = (stats.byPriority[task.priority] || 0) + 1;

      // Calculate times
      if (task.completedAt && task.startedAt) {
        const processingTime = new Date(task.completedAt).getTime() - new Date(task.startedAt).getTime();
        const waitTime = new Date(task.startedAt).getTime() - new Date(task.createdAt).getTime();
        totalProcessingTime += processingTime;
        totalWaitTime += waitTime;
        completedCount++;
      }
    }

    if (completedCount > 0) {
      stats.averageWaitTime = Math.round(totalWaitTime / completedCount);
      stats.averageProcessingTime = Math.round(totalProcessingTime / completedCount);
    }

    return stats;
  }

  // ============================================
  // TASK MANAGEMENT
  // ============================================

  /**
   * Update task progress
   */
  async updateProgress(
    taskId: string,
    progress: number,
    message?: string
  ): Promise<void> {
    await updateDoc(doc(db, 'backgroundTasks', taskId), {
      progress: Math.min(100, Math.max(0, progress)),
      progressMessage: message
    });
  }

  /**
   * Cancel a task
   */
  async cancelTask(taskId: string): Promise<void> {
    const task = await this.getTask(taskId);
    if (!task) return;

    if (task.status === 'running') {
      // Abort running task
      const controller = this.runningTasks.get(taskId);
      if (controller) {
        controller.abort();
        this.runningTasks.delete(taskId);
      }
    }

    await updateDoc(doc(db, 'backgroundTasks', taskId), {
      status: 'cancelled',
      completedAt: new Date().toISOString()
    });
  }

  /**
   * Retry a failed task
   */
  async retryTask(taskId: string): Promise<void> {
    const task = await this.getTask(taskId);
    if (!task || task.status !== 'failed') return;

    await updateDoc(doc(db, 'backgroundTasks', taskId), {
      status: 'pending',
      retries: task.retries + 1,
      error: undefined,
      progress: 0,
      progressMessage: undefined
    });
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<void> {
    await this.cancelTask(taskId);
    await deleteDoc(doc(db, 'backgroundTasks', taskId));
  }

  /**
   * Clean up old completed/failed tasks
   */
  async cleanupOldTasks(olderThanDays: number = 7): Promise<number> {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    
    const q = query(
      collection(db, 'backgroundTasks'),
      where('status', 'in', ['completed', 'failed', 'cancelled']),
      where('completedAt', '<', cutoffDate.toISOString())
    );

    const snapshot = await getDocs(q);
    let deleted = 0;

    for (const doc of snapshot.docs) {
      await deleteDoc(doc.ref);
      deleted++;
    }

    return deleted;
  }

  // ============================================
  // TASK SUBSCRIPTIONS
  // ============================================

  /**
   * Subscribe to task updates
   */
  subscribeToTask(
    taskId: string,
    callback: (task: BackgroundTask) => void
  ): () => void {
    const unsubscribe = onSnapshot(
      doc(db, 'backgroundTasks', taskId),
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data() as BackgroundTask);
        }
      }
    );

    this.listeners.set(taskId, unsubscribe);

    return () => {
      unsubscribe();
      this.listeners.delete(taskId);
    };
  }

  /**
   * Subscribe to user's tasks
   */
  subscribeToUserTasks(
    userId: string,
    callback: (tasks: BackgroundTask[]) => void
  ): () => void {
    const q = query(
      collection(db, 'backgroundTasks'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(doc => doc.data() as BackgroundTask);
      callback(tasks);
    });

    this.listeners.set(`user_${userId}`, unsubscribe);

    return () => {
      unsubscribe();
      this.listeners.delete(`user_${userId}`);
    };
  }

  // ============================================
  // WORKER MANAGEMENT
  // ============================================

  /**
   * Register a task worker
   */
  registerWorker(worker: TaskWorker): void {
    this.workers.set(worker.type, worker);
  }

  /**
   * Unregister a task worker
   */
  unregisterWorker(type: TaskType): void {
    this.workers.delete(type);
  }

  /**
   * Start processing queue
   */
  startProcessing(intervalMs: number = 5000): void {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    this.processQueue();

    this.processInterval = setInterval(() => {
      this.processQueue();
    }, intervalMs);
  }

  /**
   * Stop processing queue
   */
  stopProcessing(): void {
    this.isProcessing = false;
    
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }

    // Cancel all running tasks
    for (const controller of this.runningTasks.values()) {
      controller.abort();
    }
    this.runningTasks.clear();
  }

  /**
   * Process pending tasks
   */
  private async processQueue(): Promise<void> {
    if (!this.isProcessing) return;

    // Get pending tasks ordered by priority and creation time
    const q = query(
      collection(db, 'backgroundTasks'),
      where('status', 'in', ['pending', 'queued']),
      orderBy('priority', 'desc'),
      orderBy('createdAt', 'asc'),
      limit(10)
    );

    const snapshot = await getDocs(q);
    const tasks = snapshot.docs.map(doc => doc.data() as BackgroundTask);

    for (const task of tasks) {
      // Check if scheduled for later
      if (task.scheduledFor && new Date(task.scheduledFor) > new Date()) {
        continue;
      }

      // Check dependencies
      if (task.dependencies && task.dependencies.length > 0) {
        const allComplete = await this.checkDependencies(task.dependencies);
        if (!allComplete) continue;
      }

      // Check if worker is available
      const worker = this.workers.get(task.type);
      if (!worker) {
        console.warn(`No worker registered for task type: ${task.type}`);
        continue;
      }

      // Check concurrency
      const runningOfType = Array.from(this.runningTasks.keys()).filter(
        id => tasks.find(t => t.id === id)?.type === task.type
      ).length;

      if (runningOfType >= worker.concurrency) {
        continue;
      }

      // Process task
      this.processTask(task, worker);
    }
  }

  /**
   * Process a single task
   */
  private async processTask(task: BackgroundTask, worker: TaskWorker): Promise<void> {
    const controller = new AbortController();
    this.runningTasks.set(task.id, controller);

    try {
      // Update status to running
      await updateDoc(doc(db, 'backgroundTasks', task.id), {
        status: 'running',
        startedAt: new Date().toISOString(),
        workerId: `worker_${Date.now()}`
      });

      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Task timeout')), task.timeout);
      });

      // Run handler with timeout
      const result = await Promise.race([
        worker.handler(task),
        timeoutPromise
      ]);

      // Check if cancelled
      if (controller.signal.aborted) {
        return;
      }

      // Update status to completed
      await updateDoc(doc(db, 'backgroundTasks', task.id), {
        status: 'completed',
        progress: 100,
        result,
        completedAt: new Date().toISOString()
      });

    } catch (error) {
      // Handle failure
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (task.retries < task.maxRetries) {
        // Schedule retry
        await updateDoc(doc(db, 'backgroundTasks', task.id), {
          status: 'retrying',
          retries: task.retries + 1,
          error: errorMessage,
          scheduledFor: new Date(Date.now() + Math.pow(2, task.retries) * 1000).toISOString()
        });

        // After delay, set back to pending
        setTimeout(async () => {
          await updateDoc(doc(db, 'backgroundTasks', task.id), {
            status: 'pending'
          });
        }, Math.pow(2, task.retries) * 1000);

      } else {
        // Max retries reached
        await updateDoc(doc(db, 'backgroundTasks', task.id), {
          status: 'failed',
          error: errorMessage,
          completedAt: new Date().toISOString()
        });
      }
    } finally {
      this.runningTasks.delete(task.id);
    }
  }

  /**
   * Check if all dependencies are completed
   */
  private async checkDependencies(dependencyIds: string[]): Promise<boolean> {
    for (const id of dependencyIds) {
      const task = await this.getTask(id);
      if (!task || task.status !== 'completed') {
        return false;
      }
    }
    return true;
  }

  // ============================================
  // PREDEFINED TASK HANDLERS
  // ============================================

  /**
   * Register default task handlers
   */
  registerDefaultHandlers(): void {
    // Repository analysis handler
    this.registerWorker({
      id: 'repo_analysis_worker',
      type: 'repository_analysis',
      concurrency: 2,
      timeout: 300000,
      handler: async (task) => {
        const { repositoryAnalyzer } = await import('./repository-analyzer');
        const { userId, repoUrl } = task.payload as { userId: string; repoUrl: string };
        
        const result = await repositoryAnalyzer.analyzeRepository(
          userId,
          repoUrl,
          async (progress, message) => {
            await this.updateProgress(task.id, progress, message);
          }
        );
        
        return result as unknown as Record<string, unknown>;
      }
    });

    // Roadmap generation handler
    this.registerWorker({
      id: 'roadmap_worker',
      type: 'roadmap_generation',
      concurrency: 3,
      timeout: 120000,
      handler: async (task) => {
        const { geminiService } = await import('./gemini-service');
        const { codebaseAnalysis, developerLevel, targetSkills, timeConstraint } = 
          task.payload as {
            codebaseAnalysis: string;
            developerLevel: string;
            targetSkills: string[];
            timeConstraint: string;
          };
        
        const result = await geminiService.generateLearningRoadmap(
          codebaseAnalysis,
          developerLevel,
          targetSkills,
          timeConstraint
        );
        
        return result;
      }
    });

    // Documentation generation handler
    this.registerWorker({
      id: 'docs_worker',
      type: 'documentation_generation',
      concurrency: 3,
      timeout: 120000,
      handler: async (task) => {
        const { geminiService } = await import('./gemini-service');
        const { moduleCode, moduleName, relatedModules } = 
          task.payload as {
            moduleCode: string;
            moduleName: string;
            relatedModules: string;
          };
        
        const result = await geminiService.generateDocumentation(
          moduleCode,
          moduleName,
          relatedModules
        );
        
        return { documentation: result };
      }
    });

    // Metrics calculation handler
    this.registerWorker({
      id: 'metrics_worker',
      type: 'metrics_calculation',
      concurrency: 1,
      timeout: 60000,
      handler: async () => {
        const { analyticsService } = await import('./analytics-service');
        const metrics = await analyticsService.calculateDailyMetrics();
        return metrics as unknown as Record<string, unknown>;
      }
    });

    // Cleanup handler
    this.registerWorker({
      id: 'cleanup_worker',
      type: 'cleanup',
      concurrency: 1,
      timeout: 120000,
      handler: async (task) => {
        const { olderThanDays } = task.payload as { olderThanDays?: number };
        
        const tasksCleaned = await this.cleanupOldTasks(olderThanDays || 7);
        
        const { notificationService } = await import('./notification-service');
        const notificationsCleaned = await notificationService.cleanupExpiredNotifications();
        
        return { tasksCleaned, notificationsCleaned };
      }
    });

    // Notification batch handler
    this.registerWorker({
      id: 'notification_batch_worker',
      type: 'notification_batch',
      concurrency: 2,
      timeout: 60000,
      handler: async (task) => {
        const { notificationService } = await import('./notification-service');
        const { userIds, type, data } = task.payload as {
          userIds: string[];
          type: import('./notification-service').NotificationType;
          data: Record<string, string>;
        };
        
        const notifications = await notificationService.createBulkNotifications(
          userIds,
          type,
          data
        );
        
        return { sent: notifications.length };
      }
    });
  }
}

// Export singleton instance
export const taskQueueService = TaskQueueService.getInstance();
