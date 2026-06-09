import type { SSOSConfig, Workspace } from './types.js';
export declare class SSOSClient {
    private config;
    private authManager;
    private currentWorkspace;
    constructor(config: SSOSConfig);
    initialize(): Promise<void>;
    apiFetch<T = any>(path: string, options?: RequestInit, retryCount?: number): Promise<T>;
    private isRetriableMethod;
    private sleep;
    private loadDefaultWorkspace;
    getCurrentWorkspace(): Workspace | null;
    setCurrentWorkspace(workspace: Workspace): void;
    getWorkspaceId(): string;
}
