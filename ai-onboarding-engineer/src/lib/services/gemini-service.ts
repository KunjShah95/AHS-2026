/**
 * Gemini AI Service
 * Centralized AI interaction layer with advanced prompting, caching, and retry logic
 */

import { doc, getDoc, setDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

// TYPES & INTERFACES


export interface GeminiConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxOutputTokens: number;
  topP: number;
  topK: number;
}

export interface GenerationResult {
  text: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
  cached: boolean;
  latencyMs: number;
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
  category: 'analysis' | 'explanation' | 'roadmap' | 'task' | 'documentation';
}

export interface RateLimitState {
  requestsThisMinute: number;
  requestsThisHour: number;
  requestsThisDay: number;
  lastRequestTime: string;
  isLimited: boolean;
}

// ADVANCED PROMPT TEMPLATES

export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  codebaseAnalysis: {
    id: 'codebase-analysis',
    name: 'Codebase Analysis',
    description: 'Comprehensive analysis of a repository structure and code',
    category: 'analysis',
    variables: ['repoName', 'fileTree', 'sampleCode', 'technologies'],
    template: `You are an expert software architect analyzing a codebase for developer onboarding.

## Repository: {{repoName}}

### File Structure:
{{fileTree}}

### Sample Code:
{{sampleCode}}

### Detected Technologies:
{{technologies}}

## Task: Provide a comprehensive codebase analysis including:

1. **Architecture Overview**
   - Design patterns used
   - System architecture (monolith, microservices, etc.)
   - Key architectural decisions

2. **Entry Points**
   - Main application entry points
   - API endpoints structure
   - Event handlers

3. **Core Modules**
   - Critical business logic locations
   - Shared utilities and helpers
   - Configuration management

4. **Data Flow**
   - How data moves through the system
   - State management approach
   - Database interactions

5. **Testing Strategy**
   - Test coverage areas
   - Testing patterns used
   - Test utilities

6. **Key Files to Understand First**
   - Priority ordered list of files
   - Reasoning for each priority

7. **Potential Gotchas**
   - Non-obvious conventions
   - Legacy code areas
   - Complex dependencies

Respond in a structured JSON format.`
  },

  generateRoadmap: {
    id: 'generate-roadmap',
    name: 'Learning Roadmap Generator',
    description: 'Creates a personalized learning path for a developer',
    category: 'roadmap',
    variables: ['codebaseAnalysis', 'developerLevel', 'targetSkills', 'timeConstraint'],
    template: `You are an expert developer educator creating a personalized learning roadmap.

## Codebase Context:
{{codebaseAnalysis}}

## Developer Profile:
- Experience Level: {{developerLevel}}
- Target Skills: {{targetSkills}}
- Time Available: {{timeConstraint}}

## Task: Create a comprehensive learning roadmap including:

1. **Phase 1: Foundation (Days 1-3)**
   - Environment setup
   - Architecture overview
   - Core concept understanding

2. **Phase 2: Exploration (Days 4-7)**
   - Key module deep-dives
   - Data flow understanding
   - API familiarity

3. **Phase 3: Contribution (Days 8-14)**
   - First bug fix
   - First feature addition
   - Code review participation

4. **Phase 4: Ownership (Days 15-30)**
   - Module ownership
   - Documentation improvement
   - Mentoring readiness

For each phase, include:
- Specific files/modules to study
- Hands-on tasks
- Success criteria
- Estimated time
- Resources needed

Respond in structured JSON format.`
  },

  explainCode: {
    id: 'explain-code',
    name: 'Code Explanation',
    description: 'Explains code at appropriate experience level',
    category: 'explanation',
    variables: ['code', 'filename', 'experienceLevel', 'context'],
    template: `You are a patient and thorough code educator.

## Code to Explain:
\`\`\`
{{code}}
\`\`\`

## File: {{filename}}
## Context: {{context}}
## Developer Level: {{experienceLevel}}

Adjust your explanation complexity based on developer level:
- **junior**: Explain every concept, use analogies, step-by-step walkthroughs
- **mid**: Focus on patterns, architecture decisions, edge cases
- **senior**: Highlight advanced patterns, performance considerations, trade-offs
- **expert**: Discuss optimization opportunities, architectural alternatives

Provide:
1. **High-Level Summary** (2-3 sentences)
2. **Line-by-Line Breakdown** (key sections only)
3. **Key Concepts Used** (with brief explanations if junior/mid)
4. **Common Patterns** (identified patterns)
5. **Potential Issues** (bugs, performance, security)
6. **Related Files** (likely connected components)
7. **Learning Resources** (if applicable for junior/mid)

Format as structured JSON.`
  },

  generateTasks: {
    id: 'generate-tasks',
    name: 'Task Generator',
    description: 'Creates onboarding tasks for developers',
    category: 'task',
    variables: ['repoAnalysis', 'developerLevel', 'focusArea', 'difficulty'],
    template: `You are an experienced tech lead creating onboarding tasks.

## Repository Analysis:
{{repoAnalysis}}

## Developer Profile:
- Level: {{developerLevel}}
- Focus Area: {{focusArea}}
- Preferred Difficulty: {{difficulty}}

## Task: Generate 5-10 progressive onboarding tasks:

For each task include:
1. **Title**: Clear, actionable title
2. **Description**: What needs to be done
3. **Objective**: What the developer will learn
4. **Prerequisites**: Prior tasks or knowledge needed
5. **Files Involved**: Specific files to work with
6. **Steps**: Detailed step-by-step instructions
7. **Success Criteria**: How to know it's done correctly
8. **Estimated Time**: Realistic time estimate
9. **Hints**: Optional hints if stuck
10. **Bonus Challenge**: Optional advanced extension

Tasks should progress from:
- Reading/understanding → Making small changes → Creating new features

Respond in structured JSON format with tasks array.`
  },

  analyzeTechDebt: {
    id: 'analyze-tech-debt',
    name: 'Tech Debt Analysis',
    description: 'Identifies and prioritizes technical debt',
    category: 'analysis',
    variables: ['codebaseFiles', 'gitHistory', 'complexity'],
    template: `You are a technical debt analyst examining a codebase.

## Codebase Information:
{{codebaseFiles}}

## Git History Summary:
{{gitHistory}}

## Complexity Metrics:
{{complexity}}

## Task: Identify and analyze technical debt:

1. **Critical Debt** (Address Immediately)
   - Security vulnerabilities
   - Performance bottlenecks
   - Broken functionality

2. **High Priority Debt** (Next Sprint)
   - Outdated dependencies
   - Missing tests for critical paths
   - Documentation gaps

3. **Medium Priority Debt** (Near Future)
   - Code duplication
   - Inconsistent patterns
   - Suboptimal architecture

4. **Low Priority Debt** (When Convenient)
   - Style inconsistencies
   - Minor refactoring opportunities
   - Nice-to-have improvements

For each item provide:
- Location (file/function)
- Description
- Impact assessment (1-10)
- Effort to fix (1-10)
- Recommended approach
- Risk if not addressed

Respond in structured JSON format.`
  },

  generateDocumentation: {
    id: 'generate-documentation',
    name: 'Documentation Generator',
    description: 'Creates living documentation from code',
    category: 'documentation',
    variables: ['moduleCode', 'moduleName', 'relatedModules'],
    template: `You are a technical writer creating documentation.

## Module: {{moduleName}}

## Code:
{{moduleCode}}

## Related Modules:
{{relatedModules}}

## Task: Generate comprehensive documentation:

1. **Module Overview**
   - Purpose and responsibility
   - Key features
   - When to use

2. **Architecture**
   - Component diagram (mermaid syntax)
   - Data flow
   - Dependencies

3. **API Reference**
   - Public functions/methods
   - Parameters and return types
   - Usage examples

4. **Usage Examples**
   - Common use cases
   - Code snippets
   - Best practices

5. **Configuration**
   - Available options
   - Environment variables
   - Defaults

6. **Troubleshooting**
   - Common issues
   - Debug tips
   - FAQ

Format in Markdown with embedded JSON for structured data.`
  }
};

