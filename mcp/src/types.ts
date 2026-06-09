export interface SSOSConfig {
  apiBaseUrl: string;
  email?: string;
  password?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface APIResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface Workspace {
  id: string;
  name: string;
  taxpayer_type: string;
  company_type: string;
  accounting_standard: string;
}

export interface JournalEntry {
  id: string;
  entry_date: string;
  entry_number: string;
  description: string;
  total_debit: string;
  total_credit: string;
  status: string;
  line_items: JournalLineItem[];
}

export interface JournalLineItem {
  account_code: string;
  account_name: string;
  debit_amount: string;
  credit_amount: string;
  description: string;
}

export interface Account {
  id: string;
  code: string;
  name: string;
  category: string;
  balance: string;
}
