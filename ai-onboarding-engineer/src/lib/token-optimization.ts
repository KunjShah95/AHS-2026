/**
 * Token Optimization Engine
 * Implements advanced token-saving strategies for AI code analysis
 */

import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  timestamp: string;
}

export interface OptimizationStrategy {
  name: string;
  enabled: boolean;
  savingsPercentage: number;
  description: string;
  status: 'implemented' | 'planned';
}

export interface FileMetadata {
  path: string;
  size: number;
  priority: number;
  hash: string;
  lastAnalyzed?: string;
  tokens?: number;
}

export interface CodeChunk {
  id: string;
  filePath: string;
  startLine: number;
  endLine: number;
  content: string;
  type: 'class' | 'function' | 'module' | 'comment' | 'import';
  tokens: number;
  dependencies: string[];
  semanticContext: string;
}

export interface AnalysisCache {
  repoUrl: string;
  commitHash: string;
  files: Map<string, FileMetadata>;
  chunks: Map<string, CodeChunk>;
  aiSummaries: Map<string, string>;
  lastUpdated: string;
}

export interface IncrementalUpdate {
  previousCommit: string;
  currentCommit: string;
  changedFiles: string[];
  addedFiles: string[];
  deletedFiles: string[];
  modifiedChunks: string[];
  tokenSavings: number;
}

// ============================================================================
// OPTIMIZATION STRATEGIES
// ============================================================================

export const OPTIMIZATION_STRATEGIES: OptimizationStrategy[] = [
  {
    name: 'Priority-Based Analysis',
    enabled: true,
    savingsPercentage: 20,
    description: 'Analyze high-priority files (entry points, core logic) first, skip low-priority files (tests, configs)',
    status: 'implemented'
  },
  {
    name: 'Vendor/Dependencies Exclusion',
    enabled: true,
    savingsPercentage: 40,
    description: 'Exclude node_modules, vendor folders, and third-party libraries from analysis',
    status: 'implemented'
  },
  {
    name: 'AI Summary Caching',
    enabled: true,
    savingsPercentage: 50,
    description: 'Cache AI-generated summaries and reuse them for unchanged files',
    status: 'implemented'
  },
  {
    name: 'Semantic Code Chunking',
    enabled: true,
    savingsPercentage: 30,
    description: 'Break code into semantic chunks (functions, classes) and analyze only relevant parts',
    status: 'implemented'
  },
  {
    name: 'Incremental Updates',
    enabled: true,
    savingsPercentage: 70,
    description: 'Only analyze files that changed since last commit using git diff',
    status: 'implemented'
  }
];

// ============================================================================
// 1. PRIORITY-BASED ANALYSIS
// ============================================================================

export class PriorityAnalyzer {
  /**
   * Calculate file priority score
   * Higher score = higher priority for analysis
   */
  static calculateFilePriority(filePath: string): number {
    let score = 0.0;

    // Entry points get highest priority
    if (this.isEntryPoint(filePath)) {
      score += 1.0;
    }

    // Core business logic
    if (filePath.includes('/core/') || filePath.includes('/lib/') || filePath.includes('/src/')) {
      score += 0.7;
    }

    // API routes and controllers
    if (filePath.includes('/api/') || filePath.includes('/routes/') || filePath.includes('/controllers/')) {
      score += 0.8;
    }

    // Database models and schemas
    if (filePath.includes('/models/') || filePath.includes('/schemas/')) {
      score += 0.6;
    }

    // Components and views
    if (filePath.includes('/components/') || filePath.includes('/views/')) {
      score += 0.5;
    }

    // Utils and helpers
    if (filePath.includes('/utils/') || filePath.includes('/helpers/')) {
      score += 0.4;
    }

    // Configuration files
    if (filePath.match(/\.(json|yaml|yml|toml|ini|env)$/)) {
      score += 0.2;
    }

    // Tests get lower priority
    if (filePath.includes('/test/') || filePath.includes('/__tests__/') || filePath.match(/\.(test|spec)\./)) {
      score -= 0.5;
    }

    // Documentation
    if (filePath.match(/\.(md|txt|rst)$/)) {
      score -= 0.3;
    }

    // Build artifacts and generated files
    if (filePath.includes('/dist/') || filePath.includes('/build/') || filePath.includes('/.next/')) {
      score = -1.0; // Skip entirely
    }

    return Math.max(score, -1.0);
  }

