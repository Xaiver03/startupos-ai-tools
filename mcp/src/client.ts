import type { SSOSConfig, APIResponse, Workspace } from './types.js';
import { UnifiedAuthManager } from './unified-auth.js';

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

  async apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
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

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} ${error}`);
    }

    return response.json();
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
