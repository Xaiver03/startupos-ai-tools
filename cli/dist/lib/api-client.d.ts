export interface SavedAuth {
    method: 'api-key' | 'password' | 'jwt' | 'oauth';
    userId: string;
    email: string;
    accessToken?: string;
    refreshToken?: string;
    apiKey?: string;
    apiKeyPrefix?: string;
    expiresAt?: number;
    savedAt: number;
}
export interface AuthConfig {
    apiBaseUrl: string;
    currentAccount?: string;
}
export declare function loadAuth(): Promise<SavedAuth | null>;
export declare function saveAuth(auth: SavedAuth): Promise<void>;
export declare function clearAuth(): Promise<void>;
export declare function loadWorkspace(): Promise<{
    id: string;
    name: string;
} | null>;
export declare function saveWorkspace(workspace: {
    id: string;
    name: string;
}): Promise<void>;
export declare function getAuthMethod(): string | null;
export declare function getAuthHeaders(): Record<string, string>;
export declare function getApiUrl(): string;
export declare function getWorkspaceId(): string;
export declare function apiFetch(path: string, options?: RequestInit): Promise<Record<string, unknown>>;
export interface RawResponse {
    contentType: string;
    body: string;
    status: number;
}
/** Like apiFetch but returns raw text — use for binary responses (Excel, file downloads). */
export declare function apiFetchRaw(path: string, options?: RequestInit): Promise<RawResponse>;