  /**
   * Check if file is an entry point
   */
  private static isEntryPoint(filePath: string): boolean {
    const entryPoints = [
      'main.ts', 'main.js', 'index.ts', 'index.js',
      'app.ts', 'app.js', 'server.ts', 'server.js',
      '__init__.py', 'main.py'
    ];

    const fileName = filePath.split('/').pop() || '';
    return entryPoints.includes(fileName.toLowerCase());
  }

  /**
   * Sort files by priority
   */
  static sortByPriority(files: string[]): string[] {
    return files
      .map(file => ({
        path: file,
        priority: this.calculateFilePriority(file)
      }))
      .filter(f => f.priority > -1) // Exclude files with negative priority
      .sort((a, b) => b.priority - a.priority)
      .map(f => f.path);
  }
}

// ============================================================================
// 2. VENDOR/DEPENDENCIES EXCLUSION
// ============================================================================

export class DependencyFilter {
  private static readonly EXCLUDED_PATTERNS = [
    /node_modules\//,
    /vendor\//,
    /\.git\//,
    /\.venv\//,
    /venv\//,
    /dist\//,
    /build\//,
    /\.next\//,
    /\.nuxt\//,
    /coverage\//,
    /\.cache\//,
    /\.parcel-cache\//,
    /public\/assets\//,
    /static\/vendor\//,
    /bower_components\//,
    /\.pytest_cache\//,
    /__pycache__\//,
    /\.egg-info\//
  ];

  /**
   * Check if file should be excluded
   */
  static shouldExclude(filePath: string): boolean {
    return this.EXCLUDED_PATTERNS.some(pattern => pattern.test(filePath));
  }

  /**
   * Filter out excluded files
   */
  static filterFiles(files: string[]): string[] {
    return files.filter(file => !this.shouldExclude(file));
  }

  /**
   * Calculate savings from exclusion
   */
  static calculateSavings(totalFiles: number, filteredFiles: number): number {
    const excluded = totalFiles - filteredFiles;
    return totalFiles > 0 ? (excluded / totalFiles) * 100 : 0;
  }
}

// ============================================================================
// 3. AI SUMMARY CACHING
// ============================================================================

export class SummaryCache {
  /**
   * Generate cache key for a file
   */
  static generateCacheKey(repoUrl: string, filePath: string, commitHash: string): string {
    return `${repoUrl}:${filePath}:${commitHash}`;
  }

  /**
   * Save AI summary to Firestore
   */
  static async saveSummary(
    userId: string,
    repoUrl: string,
    filePath: string,
    commitHash: string,
    summary: string,
    tokens: number
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(repoUrl, filePath, commitHash);
    
    await setDoc(doc(db, 'summaryCache', cacheKey), {
      userId,
      repoUrl,
      filePath,
      commitHash,
      summary,
      tokens,
      createdAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString()
    });
  }

  /**
   * Retrieve cached summary
   */
  static async getSummary(
    repoUrl: string,
    filePath: string,
    commitHash: string
  ): Promise<{ summary: string; tokens: number } | null> {
    const cacheKey = this.generateCacheKey(repoUrl, filePath, commitHash);
    const docRef = doc(db, 'summaryCache', cacheKey);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Update last accessed time
      await updateDoc(docRef, {
        lastAccessed: new Date().toISOString()
      });

      return {
        summary: data.summary,
        tokens: data.tokens
      };
    }

    return null;
  }

  /**
   * Check if summary exists in cache
   */
  static async hasCache(repoUrl: string, filePath: string, commitHash: string): Promise<boolean> {
    const cacheKey = this.generateCacheKey(repoUrl, filePath, commitHash);
    const docSnap = await getDoc(doc(db, 'summaryCache', cacheKey));
    return docSnap.exists();
  }
}

// ============================================================================
// 4. SEMANTIC CODE CHUNKING
// ============================================================================

export class SemanticChunker {
  /**
   * Parse code into semantic chunks
   * This is a simplified version - in production, use a proper AST parser
   */
  static parseIntoChunks(filePath: string, content: string, language: string): CodeChunk[] {
    const lines = content.split('\n');

    // Different parsing strategies based on language
    switch (language) {
      case 'javascript':
      case 'typescript':
      case 'jsx':
      case 'tsx':
        return this.parseJavaScriptChunks(filePath, lines);
      
      case 'python':
        return this.parsePythonChunks(filePath, lines);
      
      case 'java':
      case 'kotlin':
        return this.parseJavaChunks(filePath, lines);
      
      default:
        return this.parseGenericChunks(filePath, lines);
    }
  }

