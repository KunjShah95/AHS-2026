/**
 * GitHub Service
 * Comprehensive GitHub API integration for repository analysis
 */

import { doc, setDoc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

// TYPES & INTERFACES

export interface GitHubRepository {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  owner: {
    login: string;
    avatarUrl: string;
    type: 'User' | 'Organization';
  };
  url: string;
  cloneUrl: string;
  defaultBranch: string;
  language: string | null;
  languages: Record<string, number>;
  stargazersCount: number;
  forksCount: number;
  watchersCount: number;
  openIssuesCount: number;
  size: number;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  isPrivate: boolean;
  isArchived: boolean;
  topics: string[];
  license: string | null;
}

export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  type: 'file' | 'dir';
  content?: string;
  encoding?: string;
}

export interface GitHubTree {
  sha: string;
  truncated: boolean;
  tree: Array<{
    path: string;
    mode: string;
    type: 'blob' | 'tree';
    sha: string;
    size?: number;
    url: string;
  }>;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  committer: {
    name: string;
    email: string;
    date: string;
  };
  parents: Array<{ sha: string }>;
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
  files?: Array<{
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
    patch?: string;
  }>;
}

export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

export interface GitHubContributor {
  login: string;
  avatarUrl: string;
  contributions: number;
  type: string;
}

export interface GitHubIssue {
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  labels: Array<{ name: string; color: string }>;
  assignees: Array<{ login: string }>;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  user: {
    login: string;
    avatarUrl: string;
  };
}

export interface GitHubPullRequest {
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed' | 'merged';
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
    sha: string;
  };
  user: {
    login: string;
    avatarUrl: string;
  };
  createdAt: string;
  updatedAt: string;
  mergedAt: string | null;
  additions: number;
  deletions: number;
  changedFiles: number;
}

export interface GitHubRateLimit {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
}

export interface RepositoryStats {
  totalFiles: number;
  totalLines: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
  languageBreakdown: Record<string, number>;
  fileTypes: Record<string, number>;
  largestFiles: Array<{ path: string; size: number }>;
  recentActivity: {
    commitsLast30Days: number;
    commitsLast7Days: number;
    uniqueAuthors: number;
  };
}

// GITHUB SERVICE CLASS

export class GitHubService {
  private static instance: GitHubService;
  private accessToken: string | null = null;
  private rateLimit: GitHubRateLimit | null = null;
  private baseUrl = 'https://api.github.com';

  private constructor() {}

  static getInstance(): GitHubService {
    if (!GitHubService.instance) {
      GitHubService.instance = new GitHubService();
    }
    return GitHubService.instance;
  }

  // AUTHENTICATION

  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  async getAccessToken(): Promise<string | null> {
    return this.accessToken;
  }

