/**
 * Webhook Handler Service
 * Process incoming webhooks from GitHub and other services
 */

import { 
  doc, 
  setDoc, 
  collection, 
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { notificationService } from './notification-service';
import { taskQueueService } from './task-queue-service';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type WebhookSource = 'github' | 'gitlab' | 'bitbucket' | 'custom';

export type GitHubEventType = 
  | 'push'
  | 'pull_request'
  | 'pull_request_review'
  | 'issues'
  | 'issue_comment'
  | 'create'
  | 'delete'
  | 'fork'
  | 'star'
  | 'release'
  | 'workflow_run'
  | 'check_run'
  | 'deployment'
  | 'deployment_status';

export interface WebhookEvent {
  id: string;
  source: WebhookSource;
  eventType: string;
  payload: Record<string, unknown>;
  signature?: string;
  receivedAt: string;
  processedAt?: string;
  status: 'pending' | 'processing' | 'processed' | 'failed';
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface WebhookSubscription {
  id: string;
  userId: string;
  repoUrl: string;
  source: WebhookSource;
  events: string[];
  secret: string;
  active: boolean;
  createdAt: string;
  lastEventAt?: string;
}

export interface GitHubPushPayload {
  ref: string;
  before: string;
  after: string;
  repository: {
    id: number;
    name: string;
    full_name: string;
    html_url: string;
    default_branch: string;
  };
  pusher: {
    name: string;
    email: string;
  };
  sender: {
    login: string;
    avatar_url: string;
  };
  commits: Array<{
    id: string;
    message: string;
    author: {
      name: string;
      email: string;
    };
    url: string;
    added: string[];
    removed: string[];
    modified: string[];
  }>;
  head_commit?: {
    id: string;
    message: string;
  };
}

export interface GitHubPullRequestPayload {
  action: 'opened' | 'closed' | 'reopened' | 'synchronize' | 'edited' | 'review_requested';
  number: number;
  pull_request: {
    id: number;
    number: number;
    title: string;
    body: string | null;
    state: 'open' | 'closed';
    html_url: string;
    user: {
      login: string;
      avatar_url: string;
    };
    head: {
      ref: string;
      sha: string;
    };
    base: {
      ref: string;
      sha: string;
    };
    merged: boolean;
    merged_at: string | null;
    additions: number;
    deletions: number;
    changed_files: number;
  };
  repository: {
    id: number;
    name: string;
    full_name: string;
    html_url: string;
  };
  sender: {
    login: string;
    avatar_url: string;
  };
}

export interface GitHubIssuePayload {
  action: 'opened' | 'closed' | 'reopened' | 'edited' | 'assigned' | 'unassigned' | 'labeled' | 'unlabeled';
  issue: {
    id: number;
    number: number;
    title: string;
    body: string | null;
    state: 'open' | 'closed';
    html_url: string;
    user: {
      login: string;
      avatar_url: string;
    };
    labels: Array<{ name: string; color: string }>;
    assignees: Array<{ login: string }>;
  };
  repository: {
    id: number;
    name: string;
    full_name: string;
    html_url: string;
  };
  sender: {
    login: string;
    avatar_url: string;
  };
}

export interface WebhookHandler {
  eventType: string;
  handler: (event: WebhookEvent) => Promise<void>;
}

// ============================================================================
// WEBHOOK SERVICE CLASS
// ============================================================================

export class WebhookService {
  private static instance: WebhookService;
  private handlers: Map<string, WebhookHandler['handler'][]> = new Map();

  private constructor() {
    this.registerDefaultHandlers();
  }

  static getInstance(): WebhookService {
    if (!WebhookService.instance) {
      WebhookService.instance = new WebhookService();
    }
    return WebhookService.instance;
  }

  // ============================================
  // WEBHOOK PROCESSING
  // ============================================

  /**
   * Process incoming webhook
   */
  async processWebhook(
    source: WebhookSource,
    eventType: string,
    payload: Record<string, unknown>,
    signature?: string
  ): Promise<WebhookEvent> {
    const eventId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const event: WebhookEvent = {
      id: eventId,
      source,
      eventType,
      payload,
      signature,
      receivedAt: new Date().toISOString(),
      status: 'pending'
    };

    // Save event
    await setDoc(doc(db, 'webhookEvents', eventId), event);

    try {
      // Verify signature if provided
      if (signature) {
        const isValid = await this.verifySignature(source, payload, signature);
        if (!isValid) {
          throw new Error('Invalid webhook signature');
        }
      }

      // Update status to processing
      await setDoc(doc(db, 'webhookEvents', eventId), {
        ...event,
        status: 'processing'
      });

      // Get handlers for this event type
      const handlerKey = `${source}:${eventType}`;
      const handlers = this.handlers.get(handlerKey) || [];

      // Execute handlers
      for (const handler of handlers) {
        await handler(event);
      }

      // Update status to processed
      await setDoc(doc(db, 'webhookEvents', eventId), {
        ...event,
        status: 'processed',
        processedAt: new Date().toISOString()
      });

      return { ...event, status: 'processed', processedAt: new Date().toISOString() };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await setDoc(doc(db, 'webhookEvents', eventId), {
        ...event,
        status: 'failed',
        error: errorMessage,
        processedAt: new Date().toISOString()
      });

      return { ...event, status: 'failed', error: errorMessage };
    }
  }

  /**
   * Verify webhook signature
   */
  private async verifySignature(
    source: WebhookSource,
    payload: Record<string, unknown>,
    signature: string
  ): Promise<boolean> {
    // In production, verify using the appropriate method for each source
    switch (source) {
      case 'github':
        return this.verifyGitHubSignature(payload, signature);
      case 'gitlab':
        return this.verifyGitLabSignature(payload, signature);
      default:
        return true; // Skip verification for unknown sources
    }
  }

  /**
   * Verify GitHub webhook signature
   */
  private async verifyGitHubSignature(
    payload: Record<string, unknown>,
    signature: string
  ): Promise<boolean> {
    // GitHub uses HMAC-SHA256
    // Format: sha256=<hash>
    
    // Get the subscription to find the secret
    const repoUrl = (payload.repository as Record<string, unknown>)?.html_url as string;
    if (!repoUrl) return false;

    const subscription = await this.getSubscriptionByRepoUrl(repoUrl);
    if (!subscription) return true; // No subscription means no verification needed

    const secret = subscription.secret;
    if (!secret) return true;

    try {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const data = encoder.encode(JSON.stringify(payload));
      const signatureBuffer = await crypto.subtle.sign('HMAC', key, data);
      const expectedSignature = 'sha256=' + Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      return signature === expectedSignature;
    } catch {
      return false;
    }
  }

  /**
   * Verify GitLab webhook signature
   */
  private async verifyGitLabSignature(
    _payload: Record<string, unknown>,
    _signature: string
  ): Promise<boolean> {
    // GitLab uses a token in X-Gitlab-Token header
    // Implementation would compare against stored secret
    return true;
  }

  // ============================================
  // SUBSCRIPTION MANAGEMENT
  // ============================================

  /**
   * Create webhook subscription
   */
  async createSubscription(
    userId: string,
    repoUrl: string,
    source: WebhookSource,
    events: string[]
  ): Promise<WebhookSubscription> {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const secret = this.generateSecret();

    const subscription: WebhookSubscription = {
      id: subscriptionId,
      userId,
      repoUrl,
      source,
      events,
      secret,
      active: true,
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'webhookSubscriptions', subscriptionId), subscription);

    return subscription;
  }

  /**
   * Get subscription by repo URL
   */
  private async getSubscriptionByRepoUrl(repoUrl: string): Promise<WebhookSubscription | null> {
    const q = query(
      collection(db, 'webhookSubscriptions'),
      where('repoUrl', '==', repoUrl),
      where('active', '==', true)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    return snapshot.docs[0].data() as WebhookSubscription;
  }

  /**
   * Get user subscriptions
   */
  async getUserSubscriptions(userId: string): Promise<WebhookSubscription[]> {
    const q = query(
      collection(db, 'webhookSubscriptions'),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as WebhookSubscription);
  }

  /**
   * Update subscription
   */
  async updateSubscription(
    subscriptionId: string,
    updates: Partial<Omit<WebhookSubscription, 'id' | 'userId' | 'createdAt'>>
  ): Promise<void> {
    await setDoc(doc(db, 'webhookSubscriptions', subscriptionId), updates, { merge: true });
  }

  /**
   * Delete subscription
   */
  async deleteSubscription(subscriptionId: string): Promise<void> {
    await setDoc(doc(db, 'webhookSubscriptions', subscriptionId), { active: false }, { merge: true });
  }

  /**
   * Generate webhook secret
   */
  private generateSecret(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ============================================
  // HANDLER REGISTRATION
  // ============================================

  /**
   * Register event handler
   */
  registerHandler(
    source: WebhookSource,
    eventType: string,
    handler: WebhookHandler['handler']
  ): () => void {
    const key = `${source}:${eventType}`;
    const handlers = this.handlers.get(key) || [];
    handlers.push(handler);
    this.handlers.set(key, handlers);

    return () => {
      const currentHandlers = this.handlers.get(key) || [];
      const index = currentHandlers.indexOf(handler);
      if (index > -1) {
        currentHandlers.splice(index, 1);
        this.handlers.set(key, currentHandlers);
      }
    };
  }

  /**
   * Register default handlers
   */
  private registerDefaultHandlers(): void {
    // GitHub Push Handler
    this.registerHandler('github', 'push', async (event) => {
      const payload = event.payload as unknown as GitHubPushPayload;
      const repoUrl = payload.repository.html_url;
      const repoName = payload.repository.name;
      const branch = payload.ref.replace('refs/heads/', '');
      const commitCount = payload.commits?.length || 0;

      console.log(`[Webhook] Push to ${repoName}/${branch}: ${commitCount} commits`);

      // Find users watching this repo
      const watchers = await this.getRepoWatchers(repoUrl);

      // Notify watchers
      for (const userId of watchers) {
        await notificationService.createNotification(userId, 'documentation_updated', {
          docName: `${repoName} (${branch})`,
          docId: payload.after,
          repoName,
          commitCount: String(commitCount)
        });
      }

      // Queue re-analysis if on default branch
      if (branch === payload.repository.default_branch) {
        for (const userId of watchers) {
          await taskQueueService.createTask(userId, 'repository_analysis', {
            userId,
            repoUrl,
            trigger: 'push_webhook'
          }, {
            priority: 'low'
          });
        }
      }
    });

    // GitHub Pull Request Handler
    this.registerHandler('github', 'pull_request', async (event) => {
      const payload = event.payload as unknown as GitHubPullRequestPayload;
      const repoUrl = payload.repository.html_url;
      const repoName = payload.repository.name;
      const prNumber = payload.pull_request.number;
      const prTitle = payload.pull_request.title;
      const action = payload.action;

      console.log(`[Webhook] PR ${action} on ${repoName}#${prNumber}: ${prTitle}`);

      // Find users watching this repo
      const watchers = await this.getRepoWatchers(repoUrl);

      // Notify based on action
      if (action === 'opened' || action === 'reopened') {
        for (const userId of watchers) {
          await notificationService.createNotification(userId, 'task_assigned', {
            taskId: `pr_${prNumber}`,
            taskTitle: `Review PR: ${prTitle}`,
            difficulty: 'intermediate',
            moduleName: repoName
          });
        }
      }

      if (action === 'closed' && payload.pull_request.merged) {
        for (const userId of watchers) {
          await notificationService.createNotification(userId, 'milestone_reached', {
            milestoneName: `PR #${prNumber} merged`,
            repoName
          });
        }
      }
    });

    // GitHub Issue Handler
    this.registerHandler('github', 'issues', async (event) => {
      const payload = event.payload as unknown as GitHubIssuePayload;
      const repoUrl = payload.repository.html_url;
      const repoName = payload.repository.name;
      const issueNumber = payload.issue.number;
      const issueTitle = payload.issue.title;
      const action = payload.action;

      console.log(`[Webhook] Issue ${action} on ${repoName}#${issueNumber}: ${issueTitle}`);

      // For "good first issue" labeled issues, suggest as tasks
      if (action === 'labeled') {
        const hasGoodFirstIssue = payload.issue.labels.some(
          l => l.name.toLowerCase().includes('good first issue')
        );

        if (hasGoodFirstIssue) {
          const watchers = await this.getRepoWatchers(repoUrl);
          
          for (const userId of watchers) {
            await notificationService.createNotification(userId, 'task_assigned', {
              taskId: `issue_${issueNumber}`,
              taskTitle: issueTitle,
              difficulty: 'beginner',
              moduleName: repoName
            });
          }
        }
      }
    });

    // GitHub Workflow Run Handler
    this.registerHandler('github', 'workflow_run', async (event) => {
      const payload = event.payload as Record<string, unknown>;
      const workflowRun = payload.workflow_run as Record<string, unknown>;
      const conclusion = workflowRun.conclusion as string;
      const repository = payload.repository as Record<string, unknown>;
      const repoUrl = repository.html_url as string;
      const repoName = repository.name as string;

      if (conclusion === 'failure') {
        console.log(`[Webhook] Workflow failed on ${repoName}`);
        
        const watchers = await this.getRepoWatchers(repoUrl);
        
        for (const userId of watchers) {
          await notificationService.createNotification(userId, 'system_alert', {
            alertMessage: `CI/CD workflow failed on ${repoName}. Check the build logs.`
          });
        }
      }
    });
  }

  /**
   * Get users watching a repository
   */
  private async getRepoWatchers(repoUrl: string): Promise<string[]> {
    const q = query(
      collection(db, 'webhookSubscriptions'),
      where('repoUrl', '==', repoUrl),
      where('active', '==', true)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data().userId);
  }

  // ============================================
  // WEBHOOK URL GENERATION
  // ============================================

  /**
   * Generate webhook URL for a subscription
   */
  getWebhookUrl(subscriptionId: string): string {
    const baseUrl = import.meta.env.VITE_WEBHOOK_BASE_URL || 'https://api.example.com';
    return `${baseUrl}/webhooks/${subscriptionId}`;
  }

  /**
   * Get setup instructions for GitHub webhook
   */
  getGitHubSetupInstructions(subscription: WebhookSubscription): string {
    return `
## GitHub Webhook Setup

1. Go to your repository settings on GitHub
2. Navigate to "Webhooks" in the sidebar
3. Click "Add webhook"
4. Configure the webhook:
   - **Payload URL**: ${this.getWebhookUrl(subscription.id)}
   - **Content type**: application/json
   - **Secret**: ${subscription.secret}
   - **Events**: Select "Let me select individual events" and choose:
     ${subscription.events.map(e => `- ${e}`).join('\n     ')}
5. Click "Add webhook"

Your webhook is now configured and will receive events for the selected actions.
    `.trim();
  }
}

// Export singleton instance
export const webhookService = WebhookService.getInstance();
