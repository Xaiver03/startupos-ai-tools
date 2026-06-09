import type { SSOSConfig, APIResponse, Workspace } from './types.js';
import { UnifiedAuthManager } from './unified-auth.js';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export class SSOSClient {
  private config: SSOSConfig;
  private authManager: UnifiedAuthManager;
  private currentWorkspace: Workspace | null = null;

  constructor(config: SSOSConfig) {
    this.config = config;
    this.authManager = new UnifiedAuthManager(config);
  }

  async initialize(): Promise<void> {
    await this.authManager.initialize();
    await this.loadDefaultWorkspace();
  }

  async apiFetch<T = any>(path: string, options: RequestInit = {}, retryCount = 0): Promise<T> {
    try {
      await this.authManager.ensureValidToken();

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authManager.getAccessToken()}`,
        ...options.headers,
      };

      const response = await fetch(`${this.config.apiBaseUrl}${path}`, {
        ...options,
        headers,
      });

      // Handle 401 - token expired, refresh and retry once
      if (response.status === 401 && retryCount === 0) {
        console.error('Token expired, refreshing...');
        await (this.authManager as any).refreshTokens();
        return this.apiFetch(path, options, retryCount + 1);
      }

      if (!response.ok) {
        let errorMsg: string;
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorData.error || response.statusText;
        } catch {
          errorMsg = await response.text();
        }
        throw new Error(`API error (${response.status}): ${errorMsg}`);
      }

      // Parse JSON response
      try {
        return await response.json();
      } catch (parseError) {
        throw new Error(`Invalid JSON response from ${path}`);
      }
    } catch (error) {
      // Network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const isRetriable = this.isRetriableMethod(options.method);
        if (isRetriable && retryCount < MAX_RETRIES) {
          const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
          console.error(`Network error, retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
          await this.sleep(delay);
          return this.apiFetch(path, options, retryCount + 1);
        }
        throw new Error(`Network error: Unable to connect to SSOS API at ${this.config.apiBaseUrl}`);
      }
      throw error;
    }
  }

  private isRetriableMethod(method?: string): boolean {
    const safeMethod = (method || 'GET').toUpperCase();
    // GET and POST create operations are safe to retry
    return ['GET', 'POST'].includes(safeMethod);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async loadDefaultWorkspace(): Promise<void> {
    const data: APIResponse<Workspace[]> = await this.apiFetch('/api/workspaces');
    if (data.data && data.data.length > 0) {
      this.currentWorkspace = data.data[0];
    }
  }

  getCurrentWorkspace(): Workspace | null {
    return this.currentWorkspace;
  }

  setCurrentWorkspace(workspace: Workspace): void {
    this.currentWorkspace = workspace;
  }

  getWorkspaceId(): string {
    if (!this.currentWorkspace) {
      throw new Error('No workspace selected');
    }
    return this.currentWorkspace.id;
  }
}
