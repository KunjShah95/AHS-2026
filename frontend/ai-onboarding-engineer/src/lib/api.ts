
import { auth } from './firebase';

const API_BASE_URL = "http://localhost:8000";

type RequestOptions = RequestInit & {
  requiresAuth?: boolean;
};

class ApiClient {
  private async getHeaders(requiresAuth = true): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (requiresAuth) {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        // Option: throw error or just don't attach token
        console.warn("API request requires auth but no user is logged in.");
      }
    }

    return headers;
  }

  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const headers = await this.getHeaders(options.requiresAuth);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      method: 'GET',
      headers: { ...headers, ...options.headers },
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, body: unknown, options: RequestOptions = {}): Promise<T> {
    const headers = await this.getHeaders(options.requiresAuth);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      method: 'POST',
      headers: { ...headers, ...options.headers },
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(response);
  }

  // Add put, delete as needed

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || response.statusText || 'API Request Failed');
    }
    return response.json();
  }
}

export const api = new ApiClient();
