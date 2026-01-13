/**
 * Enhanced API Client
 * Full-featured HTTP client with caching, retries, and interceptors
 */

import { auth } from './firebase';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  cacheEnabled: boolean;
  cacheDuration: number; // milliseconds
}

export interface RequestOptions extends Omit<RequestInit, 'cache'> {
  requiresAuth?: boolean;
  timeout?: number;
  retries?: number;
  enableCache?: boolean;
  cacheKey?: string;
  cacheDuration?: number;
  onProgress?: (progress: number) => void;
  fetchCache?: RequestCache; // Use this for native fetch cache option
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
  cached: boolean;
  latencyMs: number;
}

export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export type RequestInterceptor = (
  url: string,
  options: RequestOptions
) => Promise<{ url: string; options: RequestOptions }>;

export type ResponseInterceptor = (
  response: Response,
  url: string,
  options: RequestOptions
) => Promise<Response>;

export type ErrorInterceptor = (
  error: Error,
  url: string,
  options: RequestOptions
) => Promise<Response | never>;

// ============================================================================
// CACHE IMPLEMENTATION
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class ApiCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private maxSize: number = 100;

  set<T>(key: string, data: T, duration: number): void {
    // Clean up old entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + duration
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

// ============================================================================
// API CLIENT CLASS
// ============================================================================

export class ApiClient {
  private static instance: ApiClient;
  private config: ApiConfig;
  private cache: ApiCache;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];
  private pendingRequests: Map<string, Promise<unknown>> = new Map();

  constructor(config?: Partial<ApiConfig>) {
    this.config = {
      baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      cacheEnabled: true,
      cacheDuration: 5 * 60 * 1000, // 5 minutes
      ...config
    };
    this.cache = new ApiCache();
  }

  static getInstance(config?: Partial<ApiConfig>): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient(config);
    }
    return ApiClient.instance;
  }

  // ============================================
  // CONFIGURATION
  // ============================================

  updateConfig(config: Partial<ApiConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): ApiConfig {
    return { ...this.config };
  }

  // ============================================
  // INTERCEPTORS
  // ============================================

  addRequestInterceptor(interceptor: RequestInterceptor): () => void {
    this.requestInterceptors.push(interceptor);
    return () => {
      const index = this.requestInterceptors.indexOf(interceptor);
      if (index > -1) this.requestInterceptors.splice(index, 1);
    };
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): () => void {
    this.responseInterceptors.push(interceptor);
    return () => {
      const index = this.responseInterceptors.indexOf(interceptor);
      if (index > -1) this.responseInterceptors.splice(index, 1);
    };
  }

  addErrorInterceptor(interceptor: ErrorInterceptor): () => void {
    this.errorInterceptors.push(interceptor);
    return () => {
      const index = this.errorInterceptors.indexOf(interceptor);
      if (index > -1) this.errorInterceptors.splice(index, 1);
    };
  }

  // ============================================
  // HEADERS
  // ============================================

  private async getHeaders(requiresAuth = true): Promise<HeadersInit> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (requiresAuth) {
      const user = auth.currentUser;
      if (user) {
        try {
          const token = await user.getIdToken();
          headers['Authorization'] = `Bearer ${token}`;
        } catch (error) {
          console.error('Failed to get auth token:', error);
        }
      }
    }

    return headers;
  }

  // ============================================
  // CORE REQUEST METHOD
  // ============================================

  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    let url = `${this.config.baseUrl}${endpoint}`;
    let currentOptions = { ...options };

    // Check cache for GET requests
    const cacheKey = options.cacheKey || `${options.method || 'GET'}:${url}`;
    if (
      (options.enableCache !== false) && 
      this.config.cacheEnabled && 
      (!options.method || options.method === 'GET')
    ) {
      const cached = this.cache.get<T>(cacheKey);
      if (cached) {
        return {
          data: cached,
          status: 200,
          headers: new Headers(),
          cached: true,
          latencyMs: Date.now() - startTime
        };
      }
    }

    // Deduplicate concurrent identical requests
    const requestKey = `${options.method || 'GET'}:${url}:${JSON.stringify(options.body)}`;
    if (this.pendingRequests.has(requestKey)) {
      const result = await this.pendingRequests.get(requestKey);
      return result as ApiResponse<T>;
    }

    // Apply request interceptors
    for (const interceptor of this.requestInterceptors) {
      const result = await interceptor(url, currentOptions);
      url = result.url;
      currentOptions = result.options;
    }

    // Prepare request
    const headers = await this.getHeaders(currentOptions.requiresAuth ?? true);
    const timeout = currentOptions.timeout || this.config.timeout;
    const retries = currentOptions.retries ?? this.config.retries;

    const makeRequest = async (attemptNumber: number): Promise<Response> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          ...currentOptions,
          headers: { ...headers, ...currentOptions.headers },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Apply response interceptors
        let finalResponse = response;
        for (const interceptor of this.responseInterceptors) {
          finalResponse = await interceptor(finalResponse, url, currentOptions);
        }

        return finalResponse;
      } catch (error) {
        clearTimeout(timeoutId);

        // Apply error interceptors
        for (const interceptor of this.errorInterceptors) {
          try {
            return await interceptor(error as Error, url, currentOptions);
          } catch {
            // Interceptor didn't handle the error
          }
        }

        // Retry logic
        if (attemptNumber < retries && this.isRetryable(error as Error)) {
          const delay = this.config.retryDelay * Math.pow(2, attemptNumber);
          await this.sleep(delay);
          return makeRequest(attemptNumber + 1);
        }

        throw error;
      }
    };

    const requestPromise = (async () => {
      try {
        const response = await makeRequest(0);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const error: ApiError = {
            status: response.status,
            message: errorData.detail || errorData.message || response.statusText,
            code: errorData.code,
            details: errorData
          };
          throw error;
        }

        const data = await response.json() as T;

        // Cache successful GET responses
        if (
          (options.enableCache !== false) && 
          this.config.cacheEnabled && 
          (!options.method || options.method === 'GET')
        ) {
          const duration = options.cacheDuration || this.config.cacheDuration;
          this.cache.set(cacheKey, data, duration);
        }

        return {
          data,
          status: response.status,
          headers: response.headers,
          cached: false,
          latencyMs: Date.now() - startTime
        };
      } finally {
        this.pendingRequests.delete(requestKey);
      }
    })();

    this.pendingRequests.set(requestKey, requestPromise);
    return requestPromise;
  }

  // ============================================
  // HTTP METHODS
  // ============================================

  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(
    endpoint: string,
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  async put<T>(
    endpoint: string,
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  async patch<T>(
    endpoint: string,
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // ============================================
  // SPECIALIZED METHODS
  // ============================================

  /**
   * Upload file with progress tracking
   */
  async uploadFile(
    endpoint: string,
    file: File,
    options: RequestOptions & {
      fieldName?: string;
      additionalData?: Record<string, string>;
    } = {}
  ): Promise<ApiResponse<unknown>> {
    const formData = new FormData();
    formData.append(options.fieldName || 'file', file);

    if (options.additionalData) {
      for (const [key, value] of Object.entries(options.additionalData)) {
        formData.append(key, value);
      }
    }

    const headers = await this.getHeaders(options.requiresAuth ?? true);
    // Remove Content-Type to let browser set it with boundary
    delete (headers as Record<string, string>)['Content-Type'];

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && options.onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          options.onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve({
            data,
            status: xhr.status,
            headers: new Headers(),
            cached: false,
            latencyMs: 0
          });
        } catch {
          reject(new Error('Failed to parse response'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', `${this.config.baseUrl}${endpoint}`);
      
      for (const [key, value] of Object.entries(headers)) {
        xhr.setRequestHeader(key, value);
      }

      xhr.send(formData);
    });
  }

  /**
   * Download file
   */
  async downloadFile(
    endpoint: string,
    filename: string,
    options: RequestOptions = {}
  ): Promise<void> {
    const headers = await this.getHeaders(options.requiresAuth ?? true);
    
    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      ...options,
      method: 'GET',
      headers: { ...headers, ...options.headers }
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Stream response (for SSE or chunked responses)
   */
  async *stream<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): AsyncGenerator<T, void, unknown> {
    const headers = await this.getHeaders(options.requiresAuth ?? true);
    
    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      ...options,
      method: options.method || 'GET',
      headers: { 
        ...headers, 
        'Accept': 'text/event-stream',
        ...options.headers 
      }
    });

    if (!response.ok) {
      throw new Error(`Stream failed: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      // Split by newlines and process complete messages
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6)) as T;
            yield data;
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }
  }

  // ============================================
  // CACHE MANAGEMENT
  // ============================================

  clearCache(): void {
    this.cache.clear();
  }

  invalidateCache(pattern?: string | RegExp): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    // This would need the cache to expose keys
    // For now, just clear all
    this.cache.clear();
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private isRetryable(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('abort') ||
      message.includes('fetch')
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// DEFAULT INTERCEPTORS
// ============================================================================

/**
 * Add default interceptors to API client
 */
export function setupDefaultInterceptors(client: ApiClient): void {
  // Request logging
  client.addRequestInterceptor(async (url, options) => {
    console.log(`[API] ${options.method || 'GET'} ${url}`);
    return { url, options };
  });

  // Response logging
  client.addResponseInterceptor(async (response, url, options) => {
    console.log(`[API] ${options.method || 'GET'} ${url} -> ${response.status}`);
    return response;
  });

  // 401 handling
  client.addErrorInterceptor(async (error, _url, _options) => {
    if (error.message.includes('401')) {
      // Trigger re-authentication
      console.warn('[API] Unauthorized - redirecting to login');
      window.location.href = '/login';
    }
    throw error;
  });
}

// Export singleton instance
export const api = ApiClient.getInstance();
