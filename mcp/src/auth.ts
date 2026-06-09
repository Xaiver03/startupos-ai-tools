import keytar from 'keytar';
import inquirer from 'inquirer';
import type { SSOSConfig, AuthTokens, APIResponse } from './types.js';

const SERVICE_NAME = 'ssos-mcp';
const ACCOUNT_NAME = 'default';

export class AuthManager {
  private config: SSOSConfig;
  private tokens: AuthTokens | null = null;

  constructor(config: SSOSConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    // Try to load saved tokens
    const savedTokens = await this.loadTokens();
    if (savedTokens) {
      this.tokens = savedTokens;
      // Verify token is still valid
      try {
        await this.validateToken();
        console.error('✓ Authenticated with saved credentials');
        return;
      } catch (error) {
        console.error('⚠ Saved token expired, re-authenticating...');
      }
    }

    // No valid tokens, start login flow
    await this.loginFlow();
  }

  private async loginFlow(): Promise<void> {
    console.error('\n🔐 SSOS Authentication Required\n');

    // Check if credentials are in env vars
    if (this.config.email && this.config.password) {
      console.error('Using credentials from environment variables...');
      await this.login(this.config.email, this.config.password);
      return;
    }

    // Interactive prompt
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

    await this.login(answers.email, answers.password);
  }

  private async login(email: string, password: string): Promise<void> {
    const response = await fetch(`${this.config.apiBaseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }

    const data: APIResponse = await response.json();
    this.tokens = {
      accessToken: data.data.access_token,
      refreshToken: data.data.refresh_token,
      expiresAt: Date.now() + 50 * 60 * 1000,
    };

    // Save tokens securely
    await this.saveTokens(this.tokens);
    console.error('✓ Login successful! Tokens saved securely.\n');
  }

  private async validateToken(): Promise<void> {
    if (!this.tokens) throw new Error('No token');

    const response = await fetch(`${this.config.apiBaseUrl}/api/workspaces`, {
      headers: {
        'Authorization': `Bearer ${this.tokens.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Token invalid');
    }
  }

  private async loadTokens(): Promise<AuthTokens | null> {
    try {
      const tokenStr = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
      if (!tokenStr) return null;
      return JSON.parse(tokenStr);
    } catch (error) {
      return null;
    }
  }

  private async saveTokens(tokens: AuthTokens): Promise<void> {
    await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, JSON.stringify(tokens));
  }

  async refreshTokens(): Promise<void> {
    if (!this.tokens?.refreshToken) {
      await this.loginFlow();
      return;
    }

    const response = await fetch(`${this.config.apiBaseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: this.tokens.refreshToken }),
    });

    if (!response.ok) {
      await this.loginFlow();
      return;
    }

    const data: APIResponse = await response.json();
    this.tokens = {
      accessToken: data.data.access_token,
      refreshToken: data.data.refresh_token,
      expiresAt: Date.now() + 50 * 60 * 1000,
    };

    await this.saveTokens(this.tokens);
  }

  async ensureValidToken(): Promise<void> {
    if (!this.tokens || Date.now() >= this.tokens.expiresAt - 5 * 60 * 1000) {
      await this.refreshTokens();
    }
  }

  getAccessToken(): string {
    if (!this.tokens) throw new Error('Not authenticated');
    return this.tokens.accessToken;
  }

  async logout(): Promise<void> {
    await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
    this.tokens = null;
    console.error('✓ Logged out successfully');
  }
}
