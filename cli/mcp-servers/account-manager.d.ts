import type { SavedAuth } from './auth-types.js';
export declare class AccountManager {
    listAccounts(): Promise<SavedAuth[]>;
    saveAccount(auth: SavedAuth): Promise<void>;
    getDefaultAccount(): Promise<string | null>;
    setDefaultAccount(accountId: string): Promise<void>;
    getAccountById(accountId: string): Promise<SavedAuth | null>;
    deleteAccount(accountId: string): Promise<void>;
    promptSelectAccount(): Promise<SavedAuth | null>;
    getAccountIdentifier(auth: SavedAuth): string;
}
