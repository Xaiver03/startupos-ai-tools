export type AuthMethod = 'password' | 'api-key' | 'oauth' | 'env';

export interface AuthConfig {
  method: AuthMethod;
  // For password login
  email?: string;
  password?: string;
  // For API key
  apiKey?: string;
  // For OAuth
  oauthRedirectPort?: number;
}

export interface SavedAuth {
  method: AuthMethod;
  userId: string;
  email: string;
  workspaceId?: string;
  // For password login (saved tokens)
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  // For API key
  apiKey?: string;
  apiKeyPrefix?: string;
  // Metadata
  savedAt: number;
  lastUsedAt?: number;
}
