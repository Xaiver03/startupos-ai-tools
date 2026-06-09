export type AuthMethod = 'password' | 'api-key' | 'oauth' | 'env';
export interface AuthConfig {
    method: AuthMethod;
    email?: string;
    password?: string;
    apiKey?: string;
    oauthRedirectPort?: number;
}
export interface SavedAuth {
    method: AuthMethod;
    userId: string;
    email: string;
    workspaceId?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    apiKey?: string;
    apiKeyPrefix?: string;
    savedAt: number;
    lastUsedAt?: number;
}
