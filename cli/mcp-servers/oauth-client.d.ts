import type { SSOSConfig } from './types.js';
export declare class OAuthClient {
    private config;
    constructor(config: SSOSConfig);
    /**
     * Start OAuth 2.0 Authorization Code Flow with PKCE
     */
    authenticate(): Promise<{
        accessToken: string;
        refreshToken: string;
        userId: string;
        email: string;
    }>;
    private generateCodeVerifier;
    private generateCodeChallenge;
    private startCallbackServer;
    private exchangeCodeForTokens;
}