// GEMINI SERVICE CLASS

export class GeminiService {
  private static instance: GeminiService;
  private config: GeminiConfig;
  private rateLimitState: RateLimitState = {
    requestsThisMinute: 0,
    requestsThisHour: 0,
    requestsThisDay: 0,
    lastRequestTime: new Date().toISOString(),
    isLimited: false
  };

  private constructor() {
    this.config = {
      apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
      model: 'gemini-2.0-flash',
      temperature: 0.7,
      maxOutputTokens: 8192,
      topP: 0.95,
      topK: 40
    };
  }

  static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  // CORE GENERATION METHODS
  
  /**
   * Generate text with automatic caching and retry logic
   */
  async generate(
    prompt: string,
    options: Partial<GeminiConfig> = {},
    cacheKey?: string
  ): Promise<GenerationResult> {
    const startTime = Date.now();

    // Check cache first
    if (cacheKey) {
      const cached = await this.getCachedResponse(cacheKey);
      if (cached) {
        return {
          ...cached,
          cached: true,
          latencyMs: Date.now() - startTime
        };
      }
    }

    // Check rate limits
    await this.checkRateLimits();

    const mergedConfig = { ...this.config, ...options };
    let lastError: Error | null = null;
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await this.callGeminiAPI(prompt, mergedConfig);
        
        // Cache the response
        if (cacheKey) {
          await this.cacheResponse(cacheKey, response);
        }

        return {
          ...response,
          cached: false,
          latencyMs: Date.now() - startTime
        };
      } catch (error) {
        lastError = error as Error;
        
        if (this.isRetryableError(error)) {
          const delay = Math.pow(2, attempt) * 1000;
          await this.sleep(delay);
          continue;
        }
        
        throw error;
      }
    }

    throw lastError || new Error('Generation failed after retries');
  }

  /**
   * Generate using a predefined template
   */
  async generateFromTemplate(
    templateId: string,
    variables: Record<string, string>,
    options: Partial<GeminiConfig> = {}
  ): Promise<GenerationResult> {
    const template = PROMPT_TEMPLATES[templateId];
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    let prompt = template.template;
    for (const [key, value] of Object.entries(variables)) {
      prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    // Generate cache key from template and variables
    const cacheKey = `template:${templateId}:${this.hashString(JSON.stringify(variables))}`;

    return this.generate(prompt, options, cacheKey);
  }

  /**
   * Multi-turn conversation with context
   */
  async chat(
    userId: string,
    conversationId: string,
    message: string,
    systemPrompt?: string
  ): Promise<GenerationResult> {
    // Retrieve conversation history
    const history = await this.getConversationHistory(userId, conversationId);
    
    // Build context
    let fullPrompt = '';
    
    if (systemPrompt) {
      fullPrompt += `System: ${systemPrompt}\n\n`;
    }

    for (const msg of history.slice(-10)) { // Last 10 messages for context
      fullPrompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n\n`;
    }
    
    fullPrompt += `User: ${message}\n\nAssistant:`;

    const result = await this.generate(fullPrompt, { temperature: 0.8 });

    // Save to conversation history
    await this.saveConversationMessage(userId, conversationId, {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });

    await this.saveConversationMessage(userId, conversationId, {
      role: 'assistant',
      content: result.text,
      timestamp: new Date().toISOString()
    });

    return result;
  }

  /**
   * Stream generation for real-time responses
   */
  async *generateStream(
    prompt: string,
    options: Partial<GeminiConfig> = {}
  ): AsyncGenerator<string, void, unknown> {
    const mergedConfig = { ...this.config, ...options };
    
    // For now, simulate streaming by chunking the response
    // In production, use the actual streaming API
    const result = await this.generate(prompt, mergedConfig);
    const words = result.text.split(' ');
    
    for (let i = 0; i < words.length; i++) {
      yield words[i] + (i < words.length - 1 ? ' ' : '');
      await this.sleep(50); // Simulate streaming delay
    }
  }

  // SPECIALIZED GENERATION METHODS

  /**
   * Analyze a codebase structure
   */
  async analyzeCodebase(
    repoName: string,
    fileTree: string,
    sampleCode: string,
    technologies: string[]
  ): Promise<Record<string, unknown>> {
    const result = await this.generateFromTemplate('codebaseAnalysis', {
      repoName,
      fileTree,
      sampleCode,
      technologies: technologies.join(', ')
    });

    return this.parseJsonResponse(result.text);
  }

  /**
   * Generate a learning roadmap
   */
  async generateLearningRoadmap(
    codebaseAnalysis: string,
    developerLevel: string,
    targetSkills: string[],
    timeConstraint: string
  ): Promise<Record<string, unknown>> {
    const result = await this.generateFromTemplate('generateRoadmap', {
      codebaseAnalysis,
      developerLevel,
      targetSkills: targetSkills.join(', '),
      timeConstraint
    });

    return this.parseJsonResponse(result.text);
  }

  /**
   * Explain code at appropriate level
   */
  async explainCode(
    code: string,
    filename: string,
    experienceLevel: string,
    context: string
  ): Promise<Record<string, unknown>> {
    const result = await this.generateFromTemplate('explainCode', {
      code,
      filename,
      experienceLevel,
      context
    });

    return this.parseJsonResponse(result.text);
  }

  /**
   * Generate onboarding tasks
   */
  async generateOnboardingTasks(
    repoAnalysis: string,
    developerLevel: string,
    focusArea: string,
    difficulty: string
  ): Promise<Record<string, unknown>[]> {
    const result = await this.generateFromTemplate('generateTasks', {
      repoAnalysis,
      developerLevel,
      focusArea,
      difficulty
    });

    const parsed = this.parseJsonResponse(result.text);
    return (parsed as { tasks?: Record<string, unknown>[] }).tasks || [];
  }

  /**
   * Analyze technical debt
   */
  async analyzeTechnicalDebt(
    codebaseFiles: string,
    gitHistory: string,
    complexity: string
  ): Promise<Record<string, unknown>> {
    const result = await this.generateFromTemplate('analyzeTechDebt', {
      codebaseFiles,
      gitHistory,
      complexity
    });

    return this.parseJsonResponse(result.text);
  }

  /**
   * Generate documentation
   */
  async generateDocumentation(
    moduleCode: string,
    moduleName: string,
    relatedModules: string
  ): Promise<string> {
    const result = await this.generateFromTemplate('generateDocumentation', {
      moduleCode,
      moduleName,
      relatedModules
    });

    return result.text;
  }

  // HELPER METHODS
 private async callGeminiAPI(
    prompt: string,
    config: GeminiConfig
  ): Promise<Omit<GenerationResult, 'cached' | 'latencyMs'>> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: config.temperature,
            topK: config.topK,
            topP: config.topP,
            maxOutputTokens: config.maxOutputTokens,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Gemini API request failed');
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Estimate token counts (Gemini doesn't always return exact counts)
    const promptTokens = Math.ceil(prompt.length / 4);
    const completionTokens = Math.ceil(text.length / 4);

    // Update rate limit tracking
    await this.updateRateLimits();

    return {
      text,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      model: config.model
    };
  }

  private async getCachedResponse(cacheKey: string): Promise<Omit<GenerationResult, 'cached' | 'latencyMs'> | null> {
    try {
      const docRef = doc(db, 'aiResponseCache', cacheKey);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Check if cache is still valid (24 hours)
        const cacheAge = Date.now() - new Date(data.createdAt).getTime();
        if (cacheAge < 24 * 60 * 60 * 1000) {
          return {
            text: data.text,
            promptTokens: data.promptTokens,
            completionTokens: data.completionTokens,
            totalTokens: data.totalTokens,
            model: data.model
          };
        }
      }
    } catch (error) {
      console.error('Cache retrieval error:', error);
    }
    
    return null;
  }

  private async cacheResponse(
    cacheKey: string,
    response: Omit<GenerationResult, 'cached' | 'latencyMs'>
  ): Promise<void> {
    try {
      const docRef = doc(db, 'aiResponseCache', cacheKey);
      await setDoc(docRef, {
        ...response,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Cache save error:', error);
    }
  }

  private async getConversationHistory(
    userId: string,
    conversationId: string
  ): Promise<ConversationMessage[]> {
    try {
      const q = query(
        collection(db, 'conversations'),
        where('userId', '==', userId),
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'asc'),
        limit(50)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as ConversationMessage);
    } catch (error) {
      console.error('Conversation history error:', error);
      return [];
    }
  }

  private async saveConversationMessage(
    userId: string,
    conversationId: string,
    message: ConversationMessage
  ): Promise<void> {
    try {
      const messagesRef = collection(db, 'conversations');
      await setDoc(doc(messagesRef), {
        userId,
        conversationId,
        ...message
      });
    } catch (error) {
      console.error('Save message error:', error);
    }
  }

  private async checkRateLimits(): Promise<void> {
    const now = Date.now();
    const lastRequest = new Date(this.rateLimitState.lastRequestTime).getTime();
    
    // Reset counters if time windows have passed
    if (now - lastRequest > 60000) {
      this.rateLimitState.requestsThisMinute = 0;
    }
    if (now - lastRequest > 3600000) {
      this.rateLimitState.requestsThisHour = 0;
    }
    if (now - lastRequest > 86400000) {
      this.rateLimitState.requestsThisDay = 0;
    }

    // Check limits (configurable)
    const limits = {
      perMinute: 60,
      perHour: 1000,
      perDay: 10000
    };

    if (
      this.rateLimitState.requestsThisMinute >= limits.perMinute ||
      this.rateLimitState.requestsThisHour >= limits.perHour ||
      this.rateLimitState.requestsThisDay >= limits.perDay
    ) {
      this.rateLimitState.isLimited = true;
      throw new Error('Rate limit exceeded. Please try again later.');
    }
  }

  private async updateRateLimits(): Promise<void> {
    this.rateLimitState.requestsThisMinute++;
    this.rateLimitState.requestsThisHour++;
    this.rateLimitState.requestsThisDay++;
    this.rateLimitState.lastRequestTime = new Date().toISOString();
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('rate') ||
        message.includes('timeout') ||
        message.includes('503') ||
        message.includes('429')
      );
    }
    return false;
  }

  private parseJsonResponse(text: string): Record<string, unknown> {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) ||
                      text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } catch {
        console.error('Failed to parse JSON response');
      }
    }

    // Return as raw text if JSON parsing fails
    return { rawText: text };
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // CONFIGURATION METHODS

  updateConfig(config: Partial<GeminiConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getRateLimitState(): RateLimitState {
    return { ...this.rateLimitState };
  }
}

// Export singleton instance
export const geminiService = GeminiService.getInstance();
