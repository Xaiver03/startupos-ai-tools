import http from 'http';
import crypto from 'crypto';
import { URL } from 'url';
import open from 'open';
const REDIRECT_PORT = 8888;
const CLIENT_ID = 'ssos-mcp-cli';
export class OAuthClient {
    config;
    constructor(config) {
        this.config = config;
    }
    /**
     * Start OAuth 2.0 Authorization Code Flow with PKCE
     */
    async authenticate() {
        // Generate PKCE code verifier and challenge
        const codeVerifier = this.generateCodeVerifier();
        const codeChallenge = await this.generateCodeChallenge(codeVerifier);
        // Generate state for CSRF protection
        const state = crypto.randomBytes(16).toString('base64url');
        console.error('\n🌐 Opening browser for OAuth authentication...');
        // Start local server to receive callback and open browser
        const authCode = await this.startCallbackServer(state, codeChallenge);
        // Exchange authorization code for tokens
        const tokens = await this.exchangeCodeForTokens(authCode, codeVerifier);
        return tokens;
    }
    generateCodeVerifier() {
        return crypto.randomBytes(32).toString('base64url');
    }
    async generateCodeChallenge(verifier) {
        const hash = crypto.createHash('sha256').update(verifier).digest('base64url');
        return hash;
    }
    startCallbackServer(expectedState, codeChallenge) {
        return new Promise((resolve, reject) => {
            const server = http.createServer(async (req, res) => {
                const url = new URL(req.url, `http://localhost:${REDIRECT_PORT}`);
                if (url.pathname === '/callback') {
                    const code = url.searchParams.get('code');
                    const state = url.searchParams.get('state');
                    const error = url.searchParams.get('error');
                    if (error) {
                        res.writeHead(400, { 'Content-Type': 'text/html' });
                        res.end(`<html><body><h1>Authentication Failed</h1><p>Error: ${error}</p><p>You can close this window.</p></body></html>`);
                        server.close();
                        reject(new Error(`OAuth error: ${error}`));
                        return;
                    }
                    if (!code || !state) {
                        res.writeHead(400, { 'Content-Type': 'text/html' });
                        res.end('<html><body><h1>Invalid Request</h1><p>Missing code or state parameter.</p></body></html>');
                        server.close();
                        reject(new Error('Missing code or state'));
                        return;
                    }
                    if (state !== expectedState) {
                        res.writeHead(400, { 'Content-Type': 'text/html' });
                        res.end('<html><body><h1>Security Error</h1><p>State mismatch (CSRF protection).</p></body></html>');
                        server.close();
                        reject(new Error('State mismatch'));
                        return;
                    }
                    // Success
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end('<html><body><h1>✓ Authentication Successful</h1><p>You can close this window and return to the terminal.</p></body></html>');
                    server.close();
                    resolve(code);
                }
                else {
                    res.writeHead(404);
                    res.end('Not found');
                }
            });
            server.listen(REDIRECT_PORT, () => {
                console.error(`✓ Local server listening on http://localhost:${REDIRECT_PORT}`);
                // Build authorization URL
                const authUrl = new URL(`${this.config.apiBaseUrl}/oauth/authorize`);
                authUrl.searchParams.set('client_id', CLIENT_ID);
                authUrl.searchParams.set('redirect_uri', `http://localhost:${REDIRECT_PORT}/callback`);
                authUrl.searchParams.set('response_type', 'code');
                authUrl.searchParams.set('state', expectedState);
                authUrl.searchParams.set('code_challenge', codeChallenge);
                authUrl.searchParams.set('code_challenge_method', 'S256');
                authUrl.searchParams.set('scope', 'read write');
                console.error(`If browser doesn't open, visit: ${authUrl.toString()}\n`);
                // Open browser
                open(authUrl.toString()).catch((err) => {
                    console.error('⚠ Could not open browser automatically:', err.message);
                });
            });
            server.on('error', (err) => {
                reject(err);
            });
            // Timeout after 5 minutes
            setTimeout(() => {
                server.close();
                reject(new Error('OAuth timeout - no response received within 5 minutes'));
            }, 5 * 60 * 1000);
        });
    }
    async exchangeCodeForTokens(code, codeVerifier) {
        const response = await fetch(`${this.config.apiBaseUrl}/oauth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                code,
                redirect_uri: `http://localhost:${REDIRECT_PORT}/callback`,
                client_id: CLIENT_ID,
                code_verifier: codeVerifier,
            }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Token exchange failed: ${error.error} - ${error.error_description || ''}`);
        }
        const data = await response.json();
        // Get user info
        const userResponse = await fetch(`${this.config.apiBaseUrl}/api/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${data.access_token}`,
            },
        });
        let userId = 'unknown';
        let email = 'unknown';
        if (userResponse.ok) {
            const userData = await userResponse.json();
            userId = userData.data?.id || 'unknown';
            email = userData.data?.email || 'unknown';
        }
        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            userId,
            email,
        };
    }
}
