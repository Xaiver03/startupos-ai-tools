import type { SSOSConfig } from './types.js';
import type { SavedAuth } from './auth-types.js';
export declare class UnifiedAuthManager {
    private config;
    private currentAuth;
    private accountManager;
    constructor(config: SSOSConfig);
    initialize(): Promise<void>;
    private authFlow;
    private promptApiKey;
    private loginWithApiKey;
    private promptPassword;
    private loginWithPassword;
    private oauthFlow;
    private validateAuth;
    refreshTokens(): Promise<void>;
    ensureValidToken(): Promise<void>;
    getAccessToken(): string;
    logout(): Promise<void>;
    switchAccount(accountId: string): Promise<void>;
    listAccounts(): Promise<SavedAuth[]>;
    getCurrentAuth(): SavedAuth | null;
    private loadAuth;
    private saveAuth;
}
