import keytar from 'keytar';
import inquirer from 'inquirer';
import type { SavedAuth } from './auth-types.js';

const SERVICE_NAME = 'ssos-mcp';
const ACCOUNTS_KEY = 'accounts';
const DEFAULT_ACCOUNT_KEY = 'default-account';

export class AccountManager {
  async listAccounts(): Promise<SavedAuth[]> {
    const accountsStr = await keytar.getPassword(SERVICE_NAME, ACCOUNTS_KEY);
    if (!accountsStr) return [];
    return JSON.parse(accountsStr);
  }

  async saveAccount(auth: SavedAuth): Promise<void> {
    const accounts = await this.listAccounts();

    // Remove existing account with same userId or apiKey
    const filtered = accounts.filter(a => {
      if (auth.method === 'api-key' && a.method === 'api-key') {
        return a.apiKey !== auth.apiKey;
      }
      return a.userId !== auth.userId;
    });

    // Add new account
    filtered.push(auth);

    await keytar.setPassword(SERVICE_NAME, ACCOUNTS_KEY, JSON.stringify(filtered));
  }

  async getDefaultAccount(): Promise<string | null> {
    return await keytar.getPassword(SERVICE_NAME, DEFAULT_ACCOUNT_KEY);
  }

  async setDefaultAccount(accountId: string): Promise<void> {
    await keytar.setPassword(SERVICE_NAME, DEFAULT_ACCOUNT_KEY, accountId);
  }

  async getAccountById(accountId: string): Promise<SavedAuth | null> {
    const accounts = await this.listAccounts();
    return accounts.find(a => a.userId === accountId || a.apiKey === accountId) || null;
  }

  async deleteAccount(accountId: string): Promise<void> {
    const accounts = await this.listAccounts();
    const filtered = accounts.filter(a =>
      a.userId !== accountId && a.apiKey !== accountId
    );
    await keytar.setPassword(SERVICE_NAME, ACCOUNTS_KEY, JSON.stringify(filtered));
  }

  async promptSelectAccount(): Promise<SavedAuth | null> {
    const accounts = await this.listAccounts();
    if (accounts.length === 0) return null;

    const choices = accounts.map(a => ({
      name: `${a.email} (${a.method})${a.method === 'api-key' ? ` - ${a.apiKeyPrefix}...` : ''}`,
      value: a.userId || a.apiKey,
    }));

    choices.push({ name: '+ Add new account', value: '__new__' });

    const { accountId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'accountId',
        message: 'Select an account:',
        choices,
      },
    ]);

    if (accountId === '__new__') return null;

    return await this.getAccountById(accountId);
  }

  getAccountIdentifier(auth: SavedAuth): string {
    return auth.method === 'api-key' ? auth.apiKey! : auth.userId;
  }
}
