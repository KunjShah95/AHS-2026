/**
 * Analytics Service
 * Comprehensive usage tracking and metrics for the platform
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
  increment,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type EventCategory = 
  | 'navigation'
  | 'analysis'
  | 'learning'
  | 'task'
  | 'quiz'
  | 'documentation'
  | 'ai_interaction'
  | 'user_action'
  | 'error'
  | 'performance';

export interface AnalyticsEvent {
  id: string;
  userId: string;
  sessionId: string;
  category: EventCategory;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, unknown>;
  timestamp: string;
  userAgent?: string;
  screenResolution?: string;
  locale?: string;
}

export interface UserSession {
  id: string;
  userId: string;
  startedAt: string;
  endedAt?: string;
  duration?: number; // seconds
  pageViews: number;
  events: number;
  referrer?: string;
  entryPage: string;
  exitPage?: string;
  device: {
    type: 'desktop' | 'tablet' | 'mobile';
    browser: string;
    os: string;
  };
}

export interface UserMetrics {
  userId: string;
  totalSessions: number;
  totalTimeSpent: number; // seconds
  averageSessionDuration: number;
  totalPageViews: number;
  totalAnalyses: number;
  totalTasksCompleted: number;
  totalQuizzesTaken: number;
  lastActiveAt: string;
  firstSeenAt: string;
  streakData: {
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string;
  };
  engagementScore: number; // 0-100
}

export interface PlatformMetrics {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  totalUsers: number;
  totalSessions: number;
  averageSessionDuration: number;
  totalAnalyses: number;
  totalTasksCompleted: number;
  popularRepositories: Array<{ name: string; count: number }>;
  featureUsage: Record<string, number>;
  errorRate: number;
  date: string;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 's' | 'bytes' | 'count';
  timestamp: string;
  tags?: Record<string, string>;
}

export interface ConversionFunnel {
  name: string;
  steps: Array<{
    name: string;
    users: number;
    conversionRate: number;
  }>;
  overallConversionRate: number;
}

// ============================================================================
// ANALYTICS SERVICE CLASS
// ============================================================================

export class AnalyticsService {
  private static instance: AnalyticsService;
  private currentSessionId: string | null = null;
  private sessionStartTime: number = 0;
  private eventQueue: AnalyticsEvent[] = [];
  private flushInterval: ReturnType<typeof setInterval> | null = null;

  private constructor() {
    // Start flush interval
    this.startAutoFlush();
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // ============================================
  // SESSION MANAGEMENT
  // ============================================

  /**
   * Start a new analytics session
   */
  async startSession(
    userId: string,
    entryPage: string,
    referrer?: string
  ): Promise<string> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.currentSessionId = sessionId;
    this.sessionStartTime = Date.now();

    const device = this.getDeviceInfo();

    const session: UserSession = {
      id: sessionId,
      userId,
      startedAt: new Date().toISOString(),
      pageViews: 1,
      events: 0,
      referrer,
      entryPage,
      device
    };

    await setDoc(doc(db, 'sessions', sessionId), session);
    
    // Update user metrics
    await this.incrementUserMetric(userId, 'totalSessions');
    await this.updateLastActive(userId);

    return sessionId;
  }

  /**
   * End current session
   */
  async endSession(exitPage?: string): Promise<void> {
    if (!this.currentSessionId) return;

    const duration = Math.round((Date.now() - this.sessionStartTime) / 1000);

    await updateDoc(doc(db, 'sessions', this.currentSessionId), {
      endedAt: new Date().toISOString(),
      duration,
      exitPage
    });

    this.currentSessionId = null;
    this.sessionStartTime = 0;
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  // ============================================
  // EVENT TRACKING
  // ============================================

  /**
   * Track an analytics event
   */
  async trackEvent(
    userId: string,
    category: EventCategory,
    action: string,
    options: {
      label?: string;
      value?: number;
      metadata?: Record<string, unknown>;
      immediate?: boolean;
    } = {}
  ): Promise<void> {
    const event: AnalyticsEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      sessionId: this.currentSessionId || 'no_session',
      category,
      action,
      label: options.label,
      value: options.value,
      metadata: options.metadata,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      screenResolution: typeof window !== 'undefined' 
        ? `${window.screen.width}x${window.screen.height}` 
        : undefined,
      locale: typeof navigator !== 'undefined' ? navigator.language : undefined
    };

    if (options.immediate) {
      await this.saveEvent(event);
    } else {
      this.eventQueue.push(event);
    }

    // Update session event count
    if (this.currentSessionId) {
      await updateDoc(doc(db, 'sessions', this.currentSessionId), {
        events: increment(1)
      });
    }
  }

  /**
   * Track page view
   */
  async trackPageView(
    userId: string,
    pagePath: string,
    pageTitle?: string
  ): Promise<void> {
    await this.trackEvent(userId, 'navigation', 'page_view', {
      label: pagePath,
      metadata: { pageTitle }
    });

    // Update session page views
    if (this.currentSessionId) {
      await updateDoc(doc(db, 'sessions', this.currentSessionId), {
        pageViews: increment(1)
      });
    }

    // Update user page views
    await this.incrementUserMetric(userId, 'totalPageViews');
  }

  /**
   * Track analysis event
   */
  async trackAnalysis(
    userId: string,
    repoUrl: string,
    status: 'started' | 'completed' | 'failed',
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.trackEvent(userId, 'analysis', `analysis_${status}`, {
      label: repoUrl,
      metadata,
      immediate: true
    });

    if (status === 'completed') {
      await this.incrementUserMetric(userId, 'totalAnalyses');
    }
  }

  /**
   * Track task event
   */
  async trackTask(
    userId: string,
    taskId: string,
    action: 'started' | 'completed' | 'abandoned',
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.trackEvent(userId, 'task', `task_${action}`, {
      label: taskId,
      metadata,
      immediate: true
    });

    if (action === 'completed') {
      await this.incrementUserMetric(userId, 'totalTasksCompleted');
    }
  }

  /**
   * Track quiz event
   */
  async trackQuiz(
    userId: string,
    quizId: string,
    action: 'started' | 'completed' | 'abandoned',
    score?: number
  ): Promise<void> {
    await this.trackEvent(userId, 'quiz', `quiz_${action}`, {
      label: quizId,
      value: score,
      immediate: true
    });

    if (action === 'completed') {
      await this.incrementUserMetric(userId, 'totalQuizzesTaken');
    }
  }

  /**
   * Track AI interaction
   */
  async trackAIInteraction(
    userId: string,
    interactionType: 'chat' | 'explanation' | 'generation',
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.trackEvent(userId, 'ai_interaction', interactionType, {
      metadata
    });
  }

  /**
   * Track error
   */
  async trackError(
    userId: string,
    errorType: string,
    errorMessage: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.trackEvent(userId, 'error', errorType, {
      label: errorMessage,
      metadata,
      immediate: true
    });
  }

  /**
   * Track performance metric
   */
  async trackPerformance(
    metric: Omit<PerformanceMetric, 'timestamp'>
  ): Promise<void> {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: new Date().toISOString()
    };

    await setDoc(doc(collection(db, 'performanceMetrics')), fullMetric);
  }

  // ============================================
  // USER METRICS
  // ============================================

  /**
   * Get user metrics
   */
  async getUserMetrics(userId: string): Promise<UserMetrics> {
    const docRef = doc(db, 'userMetrics', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as UserMetrics;
    }

    // Return default metrics
    return {
      userId,
      totalSessions: 0,
      totalTimeSpent: 0,
      averageSessionDuration: 0,
      totalPageViews: 0,
      totalAnalyses: 0,
      totalTasksCompleted: 0,
      totalQuizzesTaken: 0,
      lastActiveAt: new Date().toISOString(),
      firstSeenAt: new Date().toISOString(),
      streakData: {
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: new Date().toISOString().split('T')[0]
      },
      engagementScore: 0
    };
  }

  /**
   * Update user engagement score
   */
  async updateEngagementScore(userId: string): Promise<number> {
    const metrics = await this.getUserMetrics(userId);
    
    // Calculate engagement score based on various factors
    let score = 0;

    // Sessions (max 20 points)
    score += Math.min(20, metrics.totalSessions * 2);

    // Time spent (max 20 points)
    const hoursSpent = metrics.totalTimeSpent / 3600;
    score += Math.min(20, hoursSpent * 2);

    // Tasks completed (max 20 points)
    score += Math.min(20, metrics.totalTasksCompleted * 4);

    // Analyses (max 15 points)
    score += Math.min(15, metrics.totalAnalyses * 5);

    // Quizzes (max 15 points)
    score += Math.min(15, metrics.totalQuizzesTaken * 5);

    // Streak bonus (max 10 points)
    score += Math.min(10, metrics.streakData.currentStreak);

    score = Math.min(100, Math.round(score));

    await updateDoc(doc(db, 'userMetrics', userId), {
      engagementScore: score
    });

    return score;
  }

  /**
   * Update user streak
   */
  async updateStreak(userId: string): Promise<void> {
    const metrics = await this.getUserMetrics(userId);
    const today = new Date().toISOString().split('T')[0];
    const lastDate = metrics.streakData.lastActiveDate;

    let newStreak = metrics.streakData.currentStreak;

    if (lastDate === today) {
      // Already active today
      return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastDate === yesterdayStr) {
      // Continuing streak
      newStreak += 1;
    } else {
      // Streak broken
      newStreak = 1;
    }

    await updateDoc(doc(db, 'userMetrics', userId), {
      'streakData.currentStreak': newStreak,
      'streakData.longestStreak': Math.max(newStreak, metrics.streakData.longestStreak),
      'streakData.lastActiveDate': today
    });
  }

  // ============================================
  // PLATFORM METRICS
  // ============================================

  /**
   * Get platform metrics for a specific date
   */
  async getPlatformMetrics(date: string): Promise<PlatformMetrics | null> {
    const docRef = doc(db, 'platformMetrics', date);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as PlatformMetrics;
    }

    return null;
  }

  /**
   * Calculate and store daily platform metrics
   */
  async calculateDailyMetrics(): Promise<PlatformMetrics> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    
    const dayAgo = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get active users
    const getUniqueUsers = async (since: Date): Promise<number> => {
      const q = query(
        collection(db, 'sessions'),
        where('startedAt', '>=', since.toISOString())
      );
      const snapshot = await getDocs(q);
      const userIds = new Set(snapshot.docs.map(doc => doc.data().userId));
      return userIds.size;
    };

    const [dau, wau, mau] = await Promise.all([
      getUniqueUsers(dayAgo),
      getUniqueUsers(weekAgo),
      getUniqueUsers(monthAgo)
    ]);

    // Get session stats
    const sessionsQuery = query(
      collection(db, 'sessions'),
      where('startedAt', '>=', dayAgo.toISOString())
    );
    const sessionsSnapshot = await getDocs(sessionsQuery);
    const sessions = sessionsSnapshot.docs.map(doc => doc.data());
    
    const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const avgDuration = sessions.length > 0 ? totalDuration / sessions.length : 0;

    // Get total users
    const usersSnapshot = await getDocs(collection(db, 'userMetrics'));
    const totalUsers = usersSnapshot.size;

    // Get analysis count
    const analysisQuery = query(
      collection(db, 'analysisResults'),
      where('savedAt', '>=', dayAgo.toISOString())
    );
    const analysisSnapshot = await getDocs(analysisQuery);

    // Get error rate
    const errorQuery = query(
      collection(db, 'events'),
      where('category', '==', 'error'),
      where('timestamp', '>=', dayAgo.toISOString())
    );
    const errorSnapshot = await getDocs(errorQuery);
    
    const totalEvents = await getDocs(query(
      collection(db, 'events'),
      where('timestamp', '>=', dayAgo.toISOString())
    ));
    
    const errorRate = totalEvents.size > 0 
      ? (errorSnapshot.size / totalEvents.size) * 100 
      : 0;

    const metrics: PlatformMetrics = {
      dailyActiveUsers: dau,
      weeklyActiveUsers: wau,
      monthlyActiveUsers: mau,
      totalUsers,
      totalSessions: sessions.length,
      averageSessionDuration: Math.round(avgDuration),
      totalAnalyses: analysisSnapshot.size,
      totalTasksCompleted: 0, // Would need task completion tracking
      popularRepositories: [], // Would need aggregation
      featureUsage: {}, // Would need feature tracking
      errorRate: Math.round(errorRate * 100) / 100,
      date: dateStr
    };

    // Store metrics
    await setDoc(doc(db, 'platformMetrics', dateStr), metrics);

    return metrics;
  }

  /**
   * Get platform metrics trend
   */
  async getMetricsTrend(days: number = 30): Promise<PlatformMetrics[]> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const q = query(
      collection(db, 'platformMetrics'),
      where('date', '>=', startDate.toISOString().split('T')[0]),
      orderBy('date', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as PlatformMetrics);
  }

  // ============================================
  // FUNNEL ANALYSIS
  // ============================================

  /**
   * Calculate onboarding funnel
   */
  async calculateOnboardingFunnel(): Promise<ConversionFunnel> {
    // Get users who completed each step
    const metricsSnapshot = await getDocs(collection(db, 'userMetrics'));
    const metrics = metricsSnapshot.docs.map(doc => doc.data() as UserMetrics);

    const totalUsers = metrics.length;
    const analyzedRepo = metrics.filter(m => m.totalAnalyses > 0).length;
    const completedTask = metrics.filter(m => m.totalTasksCompleted > 0).length;
    const tookQuiz = metrics.filter(m => m.totalQuizzesTaken > 0).length;
    const highEngagement = metrics.filter(m => m.engagementScore > 50).length;

    const steps = [
      { name: 'Signed Up', users: totalUsers, conversionRate: 100 },
      { name: 'Analyzed Repository', users: analyzedRepo, conversionRate: totalUsers > 0 ? (analyzedRepo / totalUsers) * 100 : 0 },
      { name: 'Completed Task', users: completedTask, conversionRate: analyzedRepo > 0 ? (completedTask / analyzedRepo) * 100 : 0 },
      { name: 'Took Quiz', users: tookQuiz, conversionRate: completedTask > 0 ? (tookQuiz / completedTask) * 100 : 0 },
      { name: 'High Engagement', users: highEngagement, conversionRate: tookQuiz > 0 ? (highEngagement / tookQuiz) * 100 : 0 }
    ];

    return {
      name: 'Onboarding Funnel',
      steps,
      overallConversionRate: totalUsers > 0 ? (highEngagement / totalUsers) * 100 : 0
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Increment a user metric
   */
  private async incrementUserMetric(
    userId: string,
    metric: keyof UserMetrics
  ): Promise<void> {
    const docRef = doc(db, 'userMetrics', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      await updateDoc(docRef, {
        [metric]: increment(1)
      });
    } else {
      const defaultMetrics = await this.getUserMetrics(userId);
      defaultMetrics[metric as 'totalSessions'] = 1;
      await setDoc(docRef, defaultMetrics);
    }
  }

  /**
   * Update last active timestamp
   */
  private async updateLastActive(userId: string): Promise<void> {
    const docRef = doc(db, 'userMetrics', userId);
    await updateDoc(docRef, {
      lastActiveAt: new Date().toISOString()
    }).catch(() => {
      // Document doesn't exist yet, will be created on first metric update
    });
  }

  /**
   * Get device information
   */
  private getDeviceInfo(): UserSession['device'] {
    if (typeof navigator === 'undefined') {
      return { type: 'desktop', browser: 'unknown', os: 'unknown' };
    }

    const ua = navigator.userAgent;
    
    // Detect device type
    let type: 'desktop' | 'tablet' | 'mobile' = 'desktop';
    if (/tablet|ipad/i.test(ua)) type = 'tablet';
    else if (/mobile|iphone|ipod|android.*mobile/i.test(ua)) type = 'mobile';

    // Detect browser
    let browser = 'unknown';
    if (/chrome/i.test(ua) && !/edge/i.test(ua)) browser = 'Chrome';
    else if (/firefox/i.test(ua)) browser = 'Firefox';
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
    else if (/edge/i.test(ua)) browser = 'Edge';
    else if (/msie|trident/i.test(ua)) browser = 'IE';

    // Detect OS
    let os = 'unknown';
    if (/windows/i.test(ua)) os = 'Windows';
    else if (/mac/i.test(ua)) os = 'macOS';
    else if (/linux/i.test(ua)) os = 'Linux';
    else if (/android/i.test(ua)) os = 'Android';
    else if (/ios|iphone|ipad/i.test(ua)) os = 'iOS';

    return { type, browser, os };
  }

  /**
   * Save a single event
   */
  private async saveEvent(event: AnalyticsEvent): Promise<void> {
    await setDoc(doc(db, 'events', event.id), event);
  }

  /**
   * Start auto-flush for event queue
   */
  private startAutoFlush(): void {
    // Flush every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flushEventQueue();
    }, 30000);

    // Also flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flushEventQueue();
      });
    }
  }

  /**
   * Flush event queue
   */
  async flushEventQueue(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    const savePromises = events.map(event => this.saveEvent(event));
    await Promise.allSettled(savePromises);
  }

  /**
   * Stop auto-flush
   */
  stopAutoFlush(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  // ============================================
  // EXPORT & REPORTING
  // ============================================

  /**
   * Export user events for a date range
   */
  async exportUserEvents(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<AnalyticsEvent[]> {
    const q = query(
      collection(db, 'events'),
      where('userId', '==', userId),
      where('timestamp', '>=', startDate),
      where('timestamp', '<=', endDate),
      orderBy('timestamp', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as AnalyticsEvent);
  }

  /**
   * Get top features by usage
   */
  async getTopFeatures(days: number = 30, topN: number = 10): Promise<Array<{
    feature: string;
    count: number;
    uniqueUsers: number;
  }>> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const q = query(
      collection(db, 'events'),
      where('timestamp', '>=', startDate.toISOString()),
      where('category', 'in', ['navigation', 'analysis', 'learning', 'task', 'quiz'])
    );

    const snapshot = await getDocs(q);
    const events = snapshot.docs.map(doc => doc.data() as AnalyticsEvent);

    // Aggregate by action
    const featureMap = new Map<string, { count: number; users: Set<string> }>();
    
    for (const event of events) {
      const key = `${event.category}:${event.action}`;
      const current = featureMap.get(key) || { count: 0, users: new Set() };
      current.count++;
      current.users.add(event.userId);
      featureMap.set(key, current);
    }

    return Array.from(featureMap.entries())
      .map(([feature, data]) => ({
        feature,
        count: data.count,
        uniqueUsers: data.users.size
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, topN);
  }
}

// Export singleton instance
export const analyticsService = AnalyticsService.getInstance();