  /**
   * Parse JavaScript/TypeScript code
   */
  private static parseJavaScriptChunks(filePath: string, lines: string[]): CodeChunk[] {
    const chunks: CodeChunk[] = [];
    let currentChunk: { start: number; type: string; content: string[] } | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Detect function/class/export declarations
      if (line.match(/^(export\s+)?(default\s+)?(async\s+)?function\s+\w+/)) {
        if (currentChunk) {
          chunks.push(this.createChunk(filePath, currentChunk, i - 1));
        }
        currentChunk = { start: i, type: 'function', content: [lines[i]] };
      } else if (line.match(/^(export\s+)?(default\s+)?class\s+\w+/)) {
        if (currentChunk) {
          chunks.push(this.createChunk(filePath, currentChunk, i - 1));
        }
        currentChunk = { start: i, type: 'class', content: [lines[i]] };
      } else if (line.match(/^import\s+/)) {
        chunks.push({
          id: `${filePath}:${i}`,
          filePath,
          startLine: i,
          endLine: i,
          content: lines[i],
          type: 'import',
          tokens: this.estimateTokens(lines[i]),
          dependencies: [],
          semanticContext: 'import statement'
        });
      } else if (currentChunk) {
        currentChunk.content.push(lines[i]);
      }
    }

    if (currentChunk) {
      chunks.push(this.createChunk(filePath, currentChunk, lines.length - 1));
    }

