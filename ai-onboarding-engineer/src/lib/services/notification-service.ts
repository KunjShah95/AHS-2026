/**
 * Notification Service
 * Real-time notification system with multiple channels
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
  onSnapshot,
  deleteDoc
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { db } from '../firebase';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type NotificationType = 
  | 'analysis_complete'
  | 'analysis_failed'
  | 'task_assigned'
  | 'task_completed'
  | 'milestone_reached'
  | 'streak_update'
  | 'badge_earned'
  | 'team_update'
  | 'system_alert'
  | 'pr_reminder'
  | 'quiz_available'
  | 'documentation_updated';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type NotificationChannel = 'in_app' | 'email' | 'push' | 'slack';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  read: boolean;
  dismissed: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  readAt?: string;
  expiresAt?: string;
}

export interface NotificationPreferences {
  userId: string;
  enabled: boolean;
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
    slack: boolean;
  };
  types: {
    [key in NotificationType]: {
      enabled: boolean;
      channels: NotificationChannel[];
    };
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;
  };
  digest: {
    enabled: boolean;
    frequency: 'daily' | 'weekly';
    time: string; // HH:mm format
  };
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
}

// ============================================================================
// NOTIFICATION TEMPLATES
// ============================================================================

const NOTIFICATION_TEMPLATES: Record<NotificationType, {
  title: (data: Record<string, string>) => string;
  message: (data: Record<string, string>) => string;
  priority: NotificationPriority;
  defaultAction?: (data: Record<string, string>) => { url: string; label: string };
}> = {
  analysis_complete: {
    title: (data) => `Analysis Complete: ${data.repoName}`,
    message: (data) => `Your analysis of ${data.repoName} is ready. ${data.fileCount} files analyzed in ${data.duration}.`,
    priority: 'medium',
    defaultAction: (data) => ({ url: `/analysis/${data.analysisId}`, label: 'View Analysis' })
  },
  analysis_failed: {
    title: (data) => `Analysis Failed: ${data.repoName}`,
    message: (data) => `We couldn't analyze ${data.repoName}. ${data.error}`,
    priority: 'high',
    defaultAction: (data) => ({ url: `/analysis?retry=${data.repoUrl}`, label: 'Retry' })
  },
  task_assigned: {
    title: (data) => `New Task: ${data.taskTitle}`,
    message: (data) => `You have a new ${data.difficulty} task in ${data.moduleName}.`,
    priority: 'medium',
    defaultAction: (data) => ({ url: `/tasks/${data.taskId}`, label: 'Start Task' })
  },
  task_completed: {
    title: () => 'Task Completed! 🎉',
    message: (data) => `Great job completing "${data.taskTitle}". You earned ${data.xpEarned} XP.`,
    priority: 'low',
    defaultAction: (data) => ({ url: `/tasks?next=${data.nextTaskId}`, label: 'Next Task' })
  },
  milestone_reached: {
    title: (data) => `Milestone Reached: ${data.milestoneName}`,
    message: (data) => `Congratulations! You've reached ${data.milestoneName} in your onboarding journey.`,
    priority: 'medium',
    defaultAction: () => ({ url: '/dashboard', label: 'View Progress' })
  },
  streak_update: {
    title: (data) => `${data.streakDays} Day Streak! 🔥`,
    message: (data) => `You're on a ${data.streakDays} day learning streak. Keep it up!`,
    priority: 'low'
  },
  badge_earned: {
    title: (data) => `Badge Earned: ${data.badgeName}`,
    message: (data) => `You've earned the "${data.badgeName}" badge. ${data.badgeDescription}`,
    priority: 'low',
    defaultAction: () => ({ url: '/profile#badges', label: 'View Badges' })
  },
  team_update: {
    title: (data) => `Team Update: ${data.teamName}`,
    message: (data) => data.updateMessage,
    priority: 'medium',
    defaultAction: (data) => ({ url: `/team/${data.teamId}`, label: 'View Team' })
  },
  system_alert: {
    title: () => 'System Alert',
    message: (data) => data.alertMessage,
    priority: 'urgent'
  },
  pr_reminder: {
    title: () => 'PR Review Reminder',
    message: (data) => `Don't forget to create your first PR for ${data.repoName}. You're ready!`,
    priority: 'medium',
    defaultAction: (data) => ({ url: `/first-pr?repo=${data.repoUrl}`, label: 'Create PR' })
  },
  quiz_available: {
    title: (data) => `Quiz Available: ${data.moduleName}`,
    message: (data) => `Test your knowledge of ${data.moduleName} with this ${data.questionCount} question quiz.`,
    priority: 'low',
    defaultAction: (data) => ({ url: `/quiz/${data.quizId}`, label: 'Take Quiz' })
  },
  documentation_updated: {
    title: (data) => `Docs Updated: ${data.docName}`,
    message: (data) => `The ${data.docName} documentation has been updated with new content.`,
    priority: 'low',
    defaultAction: (data) => ({ url: `/docs/${data.docId}`, label: 'View Docs' })
  }
};

// ============================================================================
// NOTIFICATION SERVICE CLASS
// ============================================================================

export class NotificationService {
  private static instance: NotificationService;
  private listeners: Map<string, Unsubscribe> = new Map();

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // ============================================
  // NOTIFICATION CREATION
  // ============================================

  /**
   * Create a notification from a template
   */
  async createNotification(
    userId: string,
    type: NotificationType,
    data: Record<string, string>,
    options: {
      priority?: NotificationPriority;
      expiresIn?: number; // milliseconds
      channels?: NotificationChannel[];
    } = {}
  ): Promise<Notification> {
    const template = NOTIFICATION_TEMPLATES[type];
    
    const notification: Omit<Notification, 'id'> = {
      userId,
      type,
      title: template.title(data),
      message: template.message(data),
      priority: options.priority || template.priority,
      read: false,
      dismissed: false,
      metadata: data,
      createdAt: new Date().toISOString()
    };

    // Add action if template has one
    if (template.defaultAction) {
      const action = template.defaultAction(data);
      notification.actionUrl = action.url;
      notification.actionLabel = action.label;
    }

    // Add expiration if specified
    if (options.expiresIn) {
      notification.expiresAt = new Date(Date.now() + options.expiresIn).toISOString();
    }

    // Check user preferences
    const shouldSend = await this.checkPreferences(userId, type, options.channels);
    if (!shouldSend) {
      throw new Error('Notification blocked by user preferences');
    }

    // Save to Firestore
    const notificationsRef = collection(db, 'notifications');
    const docRef = doc(notificationsRef);
    const fullNotification: Notification = { id: docRef.id, ...notification };
    
    await setDoc(docRef, fullNotification);

    // Send to other channels if needed
    await this.sendToChannels(fullNotification, options.channels || ['in_app']);

    return fullNotification;
  }

  /**
   * Create a custom notification
   */
  async createCustomNotification(
    userId: string,
    notification: Omit<Notification, 'id' | 'userId' | 'read' | 'dismissed' | 'createdAt'>
  ): Promise<Notification> {
    const fullNotification: Omit<Notification, 'id'> = {
      ...notification,
      userId,
      read: false,
      dismissed: false,
      createdAt: new Date().toISOString()
    };

    const notificationsRef = collection(db, 'notifications');
    const docRef = doc(notificationsRef);
    const savedNotification: Notification = { id: docRef.id, ...fullNotification };
    
    await setDoc(docRef, savedNotification);

    return savedNotification;
  }

  /**
   * Create bulk notifications (e.g., for team updates)
   */
  async createBulkNotifications(
    userIds: string[],
    type: NotificationType,
    data: Record<string, string>
  ): Promise<Notification[]> {
    const notifications: Notification[] = [];
    
    for (const userId of userIds) {
      try {
        const notification = await this.createNotification(userId, type, data);
        notifications.push(notification);
      } catch {
        // Skip users who have blocked this notification type
        continue;
      }
    }

    return notifications;
  }

  // ============================================
  // NOTIFICATION RETRIEVAL
  // ============================================

  /**
   * Get user's notifications
   */
  async getNotifications(
    userId: string,
    options: {
      unreadOnly?: boolean;
      types?: NotificationType[];
      limit?: number;
      includeExpired?: boolean;
    } = {}
  ): Promise<Notification[]> {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('dismissed', '==', false),
      orderBy('createdAt', 'desc'),
      limit(options.limit || 50)
    );

    const snapshot = await getDocs(q);
    let notifications = snapshot.docs.map(doc => doc.data() as Notification);

    // Filter by unread
    if (options.unreadOnly) {
      notifications = notifications.filter(n => !n.read);
    }

    // Filter by type
    if (options.types && options.types.length > 0) {
      notifications = notifications.filter(n => options.types?.includes(n.type));
    }

    // Filter expired
    if (!options.includeExpired) {
      const now = new Date().toISOString();
      notifications = notifications.filter(n => !n.expiresAt || n.expiresAt > now);
    }

    return notifications;
  }

  /**
   * Get notification by ID
   */
  async getNotification(notificationId: string): Promise<Notification | null> {
    const docRef = doc(db, 'notifications', notificationId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as Notification;
    }

    return null;
  }

  /**
   * Get notification stats
   */
  async getNotificationStats(userId: string): Promise<NotificationStats> {
    const notifications = await this.getNotifications(userId, { limit: 1000 });

    const stats: NotificationStats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      byType: {} as Record<NotificationType, number>,
      byPriority: {} as Record<NotificationPriority, number>
    };

    for (const notification of notifications) {
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
      stats.byPriority[notification.priority] = (stats.byPriority[notification.priority] || 0) + 1;
    }

    return stats;
  }

  // ============================================
  // NOTIFICATION ACTIONS
  // ============================================

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const docRef = doc(db, 'notifications', notificationId);
    await updateDoc(docRef, {
      read: true,
      readAt: new Date().toISOString()
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    const notifications = await this.getNotifications(userId, { unreadOnly: true });
    
    const updates = notifications.map(n => 
      updateDoc(doc(db, 'notifications', n.id), {
        read: true,
        readAt: new Date().toISOString()
      })
    );

    await Promise.all(updates);
  }

  /**
   * Dismiss notification
   */
  async dismissNotification(notificationId: string): Promise<void> {
    const docRef = doc(db, 'notifications', notificationId);
    await updateDoc(docRef, {
      dismissed: true
    });
  }

  /**
   * Delete notification permanently
   */
  async deleteNotification(notificationId: string): Promise<void> {
    const docRef = doc(db, 'notifications', notificationId);
    await deleteDoc(docRef);
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(userId: string): Promise<void> {
    const notifications = await this.getNotifications(userId, { limit: 1000 });
    
    const deletes = notifications.map(n => 
      deleteDoc(doc(db, 'notifications', n.id))
    );

    await Promise.all(deletes);
  }

  // ============================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================

  /**
   * Subscribe to real-time notification updates
   */
  subscribeToNotifications(
    userId: string,
    callback: (notifications: Notification[]) => void
  ): () => void {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('dismissed', '==', false),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => doc.data() as Notification);
      callback(notifications);
    });

    // Store unsubscribe function
    this.listeners.set(userId, unsubscribe);

    return () => {
      unsubscribe();
      this.listeners.delete(userId);
    };
  }

  /**
   * Unsubscribe from notifications
   */
  unsubscribeFromNotifications(userId: string): void {
    const unsubscribe = this.listeners.get(userId);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(userId);
    }
  }

  // ============================================
  // PREFERENCES
  // ============================================

  /**
   * Get user notification preferences
   */
  async getPreferences(userId: string): Promise<NotificationPreferences> {
    const docRef = doc(db, 'notificationPreferences', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as NotificationPreferences;
    }

    // Return default preferences
    return this.getDefaultPreferences(userId);
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    const docRef = doc(db, 'notificationPreferences', userId);
    const current = await this.getPreferences(userId);
    
    await setDoc(docRef, {
      ...current,
      ...preferences,
      userId
    });
  }

  /**
   * Get default preferences
   */
  private getDefaultPreferences(userId: string): NotificationPreferences {
    const defaultTypes: NotificationPreferences['types'] = {} as NotificationPreferences['types'];
    
    for (const type of Object.keys(NOTIFICATION_TEMPLATES) as NotificationType[]) {
      defaultTypes[type] = {
        enabled: true,
        channels: ['in_app']
      };
    }

    return {
      userId,
      enabled: true,
      channels: {
        inApp: true,
        email: false,
        push: false,
        slack: false
      },
      types: defaultTypes,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      },
      digest: {
        enabled: false,
        frequency: 'daily',
        time: '09:00'
      }
    };
  }

  /**
   * Check if notification should be sent based on preferences
   */
  private async checkPreferences(
    userId: string,
    type: NotificationType,
    channels?: NotificationChannel[]
  ): Promise<boolean> {
    const preferences = await this.getPreferences(userId);

    // Check if notifications are globally enabled
    if (!preferences.enabled) {
      return false;
    }

    // Check if this type is enabled
    if (!preferences.types[type]?.enabled) {
      return false;
    }

    // Check quiet hours
    if (preferences.quietHours.enabled) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      if (currentTime >= preferences.quietHours.start || currentTime <= preferences.quietHours.end) {
        // Only allow urgent notifications during quiet hours
        const template = NOTIFICATION_TEMPLATES[type];
        if (template.priority !== 'urgent') {
          return false;
        }
      }
    }

    if (channels && channels.length > 0) {
      const channelMap: Record<NotificationChannel, keyof NotificationPreferences['channels']> = {
        in_app: 'inApp',
        email: 'email',
        push: 'push',
        slack: 'slack'
      }; 

      const channelEnabled = channels.some(channel => preferences.channels[channelMap[channel]]);
      if (!channelEnabled) {
        return false;
      }
    }

    return true;
  }

  // ============================================
  // CHANNEL DELIVERY
  // ============================================

  /**
   * Send notification to specific channels
   */
  private async sendToChannels(
    notification: Notification,
    channels: NotificationChannel[]
  ): Promise<void> {
    const sendPromises: Promise<void>[] = [];

    for (const channel of channels) {
      switch (channel) {
        case 'in_app':
          // Already saved to Firestore
          break;
        case 'email':
          sendPromises.push(this.sendEmail(notification));
          break;
        case 'push':
          sendPromises.push(this.sendPush(notification));
          break;
        case 'slack':
          sendPromises.push(this.sendSlack(notification));
          break;
      }
    }

    await Promise.allSettled(sendPromises);
  }

  /**
   * Send email notification (placeholder)
   */
  private async sendEmail(notification: Notification): Promise<void> {
    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    console.log(`[Email] Would send to user ${notification.userId}: ${notification.title}`);
  }

  /**
   * Send push notification (placeholder)
   */
  private async sendPush(notification: Notification): Promise<void> {
    // TODO: Integrate with push service (Firebase Cloud Messaging, etc.)
    console.log(`[Push] Would send to user ${notification.userId}: ${notification.title}`);
  }

  /**
   * Send Slack notification (placeholder)
   */
  private async sendSlack(notification: Notification): Promise<void> {
    // TODO: Integrate with Slack API
    console.log(`[Slack] Would send to user ${notification.userId}: ${notification.title}`);
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Clean up expired notifications
   */
  async cleanupExpiredNotifications(): Promise<number> {
    const now = new Date().toISOString();
    const q = query(
      collection(db, 'notifications'),
      where('expiresAt', '<', now)
    );

    const snapshot = await getDocs(q);
    let deleted = 0;

    for (const doc of snapshot.docs) {
      await deleteDoc(doc.ref);
      deleted++;
    }

    return deleted;
  }

  /**
   * Get notification templates
   */
  getTemplates(): typeof NOTIFICATION_TEMPLATES {
    return NOTIFICATION_TEMPLATES;
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