  // API REQUEST HELPER

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
      ...(options.headers || {})
    };

    if (this.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `token ${this.accessToken}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers
    });

    // Update rate limit info
    this.rateLimit = {
      limit: parseInt(response.headers.get('X-RateLimit-Limit') || '60'),
      remaining: parseInt(response.headers.get('X-RateLimit-Remaining') || '0'),
      reset: parseInt(response.headers.get('X-RateLimit-Reset') || '0'),
      used: parseInt(response.headers.get('X-RateLimit-Used') || '0')
    };

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `GitHub API error: ${response.status}`);
    }

    return response.json();
  }

  getRateLimit(): GitHubRateLimit | null {
    return this.rateLimit;
  }

  // REPOSITORY METHODS

  /**
   * Parse repository URL to extract owner and repo name
   */
  parseRepoUrl(url: string): { owner: string; repo: string } | null {
    const patterns = [
      /github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/|$)/,
      /^([^/]+)\/([^/]+)$/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return { owner: match[1], repo: match[2].replace('.git', '') };
      }
    }

    return null;
  }

  /**
   * Get repository information
   */
  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    const data = await this.request<Record<string, unknown>>(`/repos/${owner}/${repo}`);
    
    // Get languages
    const languages = await this.request<Record<string, number>>(`/repos/${owner}/${repo}/languages`);

    return {
      id: data.id as number,
      name: data.name as string,
      fullName: data.full_name as string,
      description: data.description as string | null,
      owner: {
        login: (data.owner as Record<string, unknown>).login as string,
        avatarUrl: (data.owner as Record<string, unknown>).avatar_url as string,
        type: (data.owner as Record<string, unknown>).type as 'User' | 'Organization'
      },
      url: data.html_url as string,
      cloneUrl: data.clone_url as string,
      defaultBranch: data.default_branch as string,
      language: data.language as string | null,
      languages,
      stargazersCount: data.stargazers_count as number,
      forksCount: data.forks_count as number,
      watchersCount: data.watchers_count as number,
      openIssuesCount: data.open_issues_count as number,
      size: data.size as number,
      createdAt: data.created_at as string,
      updatedAt: data.updated_at as string,
      pushedAt: data.pushed_at as string,
      isPrivate: data.private as boolean,
      isArchived: data.archived as boolean,
      topics: data.topics as string[] || [],
      license: (data.license as Record<string, unknown>)?.name as string || null
    };
  }

  /**
   * Get repository tree (all files and directories)
   */
  async getRepositoryTree(
    owner: string,
    repo: string,
    ref: string = 'HEAD'
  ): Promise<GitHubTree> {
    return this.request<GitHubTree>(
      `/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`
    );
  }

  /**
   * Get file content
   */
  async getFileContent(
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<GitHubFile> {
    const endpoint = `/repos/${owner}/${repo}/contents/${path}${ref ? `?ref=${ref}` : ''}`;
    const data = await this.request<Record<string, unknown>>(endpoint);

    return {
      name: data.name as string,
      path: data.path as string,
      sha: data.sha as string,
      size: data.size as number,
      url: data.html_url as string,
      type: data.type as 'file' | 'dir',
      content: data.content as string | undefined,
      encoding: data.encoding as string | undefined
    };
  }

  /**
   * Get decoded file content
   */
  async getDecodedFileContent(
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<string> {
    const file = await this.getFileContent(owner, repo, path, ref);
    
    if (file.content && file.encoding === 'base64') {
      return atob(file.content.replace(/\n/g, ''));
    }

    throw new Error('Unable to decode file content');
  }

  /**
   * Get multiple files in parallel
   */
  async getMultipleFiles(
    owner: string,
    repo: string,
    paths: string[],
    maxConcurrent: number = 5
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    
    for (let i = 0; i < paths.length; i += maxConcurrent) {
      const batch = paths.slice(i, i + maxConcurrent);
      const promises = batch.map(async (path) => {
        try {
          const content = await this.getDecodedFileContent(owner, repo, path);
          return { path, content };
        } catch {
          return { path, content: '' };
        }
      });
      
      const batchResults = await Promise.all(promises);
      for (const { path, content } of batchResults) {
        if (content) {
          results.set(path, content);
        }
      }
    }

    return results;
  }

  // COMMIT METHODS

  /**
   * Get commit list
   */
  async getCommits(
    owner: string,
    repo: string,
    options: {
      sha?: string;
      path?: string;
      author?: string;
      since?: string;
      until?: string;
      perPage?: number;
      page?: number;
    } = {}
  ): Promise<GitHubCommit[]> {
    const params = new URLSearchParams();
    if (options.sha) params.set('sha', options.sha);
    if (options.path) params.set('path', options.path);
    if (options.author) params.set('author', options.author);
    if (options.since) params.set('since', options.since);
    if (options.until) params.set('until', options.until);
    params.set('per_page', String(options.perPage || 30));
    params.set('page', String(options.page || 1));

    const data = await this.request<Array<Record<string, unknown>>>(
      `/repos/${owner}/${repo}/commits?${params.toString()}`
    );

    return data.map(commit => this.mapCommit(commit));
  }

  /**
   * Get single commit with diff
   */
  async getCommit(
    owner: string,
    repo: string,
    ref: string
  ): Promise<GitHubCommit> {
    const data = await this.request<Record<string, unknown>>(
      `/repos/${owner}/${repo}/commits/${ref}`
    );
    return this.mapCommit(data);
  }

  /**
   * Get diff between two commits
   */
  async getCommitDiff(
    owner: string,
    repo: string,
    base: string,
    head: string
  ): Promise<{
    status: string;
    aheadBy: number;
    behindBy: number;
    totalCommits: number;
    files: Array<{
      filename: string;
      status: string;
      additions: number;
      deletions: number;
      changes: number;
    }>;
  }> {
    const data = await this.request<Record<string, unknown>>(
      `/repos/${owner}/${repo}/compare/${base}...${head}`
    );

    return {
      status: data.status as string,
      aheadBy: data.ahead_by as number,
      behindBy: data.behind_by as number,
      totalCommits: data.total_commits as number,
      files: (data.files as Array<Record<string, unknown>>)?.map(f => ({
        filename: f.filename as string,
        status: f.status as string,
        additions: f.additions as number,
        deletions: f.deletions as number,
        changes: f.changes as number
      })) || []
    };
  }

  private mapCommit(data: Record<string, unknown>): GitHubCommit {
    const commit = data.commit as Record<string, unknown>;
    const author = commit.author as Record<string, unknown>;
    const committer = commit.committer as Record<string, unknown>;
    const stats = data.stats as Record<string, unknown> | undefined;
    const files = data.files as Array<Record<string, unknown>> | undefined;

    return {
      sha: data.sha as string,
      message: commit.message as string,
      author: {
        name: author.name as string,
        email: author.email as string,
        date: author.date as string
      },
      committer: {
        name: committer.name as string,
        email: committer.email as string,
        date: committer.date as string
      },
      parents: (data.parents as Array<Record<string, unknown>>)?.map(p => ({
        sha: p.sha as string
      })) || [],
      stats: stats ? {
        additions: stats.additions as number,
        deletions: stats.deletions as number,
        total: stats.total as number
      } : undefined,
      files: files?.map(f => ({
        filename: f.filename as string,
        status: f.status as string,
        additions: f.additions as number,
        deletions: f.deletions as number,
        changes: f.changes as number,
        patch: f.patch as string | undefined
      }))
    };
  }

  // BRANCH METHODS

  /**
   * Get branches
   */
  async getBranches(owner: string, repo: string): Promise<GitHubBranch[]> {
    const data = await this.request<Array<Record<string, unknown>>>(
      `/repos/${owner}/${repo}/branches`
    );

    return data.map(branch => ({
      name: branch.name as string,
      commit: {
        sha: (branch.commit as Record<string, unknown>).sha as string,
        url: (branch.commit as Record<string, unknown>).url as string
      },
      protected: branch.protected as boolean
    }));
  }

  // CONTRIBUTOR METHODS

  /**
   * Get contributors
   */
  async getContributors(owner: string, repo: string): Promise<GitHubContributor[]> {
    const data = await this.request<Array<Record<string, unknown>>>(
      `/repos/${owner}/${repo}/contributors`
    );

    return data.map(contributor => ({
      login: contributor.login as string,
      avatarUrl: contributor.avatar_url as string,
      contributions: contributor.contributions as number,
      type: contributor.type as string
    }));
  }

  // ISSUES & PULL REQUESTS

  /**
   * Get issues
   */
  async getIssues(
    owner: string,
    repo: string,
    options: {
      state?: 'open' | 'closed' | 'all';
      labels?: string;
      sort?: 'created' | 'updated' | 'comments';
      direction?: 'asc' | 'desc';
      perPage?: number;
      page?: number;
    } = {}
  ): Promise<GitHubIssue[]> {
    const params = new URLSearchParams();
    params.set('state', options.state || 'open');
    if (options.labels) params.set('labels', options.labels);
    params.set('sort', options.sort || 'created');
    params.set('direction', options.direction || 'desc');
    params.set('per_page', String(options.perPage || 30));
    params.set('page', String(options.page || 1));

    const data = await this.request<Array<Record<string, unknown>>>(
      `/repos/${owner}/${repo}/issues?${params.toString()}`
    );

    return data
      .filter(issue => !issue.pull_request) // Exclude PRs
      .map(issue => ({
        number: issue.number as number,
        title: issue.title as string,
        body: issue.body as string | null,
        state: issue.state as 'open' | 'closed',
        labels: (issue.labels as Array<Record<string, unknown>>)?.map(l => ({
          name: l.name as string,
          color: l.color as string
        })) || [],
        assignees: (issue.assignees as Array<Record<string, unknown>>)?.map(a => ({
          login: a.login as string
        })) || [],
        createdAt: issue.created_at as string,
        updatedAt: issue.updated_at as string,
        closedAt: issue.closed_at as string | null,
        user: {
          login: (issue.user as Record<string, unknown>).login as string,
          avatarUrl: (issue.user as Record<string, unknown>).avatar_url as string
        }
      }));
  }

  /**
   * Get pull requests
   */
  async getPullRequests(
    owner: string,
    repo: string,
    options: {
      state?: 'open' | 'closed' | 'all';
      sort?: 'created' | 'updated' | 'popularity' | 'long-running';
      direction?: 'asc' | 'desc';
      perPage?: number;
      page?: number;
    } = {}
  ): Promise<GitHubPullRequest[]> {
    const params = new URLSearchParams();
    params.set('state', options.state || 'open');
    params.set('sort', options.sort || 'created');
    params.set('direction', options.direction || 'desc');
    params.set('per_page', String(options.perPage || 30));
    params.set('page', String(options.page || 1));

    const data = await this.request<Array<Record<string, unknown>>>(
      `/repos/${owner}/${repo}/pulls?${params.toString()}`
    );

    return data.map(pr => ({
      number: pr.number as number,
      title: pr.title as string,
      body: pr.body as string | null,
      state: pr.merged_at ? 'merged' : pr.state as 'open' | 'closed' | 'merged',
      head: {
        ref: (pr.head as Record<string, unknown>).ref as string,
        sha: (pr.head as Record<string, unknown>).sha as string
      },
      base: {
        ref: (pr.base as Record<string, unknown>).ref as string,
        sha: (pr.base as Record<string, unknown>).sha as string
      },
      user: {
        login: (pr.user as Record<string, unknown>).login as string,
        avatarUrl: (pr.user as Record<string, unknown>).avatar_url as string
      },
      createdAt: pr.created_at as string,
      updatedAt: pr.updated_at as string,
      mergedAt: pr.merged_at as string | null,
      additions: pr.additions as number || 0,
      deletions: pr.deletions as number || 0,
      changedFiles: pr.changed_files as number || 0
    }));
  }

  // ANALYTICS METHODS

  /**
   * Generate repository statistics
   */
  async getRepositoryStats(owner: string, repo: string): Promise<RepositoryStats> {
    // Get tree for file stats
    const tree = await this.getRepositoryTree(owner, repo);
    
    // Get languages
    const repository = await this.getRepository(owner, repo);
    
    // Get recent commits
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const commitsLast30Days = await this.getCommits(owner, repo, {
      since: thirtyDaysAgo.toISOString(),
      perPage: 100
    });

    const commitsLast7Days = commitsLast30Days.filter(
      c => new Date(c.author.date) > sevenDaysAgo
    );

    // Calculate file stats
    const files = tree.tree.filter(item => item.type === 'blob');
    const fileTypes: Record<string, number> = {};
    const largestFiles: Array<{ path: string; size: number }> = [];

    for (const file of files) {
      const ext = file.path.split('.').pop() || 'unknown';
      fileTypes[ext] = (fileTypes[ext] || 0) + 1;
      
      if (file.size) {
        largestFiles.push({ path: file.path, size: file.size });
      }
    }

    largestFiles.sort((a, b) => b.size - a.size);

    // Unique authors
    const uniqueAuthors = new Set(commitsLast30Days.map(c => c.author.email)).size;

    // Calculate language breakdown
    const totalBytes = Object.values(repository.languages).reduce((a, b) => a + b, 0);
    const languageBreakdown: Record<string, number> = {};
    for (const [lang, bytes] of Object.entries(repository.languages)) {
      languageBreakdown[lang] = Math.round((bytes / totalBytes) * 100);
    }

    return {
      totalFiles: files.length,
      totalLines: 0, // Would need to fetch file contents to calculate
      codeLines: 0,
      commentLines: 0,
      blankLines: 0,
      languageBreakdown,
      fileTypes,
      largestFiles: largestFiles.slice(0, 10),
      recentActivity: {
        commitsLast30Days: commitsLast30Days.length,
        commitsLast7Days: commitsLast7Days.length,
        uniqueAuthors
      }
    };
  }

  // CACHING METHODS

  /**
   * Cache repository data
   */
  async cacheRepository(
    userId: string,
    owner: string,
    repo: string,
    data: Partial<GitHubRepository>
  ): Promise<void> {
    const cacheKey = `repo:${owner}/${repo}`;
    const docRef = doc(db, 'githubCache', cacheKey);
    
    await setDoc(docRef, {
      userId,
      owner,
      repo,
      data,
      cachedAt: new Date().toISOString()
    }, { merge: true });
  }

  /**
   * Get cached repository data
   */
  async getCachedRepository(
    owner: string,
    repo: string,
    maxAge: number = 3600000 // 1 hour
  ): Promise<GitHubRepository | null> {
    const cacheKey = `repo:${owner}/${repo}`;
    const docRef = doc(db, 'githubCache', cacheKey);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const cached = docSnap.data();
      const age = Date.now() - new Date(cached.cachedAt).getTime();
      
      if (age < maxAge) {
        return cached.data as GitHubRepository;
      }
    }

    return null;
  }

  /**
   * Get user's recent repositories
   */
  async getUserRecentRepositories(userId: string, limitCount: number = 10): Promise<Array<{
    owner: string;
    repo: string;
    accessedAt: string;
  }>> {
    const q = query(
      collection(db, 'repoAccess'),
      where('userId', '==', userId),
      orderBy('accessedAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      owner: doc.data().owner,
      repo: doc.data().repo,
      accessedAt: doc.data().accessedAt
    }));
  }

  /**
   * Track repository access
   */
  async trackRepositoryAccess(
    userId: string,
    owner: string,
    repo: string
  ): Promise<void> {
    const docRef = doc(db, 'repoAccess', `${userId}:${owner}/${repo}`);
    
    await setDoc(docRef, {
      userId,
      owner,
      repo,
      accessedAt: new Date().toISOString()
    });
  }
}

// Export singleton instance
export const githubService = GitHubService.getInstance();