    return chunks;
  }

  /**
   * Parse Python code
   */
  private static parsePythonChunks(filePath: string, lines: string[]): CodeChunk[] {
    const chunks: CodeChunk[] = [];
    let currentChunk: { start: number; type: string; content: string[]; indent: number } | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const indent = line.length - line.trimStart().length;

      // Detect class/function definitions
      if (trimmed.match(/^class\s+\w+/)) {
        if (currentChunk) {
          chunks.push(this.createChunk(filePath, currentChunk, i - 1));
        }
        currentChunk = { start: i, type: 'class', content: [line], indent };
      } else if (trimmed.match(/^def\s+\w+/)) {
        if (currentChunk && indent <= currentChunk.indent) {
          chunks.push(this.createChunk(filePath, currentChunk, i - 1));
          currentChunk = null;
        }
        if (!currentChunk) {
          currentChunk = { start: i, type: 'function', content: [line], indent };
        } else {
          currentChunk.content.push(line);
        }
      } else if (trimmed.match(/^import\s+|^from\s+\w+\s+import/)) {
        chunks.push({
          id: `${filePath}:${i}`,
          filePath,
          startLine: i,
          endLine: i,
          content: line,
          type: 'import',
          tokens: this.estimateTokens(line),
          dependencies: [],
          semanticContext: 'import statement'
        });
      } else if (currentChunk) {
        // Check if we've left the current block
        if (indent > currentChunk.indent || trimmed === '') {
          currentChunk.content.push(line);
        } else {
          chunks.push(this.createChunk(filePath, currentChunk, i - 1));
          currentChunk = null;
        }
      }
    }

    if (currentChunk) {
      chunks.push(this.createChunk(filePath, currentChunk, lines.length - 1));
    }

    return chunks;
  }

  /**
   * Parse Java/Kotlin code
   */
  private static parseJavaChunks(filePath: string, lines: string[]): CodeChunk[] {
    // Similar to JavaScript parsing
    return this.parseJavaScriptChunks(filePath, lines);
  }

  /**
   * Generic chunking for unknown languages
   */
  private static parseGenericChunks(filePath: string, lines: string[]): CodeChunk[] {
    const chunkSize = 50; // Lines per chunk
    const chunks: CodeChunk[] = [];

    for (let i = 0; i < lines.length; i += chunkSize) {
      const endLine = Math.min(i + chunkSize - 1, lines.length - 1);
      const content = lines.slice(i, endLine + 1).join('\n');

      chunks.push({
        id: `${filePath}:${i}-${endLine}`,
        filePath,
        startLine: i,
        endLine,
        content,
        type: 'module',
        tokens: this.estimateTokens(content),
        dependencies: [],
        semanticContext: 'generic code block'
      });
    }

    return chunks;
  }

  /**
   * Create a code chunk from accumulated data
   */
  private static createChunk(
    filePath: string,
    chunkData: { start: number; type: string; content: string[] },
    endLine: number
  ): CodeChunk {
    const content = chunkData.content.join('\n');
    
    return {
      id: `${filePath}:${chunkData.start}-${endLine}`,
      filePath,
      startLine: chunkData.start,
      endLine,
      content,
      type: chunkData.type as CodeChunk['type'],
      tokens: this.estimateTokens(content),
      dependencies: this.extractDependencies(content),
      semanticContext: `${chunkData.type} definition`
    };
  }

  /**
   * Estimate token count for text
   * Rough estimate: 1 token ≈ 4 characters
   */
  private static estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Extract dependencies from code
   */
  private static extractDependencies(content: string): string[] {
    const deps: string[] = [];
    
    // Extract imports
    const importMatches = content.match(/from\s+['"](.+?)['"]/g) || [];
    importMatches.forEach(match => {
      const dep = match.match(/from\s+['"](.+?)['"]/)?.[1];
      if (dep) deps.push(dep);
    });

    const requireMatches = content.match(/require\(['"](.+?)['"]\)/g) || [];
    requireMatches.forEach(match => {
      const dep = match.match(/require\(['"](.+?)['"]\)/)?.[1];
      if (dep) deps.push(dep);
    });

    return [...new Set(deps)];
  }

  /**
   * Filter chunks by relevance
   */
  static filterRelevantChunks(chunks: CodeChunk[], query: string): CodeChunk[] {
    const queryLower = query.toLowerCase();
    
    return chunks.filter(chunk => {
      const contentLower = chunk.content.toLowerCase();
      const contextLower = chunk.semanticContext.toLowerCase();
      
      return contentLower.includes(queryLower) || contextLower.includes(queryLower);
    });
  }
}

// ============================================================================
// 5. INCREMENTAL UPDATES
// ============================================================================

export class IncrementalAnalyzer {
  /**
   * Calculate file hash for change detection
   */
  static async calculateFileHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Detect changed files between commits
   */
  static async detectChanges(
    userId: string,
    repoUrl: string,
    previousCommit: string,
    currentCommit: string,
    currentFiles: Map<string, string>
  ): Promise<IncrementalUpdate> {
    // Get previous analysis
    const previousAnalysis = await this.getPreviousAnalysis(userId, repoUrl, previousCommit);
    
    const addedFiles: string[] = [];
    const deletedFiles: string[] = [];
    const changedFiles: string[] = [];
    const modifiedChunks: string[] = [];
    
    if (!previousAnalysis) {
      // First analysis - all files are new
      return {
        previousCommit,
        currentCommit,
        changedFiles: Array.from(currentFiles.keys()),
        addedFiles: Array.from(currentFiles.keys()),
        deletedFiles: [],
        modifiedChunks: [],
        tokenSavings: 0
      };
    }

    // Compare files
    for (const [filePath, content] of currentFiles) {
      const currentHash = await this.calculateFileHash(content);
      const previousFile = previousAnalysis.files.get(filePath);

      if (!previousFile) {
        addedFiles.push(filePath);
        changedFiles.push(filePath);
      } else if (previousFile.hash !== currentHash) {
        changedFiles.push(filePath);
        
        // Find modified chunks
        const chunks = SemanticChunker.parseIntoChunks(
          filePath,
          content,
          this.getLanguageFromPath(filePath)
        );
        modifiedChunks.push(...chunks.map(c => c.id));
      }
    }

    // Find deleted files
    for (const [filePath] of previousAnalysis.files) {
      if (!currentFiles.has(filePath)) {
        deletedFiles.push(filePath);
      }
    }

    // Calculate token savings
    const totalFiles = currentFiles.size;
    const filesAnalyzed = changedFiles.length;
    const tokenSavings = totalFiles > 0 ? ((totalFiles - filesAnalyzed) / totalFiles) * 100 : 0;

    return {
      previousCommit,
      currentCommit,
      changedFiles,
      addedFiles,
      deletedFiles,
      modifiedChunks,
      tokenSavings
    };
  }

  /**
   * Get previous analysis from Firestore
   */
  private static async getPreviousAnalysis(
    userId: string,
    repoUrl: string,
    commitHash: string
  ): Promise<AnalysisCache | null> {
    const docRef = doc(db, 'analysisCache', `${userId}:${repoUrl}:${commitHash}`);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        repoUrl: data.repoUrl,
        commitHash: data.commitHash,
        files: new Map(Object.entries(data.files || {})),
        chunks: new Map(Object.entries(data.chunks || {})),
        aiSummaries: new Map(Object.entries(data.aiSummaries || {})),
        lastUpdated: data.lastUpdated
      };
    }

    return null;
  }

  /**
   * Save analysis cache
   */
  static async saveAnalysisCache(
    userId: string,
    repoUrl: string,
    commitHash: string,
    cache: AnalysisCache
  ): Promise<void> {
    const docRef = doc(db, 'analysisCache', `${userId}:${repoUrl}:${commitHash}`);
    
    await setDoc(docRef, {
      userId,
      repoUrl,
      commitHash,
      files: Object.fromEntries(cache.files),
      chunks: Object.fromEntries(cache.chunks),
      aiSummaries: Object.fromEntries(cache.aiSummaries),
      lastUpdated: new Date().toISOString()
    });
  }

  /**
   * Get language from file path
   */
  private static getLanguageFromPath(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'jsx',
      'ts': 'typescript',
      'tsx': 'tsx',
      'py': 'python',
      'java': 'java',
      'kt': 'kotlin',
      'go': 'go',
      'rs': 'rust',
      'rb': 'ruby',
      'php': 'php',
      'c': 'c',
      'cpp': 'cpp',
      'cs': 'csharp',
      'swift': 'swift'
    };
    return languageMap[ext || ''] || 'unknown';
  }
}

// ============================================================================
// TOKEN ECONOMY MANAGER
// ============================================================================

export class TokenEconomyManager {
  /**
   * Calculate total token savings from all strategies
   */
  static calculateTotalSavings(strategies: OptimizationStrategy[]): number {
    const enabledStrategies = strategies.filter(s => s.enabled);
    
    if (enabledStrategies.length === 0) return 0;

    // Compound savings (strategies work together)
    let remaining = 100;
    for (const strategy of enabledStrategies) {
      remaining *= (1 - strategy.savingsPercentage / 100);
    }

    return 100 - remaining;
  }

  /**
   * Get token usage statistics
   */
  static async getTokenUsageStats(userId: string): Promise<{
    totalTokens: number;
    totalCost: number;
    analysisCount: number;
    averageTokensPerAnalysis: number;
  }> {
    const statsRef = doc(db, 'tokenStats', userId);
    const statsSnap = await getDoc(statsRef);

    if (statsSnap.exists()) {
      const data = statsSnap.data();
      return {
        totalTokens: data.totalTokens || 0,
        totalCost: data.totalCost || 0,
        analysisCount: data.analysisCount || 0,
        averageTokensPerAnalysis: data.analysisCount > 0 
          ? data.totalTokens / data.analysisCount 
          : 0
      };
    }

    return {
      totalTokens: 0,
      totalCost: 0,
      analysisCount: 0,
      averageTokensPerAnalysis: 0
    };
  }

  /**
   * Update token usage statistics
   */
  static async updateTokenUsageStats(
    userId: string,
    tokens: number,
    cost: number
  ): Promise<void> {
    const statsRef = doc(db, 'tokenStats', userId);
    const statsSnap = await getDoc(statsRef);

    if (statsSnap.exists()) {
      const data = statsSnap.data();
      await updateDoc(statsRef, {
        totalTokens: (data.totalTokens || 0) + tokens,
        totalCost: (data.totalCost || 0) + cost,
        analysisCount: (data.analysisCount || 0) + 1,
        lastUpdated: new Date().toISOString()
      });
    } else {
      await setDoc(statsRef, {
        userId,
        totalTokens: tokens,
        totalCost: cost,
        analysisCount: 1,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
    }
  }

  /**
   * Estimate cost from tokens (Gemini pricing)
   */
  static estimateCost(inputTokens: number, outputTokens: number): number {
    // Gemini 1.5 Flash pricing (as of 2024)
    const INPUT_COST_PER_1M = 0.075; // $0.075 per 1M tokens
    const OUTPUT_COST_PER_1M = 0.30;  // $0.30 per 1M tokens

    const inputCost = (inputTokens / 1_000_000) * INPUT_COST_PER_1M;
    const outputCost = (outputTokens / 1_000_000) * OUTPUT_COST_PER_1M;

    return inputCost + outputCost;
  }
}
