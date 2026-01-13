/**
 * Repository Analyzer Service
 * Comprehensive code analysis engine for onboarding
 */

import { doc, setDoc, getDoc, collection, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { githubService, type GitHubRepository, type GitHubTree } from './github-service';
import { geminiService } from './gemini-service';
import { PriorityAnalyzer, DependencyFilter } from '../token-optimization';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface AnalysisJob {
  id: string;
  userId: string;
  repoUrl: string;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

export interface CodebaseStructure {
  entryPoints: Array<{
    path: string;
    type: 'main' | 'api' | 'config' | 'test';
    description: string;
  }>;
  modules: Array<{
    name: string;
    path: string;
    files: string[];
    description: string;
    dependencies: string[];
    isCore: boolean;
  }>;
  architecture: {
    type: 'monolith' | 'microservices' | 'modular' | 'layered' | 'unknown';
    layers: string[];
    patterns: string[];
  };
}

export interface TechnologyStack {
  languages: Array<{
    name: string;
    percentage: number;
    version?: string;
  }>;
  frameworks: string[];
  libraries: string[];
  buildTools: string[];
  testingTools: string[];
  devTools: string[];
  databases: string[];
  cloudServices: string[];
}

export interface CodeComplexity {
  overall: number; // 0-100
  metrics: {
    cyclomaticComplexity: number;
    cognitiveComplexity: number;
    nestingDepth: number;
    linesOfCode: number;
    codeToCommentRatio: number;
  };
  hotspots: Array<{
    file: string;
    complexity: number;
    reason: string;
  }>;
}

export interface DocumentationQuality {
  score: number; // 0-100
  hasReadme: boolean;
  hasContributing: boolean;
  hasLicense: boolean;
  hasChangelog: boolean;
  hasApiDocs: boolean;
  codeComments: {
    percentage: number;
    quality: 'poor' | 'fair' | 'good' | 'excellent';
  };
  missingDocs: string[];
}

export interface TestingCoverage {
  hasTests: boolean;
  testFramework: string | null;
  estimatedCoverage: number; // 0-100
  testTypes: Array<'unit' | 'integration' | 'e2e' | 'snapshot'>;
  testLocations: string[];
}

export interface DependencyAnalysis {
  total: number;
  production: number;
  development: number;
  outdated: Array<{
    name: string;
    currentVersion: string;
    latestVersion: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  security: {
    vulnerabilities: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface OnboardingDifficulty {
  score: number; // 0-100 (higher = more difficult)
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedTime: {
    toUnderstand: number; // hours
    toContribute: number; // hours
    toMaster: number; // days
  };
  challenges: string[];
  recommendations: string[];
}

export interface FullAnalysisResult {
  repository: GitHubRepository;
  structure: CodebaseStructure;
  technologies: TechnologyStack;
  complexity: CodeComplexity;
  documentation: DocumentationQuality;
  testing: TestingCoverage;
  dependencies: DependencyAnalysis;
  onboardingDifficulty: OnboardingDifficulty;
  codeGraph: {
    nodes: Array<{
      id: string;
      label: string;
      type: 'module' | 'file' | 'function' | 'class';
      size: number;
    }>;
    edges: Array<{
      source: string;
      target: string;
      type: 'imports' | 'extends' | 'calls' | 'uses';
    }>;
  };
  aiInsights: {
    summary: string;
    keyFlows: string[];
    gotchas: string[];
    bestPractices: string[];
    learningPriorities: string[];
  };
  analyzedAt: string;
  tokenUsage: {
    total: number;
    cost: number;
  };
}

// ============================================================================
// REPOSITORY ANALYZER CLASS
// ============================================================================

export class RepositoryAnalyzer {
  private static instance: RepositoryAnalyzer;

  private constructor() {}

  static getInstance(): RepositoryAnalyzer {
    if (!RepositoryAnalyzer.instance) {
      RepositoryAnalyzer.instance = new RepositoryAnalyzer();
    }
    return RepositoryAnalyzer.instance;
  }

  // ============================================
  // MAIN ANALYSIS METHODS
  // ============================================

  /**
   * Start a full repository analysis
   */
  async analyzeRepository(
    userId: string,
    repoUrl: string,
    onProgress?: (progress: number, step: string) => void
  ): Promise<FullAnalysisResult> {
    // Create analysis job
    const job = await this.createAnalysisJob(userId, repoUrl);
    
    try {
      // Parse repo URL
      const parsed = githubService.parseRepoUrl(repoUrl);
      if (!parsed) {
        throw new Error('Invalid repository URL');
      }
      const { owner, repo } = parsed;

      // Step 1: Get repository info
      await this.updateJobProgress(job.id, 10, 'Fetching repository info...');
      onProgress?.(10, 'Fetching repository info...');
      const repository = await githubService.getRepository(owner, repo);

      // Step 2: Get file tree
      await this.updateJobProgress(job.id, 20, 'Analyzing file structure...');
      onProgress?.(20, 'Analyzing file structure...');
      const tree = await githubService.getRepositoryTree(owner, repo);

      // Step 3: Analyze structure
      await this.updateJobProgress(job.id, 30, 'Identifying codebase structure...');
      onProgress?.(30, 'Identifying codebase structure...');
      const structure = await this.analyzeStructure(tree);

      // Step 4: Detect technologies
      await this.updateJobProgress(job.id, 40, 'Detecting technologies...');
      onProgress?.(40, 'Detecting technologies...');
      const technologies = await this.detectTechnologies(tree, owner, repo, repository);

      // Step 5: Analyze complexity
      await this.updateJobProgress(job.id, 50, 'Analyzing code complexity...');
      onProgress?.(50, 'Analyzing code complexity...');
      const complexity = await this.analyzeComplexity(tree, owner, repo);

      // Step 6: Check documentation
      await this.updateJobProgress(job.id, 60, 'Evaluating documentation...');
      onProgress?.(60, 'Evaluating documentation...');
      const documentation = await this.analyzeDocumentation(tree, owner, repo);

      // Step 7: Analyze testing
      await this.updateJobProgress(job.id, 70, 'Analyzing test coverage...');
      onProgress?.(70, 'Analyzing test coverage...');
      const testing = await this.analyzeTestingCoverage(tree);

      // Step 8: Analyze dependencies
      await this.updateJobProgress(job.id, 80, 'Analyzing dependencies...');
      onProgress?.(80, 'Analyzing dependencies...');
      const dependencies = await this.analyzeDependencies(owner, repo);

      // Step 9: Calculate onboarding difficulty
      await this.updateJobProgress(job.id, 85, 'Calculating onboarding difficulty...');
      onProgress?.(85, 'Calculating onboarding difficulty...');
      const onboardingDifficulty = this.calculateOnboardingDifficulty(
        complexity,
        documentation,
        testing,
        tree.tree.length
      );

      // Step 10: Build code graph
      await this.updateJobProgress(job.id, 90, 'Building code graph...');
      onProgress?.(90, 'Building code graph...');
      const codeGraph = await this.buildCodeGraph(structure);

      // Step 11: Generate AI insights
      await this.updateJobProgress(job.id, 95, 'Generating AI insights...');
      onProgress?.(95, 'Generating AI insights...');
      const aiInsights = await this.generateAIInsights(
        repository,
        structure,
        technologies,
        complexity
      );

      // Complete analysis
      const result: FullAnalysisResult = {
        repository,
        structure,
        technologies,
        complexity,
        documentation,
        testing,
        dependencies,
        onboardingDifficulty,
        codeGraph,
        aiInsights,
        analyzedAt: new Date().toISOString(),
        tokenUsage: {
          total: 0, // Will be calculated
          cost: 0
        }
      };

      // Save result
      await this.saveAnalysisResult(userId, repoUrl, result);
      await this.completeJob(job.id);
      onProgress?.(100, 'Analysis complete!');

      return result;
    } catch (error) {
      await this.failJob(job.id, (error as Error).message);
      throw error;
    }
  }

  // ============================================
  // STRUCTURE ANALYSIS
  // ============================================

  private async analyzeStructure(tree: GitHubTree): Promise<CodebaseStructure> {
    const files = tree.tree.filter(item => item.type === 'blob');
    const dirs = tree.tree.filter(item => item.type === 'tree');

    // Filter out vendor/dependencies
    const filteredFiles = DependencyFilter.filterFiles(files.map(f => f.path));
    
    // Sort by priority
    const prioritizedFiles = PriorityAnalyzer.sortByPriority(filteredFiles);

    // Identify entry points
    const entryPoints = this.identifyEntryPoints(prioritizedFiles);

    // Identify modules
    const modules = this.identifyModules(dirs.map(d => d.path), files.map(f => f.path));

    // Determine architecture type
    const architecture = this.determineArchitecture(modules, entryPoints);

    return {
      entryPoints,
      modules,
      architecture
    };
  }

  private identifyEntryPoints(
    files: string[]
  ): CodebaseStructure['entryPoints'] {
    const entryPoints: CodebaseStructure['entryPoints'] = [];
    
    const patterns = [
      { pattern: /^(src\/)?(index|main|app)\.(ts|js|tsx|jsx)$/, type: 'main' as const },
      { pattern: /^(src\/)?server\.(ts|js)$/, type: 'main' as const },
      { pattern: /^(src\/)?api\/(index|routes)\.(ts|js)$/, type: 'api' as const },
      { pattern: /^(src\/)?routes\/(index)\.(ts|js)$/, type: 'api' as const },
      { pattern: /\.(config|rc)\.(ts|js|json|ya?ml)$/, type: 'config' as const },
      { pattern: /package\.json$/, type: 'config' as const },
      { pattern: /(tsconfig|jsconfig)\.json$/, type: 'config' as const }
    ];

    for (const file of files) {
      for (const { pattern, type } of patterns) {
        if (pattern.test(file)) {
          entryPoints.push({
            path: file,
            type,
            description: this.getEntryPointDescription(file, type)
          });
          break;
        }
      }
    }

    return entryPoints.slice(0, 10); // Limit to 10 entry points
  }

  private getEntryPointDescription(path: string, type: string): string {
    const descriptions: Record<string, string> = {
      main: 'Application main entry point',
      api: 'API routes and endpoints',
      config: 'Configuration file',
      test: 'Test setup or configuration'
    };
    return descriptions[type] || `Entry point: ${path}`;
  }

  private identifyModules(
    dirs: string[],
    files: string[]
  ): CodebaseStructure['modules'] {
    const modules: CodebaseStructure['modules'] = [];
    
    // Common module directories
    const modulePatterns = [
      { pattern: /^src\/components/, name: 'Components', isCore: true },
      { pattern: /^src\/pages/, name: 'Pages', isCore: true },
      { pattern: /^src\/hooks/, name: 'Hooks', isCore: true },
      { pattern: /^src\/lib/, name: 'Library', isCore: true },
      { pattern: /^src\/utils/, name: 'Utilities', isCore: false },
      { pattern: /^src\/services/, name: 'Services', isCore: true },
      { pattern: /^src\/api/, name: 'API', isCore: true },
      { pattern: /^src\/store/, name: 'State Management', isCore: true },
      { pattern: /^src\/context/, name: 'Context', isCore: true },
      { pattern: /^src\/types/, name: 'Types', isCore: false },
      { pattern: /^src\/styles/, name: 'Styles', isCore: false },
      { pattern: /^src\/assets/, name: 'Assets', isCore: false },
      { pattern: /^tests?\//, name: 'Tests', isCore: false },
      { pattern: /^__tests__\//, name: 'Tests', isCore: false }
    ];

    for (const dir of dirs) {
      for (const { pattern, name, isCore } of modulePatterns) {
        if (pattern.test(dir)) {
          const moduleFiles = files.filter(f => f.startsWith(dir));
          
          if (moduleFiles.length > 0) {
            modules.push({
              name,
              path: dir,
              files: moduleFiles.slice(0, 20), // Limit files per module
              description: `${name} module containing ${moduleFiles.length} files`,
              dependencies: [], // Would need content analysis
              isCore
            });
          }
          break;
        }
      }
    }

    return modules;
  }

  private determineArchitecture(
    modules: CodebaseStructure['modules'],
    entryPoints: CodebaseStructure['entryPoints']
  ): CodebaseStructure['architecture'] {
    const patterns: string[] = [];
    let type: CodebaseStructure['architecture']['type'] = 'unknown';
    const layers: string[] = [];
    const hasApiEntryPoint = entryPoints.some(ep => ep.type === 'api');
    const hasMainEntryPoint = entryPoints.some(ep => ep.type === 'main');

    // Check for common patterns
    const hasPages = modules.some(m => m.name === 'Pages');
    const hasComponents = modules.some(m => m.name === 'Components');
    const hasServices = modules.some(m => m.name === 'Services');
    const hasApi = modules.some(m => m.name === 'API');
    const hasStore = modules.some(m => m.name === 'State Management');

    if (hasPages && hasComponents) {
      patterns.push('Component-Based Architecture');
      type = 'modular';
      layers.push('Presentation', 'Components');
    }

    if (hasServices) {
      patterns.push('Service Layer Pattern');
      layers.push('Services');
    }

    if (hasApi) {
      patterns.push('API Layer');
      layers.push('API');
    }

    if (hasApiEntryPoint) {
      if (!layers.includes('API')) {
        layers.push('API');
      }
      if (!patterns.includes('API Entry Points')) {
        patterns.push('API Entry Points');
      }
    }

    if (hasMainEntryPoint && !patterns.includes('Main Entry Point Focus')) {
      patterns.push('Main Entry Point Focus');
      if (!layers.includes('Entry')) {
        layers.push('Entry');
      }
    }

    if (hasStore) {
      patterns.push('State Management');
      layers.push('State');
    }

    // Determine overall type
    if (modules.length > 10 && hasServices && hasApi) {
      type = 'layered';
    } else if (modules.length > 15) {
      type = 'modular';
    } else if (modules.length <= 5) {
      type = 'monolith';
    }

    return { type, layers, patterns };
  }

  // ============================================
  // TECHNOLOGY DETECTION
  // ============================================

  private async detectTechnologies(
    tree: GitHubTree,
    owner: string,
    repo: string,
    repository: GitHubRepository
  ): Promise<TechnologyStack> {
    const files = tree.tree.map(t => t.path);
    
    // Detect from file names and extensions
    const frameworks: string[] = [];
    const libraries: string[] = [];
    const buildTools: string[] = [];
    const testingTools: string[] = [];
    const devTools: string[] = [];
    const databases: string[] = [];
    const cloudServices: string[] = [];

    // Framework detection patterns
    const frameworkPatterns: Array<{ pattern: RegExp; name: string }> = [
      { pattern: /next\.config\.(js|ts|mjs)/, name: 'Next.js' },
      { pattern: /vite\.config\.(js|ts|mjs)/, name: 'Vite' },
      { pattern: /angular\.json/, name: 'Angular' },
      { pattern: /vue\.config\.(js|ts)/, name: 'Vue.js' },
      { pattern: /nuxt\.config\.(js|ts)/, name: 'Nuxt.js' },
      { pattern: /remix\.config\.(js|ts)/, name: 'Remix' },
      { pattern: /astro\.config\.(js|ts|mjs)/, name: 'Astro' },
      { pattern: /svelte\.config\.js/, name: 'Svelte/SvelteKit' },
      { pattern: /django|settings\.py/, name: 'Django' },
      { pattern: /flask/, name: 'Flask' },
      { pattern: /express/, name: 'Express.js' },
      { pattern: /fastapi/, name: 'FastAPI' }
    ];

    // Build tool patterns
    const buildToolPatterns: Array<{ pattern: RegExp; name: string }> = [
      { pattern: /webpack\.config/, name: 'Webpack' },
      { pattern: /rollup\.config/, name: 'Rollup' },
      { pattern: /esbuild/, name: 'esbuild' },
      { pattern: /turbo\.json/, name: 'Turborepo' },
      { pattern: /pnpm-workspace/, name: 'pnpm' },
      { pattern: /yarn\.lock/, name: 'Yarn' },
      { pattern: /package-lock\.json/, name: 'npm' }
    ];

    // Testing tool patterns
    const testingPatterns: Array<{ pattern: RegExp; name: string }> = [
      { pattern: /jest\.config/, name: 'Jest' },
      { pattern: /vitest\.config/, name: 'Vitest' },
      { pattern: /cypress/, name: 'Cypress' },
      { pattern: /playwright/, name: 'Playwright' },
      { pattern: /\.spec\.(ts|js)/, name: 'Spec Testing' },
      { pattern: /\.test\.(ts|js)/, name: 'Unit Testing' },
      { pattern: /pytest/, name: 'pytest' }
    ];

    // Check files against patterns
    for (const file of files) {
      for (const { pattern, name } of frameworkPatterns) {
        if (pattern.test(file) && !frameworks.includes(name)) {
          frameworks.push(name);
        }
      }
      for (const { pattern, name } of buildToolPatterns) {
        if (pattern.test(file) && !buildTools.includes(name)) {
          buildTools.push(name);
        }
      }
      for (const { pattern, name } of testingPatterns) {
        if (pattern.test(file) && !testingTools.includes(name)) {
          testingTools.push(name);
        }
      }
    }

    // Try to get package.json for more accurate detection
    try {
      const packageJsonContent = await githubService.getDecodedFileContent(
        owner,
        repo,
        'package.json'
      );
      const packageJson = JSON.parse(packageJsonContent);
      
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      // Detect from dependencies
      const depMappings: Record<string, { category: string; name: string }> = {
        'react': { category: 'framework', name: 'React' },
        'vue': { category: 'framework', name: 'Vue.js' },
        'angular': { category: 'framework', name: 'Angular' },
        'next': { category: 'framework', name: 'Next.js' },
        'express': { category: 'framework', name: 'Express.js' },
        'firebase': { category: 'cloud', name: 'Firebase' },
        '@firebase/app': { category: 'cloud', name: 'Firebase' },
        'aws-sdk': { category: 'cloud', name: 'AWS' },
        '@azure': { category: 'cloud', name: 'Azure' },
        'mongodb': { category: 'database', name: 'MongoDB' },
        'mongoose': { category: 'database', name: 'MongoDB (Mongoose)' },
        'pg': { category: 'database', name: 'PostgreSQL' },
        'mysql': { category: 'database', name: 'MySQL' },
        'redis': { category: 'database', name: 'Redis' },
        'prisma': { category: 'database', name: 'Prisma ORM' },
        'tailwindcss': { category: 'library', name: 'Tailwind CSS' },
        'styled-components': { category: 'library', name: 'Styled Components' },
        'framer-motion': { category: 'library', name: 'Framer Motion' },
        'axios': { category: 'library', name: 'Axios' },
        'lodash': { category: 'library', name: 'Lodash' },
        'zod': { category: 'library', name: 'Zod' },
        'typescript': { category: 'devTool', name: 'TypeScript' },
        'eslint': { category: 'devTool', name: 'ESLint' },
        'prettier': { category: 'devTool', name: 'Prettier' }
      };

      for (const [dep, mapping] of Object.entries(depMappings)) {
        if (allDeps[dep]) {
          switch (mapping.category) {
            case 'framework':
              if (!frameworks.includes(mapping.name)) frameworks.push(mapping.name);
              break;
            case 'cloud':
              if (!cloudServices.includes(mapping.name)) cloudServices.push(mapping.name);
              break;
            case 'database':
              if (!databases.includes(mapping.name)) databases.push(mapping.name);
              break;
            case 'library':
              if (!libraries.includes(mapping.name)) libraries.push(mapping.name);
              break;
            case 'devTool':
              if (!devTools.includes(mapping.name)) devTools.push(mapping.name);
              break;
          }
        }
      }
    } catch {
      // package.json not found or not parseable
    }

    // Convert language breakdown to array
    const languages = Object.entries(repository.languages)
      .map(([name, bytes]) => ({
        name,
        percentage: Math.round((bytes / Object.values(repository.languages).reduce((a, b) => a + b, 0)) * 100)
      }))
      .sort((a, b) => b.percentage - a.percentage);

    return {
      languages,
      frameworks,
      libraries,
      buildTools,
      testingTools,
      devTools,
      databases,
      cloudServices
    };
  }

  // ============================================
  // COMPLEXITY ANALYSIS
  // ============================================

  private async analyzeComplexity(
    tree: GitHubTree,
    owner: string,
    repo: string
  ): Promise<CodeComplexity> {
    const files = tree.tree.filter(t => t.type === 'blob');
    const codeFiles = files.filter(f => 
      /\.(ts|js|tsx|jsx|py|java|go|rs|rb|php|cs|cpp|c)$/.test(f.path)
    );

    // Filter out vendor files
    const filteredFiles = DependencyFilter.filterFiles(codeFiles.map(f => f.path));
    
    // Sample files for complexity analysis (limit to avoid API limits)
    const sampleSize = Math.min(filteredFiles.length, 10);
    const sampledFiles = filteredFiles
      .sort(() => Math.random() - 0.5)
      .slice(0, sampleSize);

    let totalComplexity = 0;
    let totalLines = 0;
    let totalNesting = 0;
    let totalComments = 0;
    const hotspots: CodeComplexity['hotspots'] = [];

    for (const filePath of sampledFiles) {
      try {
        const content = await githubService.getDecodedFileContent(owner, repo, filePath);
        const lines = content.split('\n');
        const fileComplexity = this.estimateFileComplexity(content);
        
        totalLines += lines.length;
        totalComplexity += fileComplexity.cyclomatic;
        totalNesting += fileComplexity.maxNesting;
        totalComments += fileComplexity.commentLines;

        if (fileComplexity.cyclomatic > 10) {
          hotspots.push({
            file: filePath,
            complexity: fileComplexity.cyclomatic,
            reason: `High cyclomatic complexity (${fileComplexity.cyclomatic})`
          });
        }
      } catch {
        // Skip files that can't be read
      }
    }

    const avgComplexity = sampleSize > 0 ? totalComplexity / sampleSize : 0;
    const avgNesting = sampleSize > 0 ? totalNesting / sampleSize : 0;
    const commentRatio = totalLines > 0 ? (totalComments / totalLines) * 100 : 0;

    // Calculate overall score (0-100, lower is better for complexity)
    const overall = Math.min(100, Math.round(
      (avgComplexity * 3) + (avgNesting * 10) + (100 - commentRatio)
    ) / 2);

    return {
      overall,
      metrics: {
        cyclomaticComplexity: Math.round(avgComplexity * 10) / 10,
        cognitiveComplexity: Math.round(avgComplexity * 1.2 * 10) / 10,
        nestingDepth: Math.round(avgNesting * 10) / 10,
        linesOfCode: totalLines * (filteredFiles.length / sampleSize),
        codeToCommentRatio: Math.round(commentRatio * 10) / 10
      },
      hotspots: hotspots.sort((a, b) => b.complexity - a.complexity).slice(0, 5)
    };
  }

  private estimateFileComplexity(content: string): {
    cyclomatic: number;
    maxNesting: number;
    commentLines: number;
  } {
    const lines = content.split('\n');
    let cyclomatic = 1;
    let maxNesting = 0;
    let currentNesting = 0;
    let commentLines = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Count control structures for cyclomatic complexity
      const controlPatterns = /\b(if|else|for|while|case|catch|&&|\|\||\?)\b/g;
      const matches = trimmed.match(controlPatterns);
      if (matches) {
        cyclomatic += matches.length;
      }

      // Track nesting
      const opens = (line.match(/[{(]/g) || []).length;
      const closes = (line.match(/[})]/g) || []).length;
      currentNesting += opens - closes;
      maxNesting = Math.max(maxNesting, currentNesting);

      // Count comments
      if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('#')) {
        commentLines++;
      }
    }

    return { cyclomatic, maxNesting, commentLines };
  }

  // ============================================
  // DOCUMENTATION ANALYSIS
  // ============================================

  private async analyzeDocumentation(
    tree: GitHubTree,
    owner: string,
    repo: string
  ): Promise<DocumentationQuality> {
    const files = tree.tree.map(t => t.path.toLowerCase());
    
    const hasReadme = files.some(f => f === 'readme.md' || f === 'readme');
    const hasContributing = files.some(f => f.includes('contributing'));
    const hasLicense = files.some(f => f.includes('license'));
    const hasChangelog = files.some(f => f.includes('changelog') || f.includes('history'));
    const hasApiDocs = files.some(f => 
      f.includes('docs/') || f.includes('api.md') || f.includes('documentation')
    );

    let readmeScore = 0;
    let readmeContent = '';

    if (hasReadme) {
      try {
        readmeContent = await githubService.getDecodedFileContent(owner, repo, 'README.md');
        readmeScore = this.scoreReadme(readmeContent);
      } catch {
        readmeScore = 10; // Minimal score for having a README
      }
    }

    // Calculate overall score
    let score = 0;
    score += hasReadme ? 30 : 0;
    score += readmeScore;
    score += hasContributing ? 10 : 0;
    score += hasLicense ? 10 : 0;
    score += hasChangelog ? 10 : 0;
    score += hasApiDocs ? 15 : 0;

    const missingDocs: string[] = [];
    if (!hasReadme) missingDocs.push('README.md');
    if (!hasContributing) missingDocs.push('CONTRIBUTING.md');
    if (!hasLicense) missingDocs.push('LICENSE');
    if (!hasChangelog) missingDocs.push('CHANGELOG.md');
    if (!hasApiDocs) missingDocs.push('API Documentation');

    return {
      score: Math.min(100, score),
      hasReadme,
      hasContributing,
      hasLicense,
      hasChangelog,
      hasApiDocs,
      codeComments: {
        percentage: 15, // Would need full analysis
        quality: score > 70 ? 'good' : score > 40 ? 'fair' : 'poor'
      },
      missingDocs
    };
  }

  private scoreReadme(content: string): number {
    let score = 0;
    const contentLower = content.toLowerCase();

    // Check for common sections
    if (contentLower.includes('installation') || contentLower.includes('getting started')) score += 5;
    if (contentLower.includes('usage') || contentLower.includes('example')) score += 5;
    if (contentLower.includes('api') || contentLower.includes('documentation')) score += 3;
    if (contentLower.includes('contributing')) score += 2;
    if (contentLower.includes('license')) score += 2;
    if (content.includes('```')) score += 3; // Has code examples
    if (content.includes('##')) score += 2; // Has sections
    if (content.length > 1000) score += 3; // Substantial content

    return Math.min(25, score);
  }

  // ============================================
  // TESTING ANALYSIS
  // ============================================

  private async analyzeTestingCoverage(tree: GitHubTree): Promise<TestingCoverage> {
    const files = tree.tree.map(t => t.path);
    
    const testFiles = files.filter(f => 
      /\.(test|spec)\.(ts|js|tsx|jsx)$/.test(f) ||
      f.includes('__tests__/') ||
      f.includes('/test/') ||
      f.includes('/tests/')
    );

    const hasTests = testFiles.length > 0;
    
    // Detect test framework
    let testFramework: string | null = null;
    const testTypes: Set<'unit' | 'integration' | 'e2e' | 'snapshot'> = new Set();

    if (files.some(f => f.includes('jest.config'))) {
      testFramework = 'Jest';
      testTypes.add('unit');
    }
    if (files.some(f => f.includes('vitest.config'))) {
      testFramework = 'Vitest';
      testTypes.add('unit');
    }
    if (files.some(f => f.includes('cypress'))) {
      testTypes.add('e2e');
      if (!testFramework) testFramework = 'Cypress';
    }
    if (files.some(f => f.includes('playwright'))) {
      testTypes.add('e2e');
      if (!testFramework) testFramework = 'Playwright';
    }

    // Estimate coverage based on test file ratio
    const codeFiles = files.filter(f => 
      /\.(ts|js|tsx|jsx)$/.test(f) && !f.includes('.test.') && !f.includes('.spec.')
    ).length;
    
    const estimatedCoverage = codeFiles > 0 
      ? Math.min(100, Math.round((testFiles.length / codeFiles) * 100))
      : 0;

    return {
      hasTests,
      testFramework,
      estimatedCoverage,
      testTypes: Array.from(testTypes),
      testLocations: [...new Set(testFiles.map(f => f.split('/').slice(0, -1).join('/')))]
    };
  }

  // ============================================
  // DEPENDENCY ANALYSIS
  // ============================================

  private async analyzeDependencies(
    owner: string,
    repo: string
  ): Promise<DependencyAnalysis> {
    try {
      const packageJsonContent = await githubService.getDecodedFileContent(
        owner,
        repo,
        'package.json'
      );
      const packageJson = JSON.parse(packageJsonContent);
      
      const productionDeps = Object.keys(packageJson.dependencies || {});
      const devDeps = Object.keys(packageJson.devDependencies || {});

      return {
        total: productionDeps.length + devDeps.length,
        production: productionDeps.length,
        development: devDeps.length,
        outdated: [], // Would need npm registry API for this
        security: {
          vulnerabilities: 0, // Would need security audit API
          critical: 0,
          high: 0,
          medium: 0,
          low: 0
        }
      };
    } catch {
      return {
        total: 0,
        production: 0,
        development: 0,
        outdated: [],
        security: {
          vulnerabilities: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0
        }
      };
    }
  }

  // ============================================
  // ONBOARDING DIFFICULTY
  // ============================================

  private calculateOnboardingDifficulty(
    complexity: CodeComplexity,
    documentation: DocumentationQuality,
    testing: TestingCoverage,
    fileCount: number
  ): OnboardingDifficulty {
    // Calculate difficulty score (0-100)
    let score = 0;

    // Complexity contribution (0-40)
    score += Math.min(40, complexity.overall * 0.4);

    // Documentation negative contribution (good docs reduce difficulty)
    score -= Math.min(20, documentation.score * 0.2);

    // Testing negative contribution (good tests reduce difficulty)
    score -= Math.min(10, testing.estimatedCoverage * 0.1);

    // File count contribution
    if (fileCount > 500) score += 15;
    else if (fileCount > 200) score += 10;
    else if (fileCount > 50) score += 5;

    score = Math.max(0, Math.min(100, score));

    // Determine level
    let level: OnboardingDifficulty['level'];
    if (score < 25) level = 'beginner';
    else if (score < 50) level = 'intermediate';
    else if (score < 75) level = 'advanced';
    else level = 'expert';

    // Estimate times
    const baseTimes = {
      beginner: { understand: 8, contribute: 16, master: 14 },
      intermediate: { understand: 24, contribute: 40, master: 30 },
      advanced: { understand: 40, contribute: 80, master: 60 },
      expert: { understand: 80, contribute: 160, master: 90 }
    };

    const times = baseTimes[level];

    // Generate challenges
    const challenges: string[] = [];
    if (complexity.overall > 50) challenges.push('High code complexity');
    if (documentation.score < 50) challenges.push('Limited documentation');
    if (!testing.hasTests) challenges.push('No test coverage');
    if (fileCount > 200) challenges.push('Large codebase');

    // Generate recommendations
    const recommendations: string[] = [];
    recommendations.push('Start with the README and documentation');
    recommendations.push('Focus on entry points first');
    if (testing.hasTests) recommendations.push('Run tests to understand expected behavior');
    recommendations.push('Use the AI tutor for code explanations');

    return {
      score: Math.round(score),
      level,
      estimatedTime: {
        toUnderstand: times.understand,
        toContribute: times.contribute,
        toMaster: times.master
      },
      challenges,
      recommendations
    };
  }

  // ============================================
  // CODE GRAPH
  // ============================================

  private async buildCodeGraph(
    structure: CodebaseStructure
  ): Promise<FullAnalysisResult['codeGraph']> {
    const nodes: FullAnalysisResult['codeGraph']['nodes'] = [];
    const edges: FullAnalysisResult['codeGraph']['edges'] = [];

    // Add modules as nodes
    for (const module of structure.modules) {
      nodes.push({
        id: module.path,
        label: module.name,
        type: 'module',
        size: module.files.length
      });

      // Add edges between dependent modules
      for (const dep of module.dependencies) {
        edges.push({
          source: module.path,
          target: dep,
          type: 'imports'
        });
      }
    }

    // Add entry points as nodes
    for (const entry of structure.entryPoints) {
      nodes.push({
        id: entry.path,
        label: entry.path.split('/').pop() || entry.path,
        type: 'file',
        size: 1
      });
    }

    return { nodes, edges };
  }

  // ============================================
  // AI INSIGHTS
  // ============================================

  private async generateAIInsights(
    repository: GitHubRepository,
    structure: CodebaseStructure,
    technologies: TechnologyStack,
    complexity: CodeComplexity
  ): Promise<FullAnalysisResult['aiInsights']> {
    try {
      const result = await geminiService.generate(`
        Analyze this repository and provide insights for a new developer onboarding:

        Repository: ${repository.fullName}
        Description: ${repository.description}
        
        Architecture: ${structure.architecture.type}
        Patterns: ${structure.architecture.patterns.join(', ')}
        
        Technologies: ${technologies.frameworks.join(', ')}, ${technologies.languages.map(l => l.name).join(', ')}
        
        Complexity Score: ${complexity.overall}/100
        
        Provide a JSON response with:
        1. summary: A 2-3 sentence overview for new developers
        2. keyFlows: Array of 3-5 important code flows to understand
        3. gotchas: Array of 3-5 potential pitfalls or non-obvious things
        4. bestPractices: Array of 3-5 best practices observed
        5. learningPriorities: Array of 5 things to learn in order
      `, { temperature: 0.5 });

      const parsed = JSON.parse(
        result.text.match(/\{[\s\S]*\}/)?.[0] || '{}'
      );

      return {
        summary: parsed.summary || 'Analysis complete. Review the detailed sections for more information.',
        keyFlows: parsed.keyFlows || [],
        gotchas: parsed.gotchas || [],
        bestPractices: parsed.bestPractices || [],
        learningPriorities: parsed.learningPriorities || []
      };
    } catch {
      return {
        summary: `${repository.fullName} is a ${repository.language} project with ${structure.modules.length} main modules.`,
        keyFlows: ['Main entry point flow', 'API request handling', 'Data persistence'],
        gotchas: ['Check configuration requirements', 'Review environment setup'],
        bestPractices: ['Follow existing code patterns', 'Write tests for new features'],
        learningPriorities: ['1. Setup and run locally', '2. Understand architecture', '3. Make first contribution']
      };
    }
  }

  // ============================================
  // JOB MANAGEMENT
  // ============================================

  private async createAnalysisJob(userId: string, repoUrl: string): Promise<AnalysisJob> {
    const jobRef = collection(db, 'analysisJobs');
    const job: Omit<AnalysisJob, 'id'> = {
      userId,
      repoUrl,
      status: 'pending',
      progress: 0,
      currentStep: 'Initializing...',
      startedAt: new Date().toISOString()
    };

    const docRef = await addDoc(jobRef, job);
    return { id: docRef.id, ...job };
  }

  private async updateJobProgress(
    jobId: string,
    progress: number,
    currentStep: string
  ): Promise<void> {
    const jobRef = doc(db, 'analysisJobs', jobId);
    await updateDoc(jobRef, {
      progress,
      currentStep,
      status: 'analyzing'
    });
  }

  private async completeJob(jobId: string): Promise<void> {
    const jobRef = doc(db, 'analysisJobs', jobId);
    await updateDoc(jobRef, {
      status: 'completed',
      progress: 100,
      currentStep: 'Analysis complete!',
      completedAt: new Date().toISOString()
    });
  }

  private async failJob(jobId: string, error: string): Promise<void> {
    const jobRef = doc(db, 'analysisJobs', jobId);
    await updateDoc(jobRef, {
      status: 'failed',
      error,
      completedAt: new Date().toISOString()
    });
  }

  private async saveAnalysisResult(
    userId: string,
    repoUrl: string,
    result: FullAnalysisResult
  ): Promise<void> {
    const resultRef = doc(db, 'analysisResults', `${userId}:${result.repository.fullName}`);
    await setDoc(resultRef, {
      userId,
      repoUrl,
      result,
      savedAt: new Date().toISOString()
    });
  }

  /**
   * Get cached analysis result
   */
  async getCachedAnalysis(
    userId: string,
    repoUrl: string,
    maxAge: number = 86400000 // 24 hours
  ): Promise<FullAnalysisResult | null> {
    const parsed = githubService.parseRepoUrl(repoUrl);
    if (!parsed) return null;

    const resultRef = doc(db, 'analysisResults', `${userId}:${parsed.owner}/${parsed.repo}`);
    const docSnap = await getDoc(resultRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const age = Date.now() - new Date(data.savedAt).getTime();
      
      if (age < maxAge) {
        return data.result as FullAnalysisResult;
      }
    }

    return null;
  }
}

// Export singleton instance
export const repositoryAnalyzer = RepositoryAnalyzer.getInstance();
