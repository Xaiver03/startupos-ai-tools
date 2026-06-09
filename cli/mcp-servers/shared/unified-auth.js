import keytar from 'keytar';
import inquirer from 'inquirer';
import { AccountManager } from './account-manager.js';
import { OAuthClient } from './oauth-client.js';
const SERVICE_NAME = 'ssos-mcp';
const ACCOUNT_NAME = 'default';
export class UnifiedAuthManager {
    config;
    currentAuth = null;
    accountManager;
    constructor(config) {
        this.config = config;
        this.accountManager = new AccountManager();
    }
    async initialize() {
        // Check if there are saved accounts
        const accounts = await this.accountManager.listAccounts();
        if (accounts.length > 0) {
            // Prompt to select account
            const selectedAccount = await this.accountManager.promptSelectAccount();
            if (selectedAccount) {
                this.currentAuth = selectedAccount;
                try {
                    await this.validateAuth();
                    console.error(`✓ Authenticated as ${selectedAccount.email} (${selectedAccount.method})`);
                    // Set as default account
                    const accountId = this.accountManager.getAccountIdentifier(selectedAccount);
                    await this.accountManager.setDefaultAccount(accountId);
                    return;
                }
                catch (error) {
                    console.error('⚠ Saved auth expired, re-authenticating...');
                }
            }
        }
        // No valid auth or user chose to add new account
        await this.authFlow();
    }
    async authFlow() {
        console.error('\n🔐 SSOS Authentication\n');
        // Check environment variables first
        const { email, password } = this.config;
        const envApiKey = process.env.SSOS_API_KEY;
        if (envApiKey) {
            console.error('Using API Key from environment variable...');
            await this.loginWithApiKey(envApiKey);
            return;
        }
        if (email && password) {
            console.error('Using credentials from environment variables...');
            await this.loginWithPassword(email, password);
            return;
        }
        // Interactive: Let user choose auth method
        const { method } = await inquirer.prompt([
            {
                type: 'list',
                name: 'method',
                message: 'Choose authentication method:',
                choices: [
                    { name: '🔑 API Key (Recommended for automation)', value: 'api-key' },
                    { name: '🔐 Email & Password', value: 'password' },
                    { name: '🌐 OAuth (Browser login)', value: 'oauth' },
                ],
            },
        ]);
        switch (method) {
            case 'api-key':
                await this.promptApiKey();
                break;
            case 'password':
                await this.promptPassword();
                break;
            case 'oauth':
                await this.oauthFlow();
                break;
        }
    }
    async promptApiKey() {
        const { apiKey } = await inquirer.prompt([
            {
                type: 'password',
                name: 'apiKey',
                message: 'API Key (sk_live_...):',
                mask: '*',
                validate: (input) => {
                    if (!input.startsWith('sk_live_')) {
                        return 'API Key must start with sk_live_';
                    }
                    return true;
                },
            },
        ]);
        await this.loginWithApiKey(apiKey);
    }
    async loginWithApiKey(apiKey) {
        // Validate API key by making a test request
        const response = await fetch(`${this.config.apiBaseUrl}/api/workspaces`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        });
        if (!response.ok) {
            throw new Error(`API Key invalid: ${response.statusText}`);
        }
        const data = await response.json();
        // Get user info (we need to call /api/my or similar to get user details)
        const userResponse = await fetch(`${this.config.apiBaseUrl}/api/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        });
        let userEmail = 'unknown';
        let userId = 'unknown';
        if (userResponse.ok) {
            const userData = await userResponse.json();
            userEmail = userData.data?.email || 'unknown';
            userId = userData.data?.id || 'unknown';
        }
        this.currentAuth = {
            method: 'api-key',
            userId,
            email: userEmail,
            apiKey,
            apiKeyPrefix: apiKey.substring(0, 16),
            savedAt: Date.now(),
        };
        await this.accountManager.saveAccount(this.currentAuth);
        const accountId = this.accountManager.getAccountIdentifier(this.currentAuth);
        await this.accountManager.setDefaultAccount(accountId);
        console.error(`✓ Authenticated with API Key (${this.currentAuth.apiKeyPrefix}...)\n`);
    }
    async promptPassword() {
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'email',
                message: 'Email:',
                validate: (input) => input.includes('@') || 'Please enter a valid email',
            },
            {
                type: 'password',
                name: 'password',
                message: 'Password:',
                mask: '*',
            },
        ]);
        await this.loginWithPassword(answers.email, answers.password);
    }
    async loginWithPassword(email, password) {
        const response = await fetch(`${this.config.apiBaseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        if (!response.ok) {
            throw new Error(`Login failed: ${response.statusText}`);
        }
        const data = await response.json();
        this.currentAuth = {
            method: 'password',
            userId: data.data.user?.id || 'unknown',
            email: data.data.user?.email || email,
            accessToken: data.data.access_token,
            refreshToken: data.data.refresh_token,
            expiresAt: Date.now() + 50 * 60 * 1000,
            savedAt: Date.now(),
        };
        await this.accountManager.saveAccount(this.currentAuth);
        const accountId = this.accountManager.getAccountIdentifier(this.currentAuth);
        await this.accountManager.setDefaultAccount(accountId);
        console.error(`✓ Login successful as ${email}\n`);
    }
    async oauthFlow() {
        const oauthClient = new OAuthClient(this.config);
        try {
            const tokens = await oauthClient.authenticate();
            this.currentAuth = {
                method: 'oauth',
                userId: tokens.userId,
                email: tokens.email,
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                expiresAt: Date.now() + 50 * 60 * 1000,
                savedAt: Date.now(),
            };
            await this.accountManager.saveAccount(this.currentAuth);
            const accountId = this.accountManager.getAccountIdentifier(this.currentAuth);
            await this.accountManager.setDefaultAccount(accountId);
            console.error(`✓ OAuth login successful as ${tokens.email}\n`);
        }
        catch (error) {
            console.error(`✗ OAuth failed: ${error instanceof Error ? error.message : String(error)}`);
            console.error('Falling back to other auth methods...\n');
            await this.authFlow();
        }
    }
    async validateAuth() {
        if (!this.currentAuth)
            throw new Error('No auth');
        if (this.currentAuth.method === 'api-key') {
            // Test API key
            const response = await fetch(`${this.config.apiBaseUrl}/health`, {
                headers: {
                    'Authorization': `Bearer ${this.currentAuth.apiKey}`,
                },
            });
            if (!response.ok)
                throw new Error('API key invalid');
        }
        else if (this.currentAuth.method === 'password' || this.currentAuth.method === 'oauth') {
            // Check token expiry
            if (this.currentAuth.expiresAt && Date.now() >= this.currentAuth.expiresAt - 5 * 60 * 1000) {
                await this.refreshTokens();
            }
        }
    }
    async refreshTokens() {
        if (!this.currentAuth?.refreshToken) {
            await this.authFlow();
            return;
        }
        const response = await fetch(`${this.config.apiBaseUrl}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: this.currentAuth.refreshToken }),
        });
        if (!response.ok) {
            await this.authFlow();
            return;
        }
        const data = await response.json();
        this.currentAuth = {
            ...this.currentAuth,
            accessToken: data.data.access_token,
            refreshToken: data.data.refresh_token,
            expiresAt: Date.now() + 50 * 60 * 1000,
        };
        await this.accountManager.saveAccount(this.currentAuth);
    }
    async ensureValidToken() {
        if (!this.currentAuth) {
            await this.authFlow();
            return;
        }
        if (this.currentAuth.method === 'password' || this.currentAuth.method === 'oauth') {
            if (this.currentAuth.expiresAt && Date.now() >= this.currentAuth.expiresAt - 5 * 60 * 1000) {
                await this.refreshTokens();
            }
        }
    }
    getAccessToken() {
        if (!this.currentAuth)
            throw new Error('Not authenticated');
        if (this.currentAuth.method === 'api-key') {
            return this.currentAuth.apiKey;
        }
        else if (this.currentAuth.method === 'password' || this.currentAuth.method === 'oauth') {
            return this.currentAuth.accessToken;
        }
        throw new Error('No valid token');
    }
    async logout() {
        if (this.currentAuth) {
            const accountId = this.accountManager.getAccountIdentifier(this.currentAuth);
            await this.accountManager.deleteAccount(accountId);
        }
        this.currentAuth = null;
        console.error('✓ Logged out successfully');
    }
    async switchAccount(accountId) {
        const account = await this.accountManager.getAccountById(accountId);
        if (!account) {
            throw new Error('Account not found');
        }
        this.currentAuth = account;
        await this.accountManager.setDefaultAccount(accountId);
        await this.validateAuth();
        console.error(`✓ Switched to ${account.email}`);
    }
    async listAccounts() {
        return await this.accountManager.listAccounts();
    }
    getCurrentAuth() {
        return this.currentAuth;
    }
    async loadAuth() {
        try {
            const authStr = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
            if (!authStr)
                return null;
            return JSON.parse(authStr);
        }
        catch (error) {
            return null;
        }
    }
    async saveAuth(auth) {
        await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, JSON.stringify(auth));
    }
}
