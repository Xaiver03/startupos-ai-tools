import { config } from 'dotenv';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

config();

const CONFIG_DIR = join(homedir(), '.ssos-cli');
const AUTH_FILE = join(CONFIG_DIR, 'auth.json');
const WORKSPACE_FILE = join(CONFIG_DIR, 'workspace.json');

export interface SavedAuth {
  method: 'api-key' | 'password' | 'jwt' | 'oauth';
  userId: string;
  email: string;
  accessToken?: string;
  refreshToken?: string;
  apiKey?: string;
  apiKeyPrefix?: string;
  expiresAt?: number;
  savedAt: number;
}

export interface AuthConfig {
  apiBaseUrl: string;
  currentAccount?: string;
}

let currentAuth: SavedAuth | null = null;
let currentWorkspace: { id: string; name: string } | null = null;

async function ensureConfigDir() {
  if (!existsSync(CONFIG_DIR)) {
    await mkdir(CONFIG_DIR, { recursive: true });
  }
}

export async function loadAuth(): Promise<SavedAuth | null> {
  if (currentAuth) return currentAuth;

  // Check env vars first — API key takes priority over JWT token
  const envApiKey = process.env.SSOS_API_KEY || process.env.API_TOKEN;
  if (envApiKey) {
    currentAuth = {
      method: 'api-key',
      userId: 'env',
      email: 'env',
      apiKey: envApiKey,
      apiKeyPrefix: envApiKey.substring(0, 16),
      savedAt: Date.now(),
    };
    return currentAuth;
  }

  const envJwt = process.env.SSOS_ACCESS_TOKEN;
  if (envJwt) {
    currentAuth = {
      method: 'jwt',
      userId: 'env',
      email: 'env',
      accessToken: envJwt,
      savedAt: Date.now(),
    };
    return currentAuth;
  }

  try {
    await ensureConfigDir();
    const data = await readFile(AUTH_FILE, 'utf-8');
    const config = JSON.parse(data);
    currentAuth = config.currentAuth || null;
    return currentAuth;
  } catch {
    return null;
  }
}

export async function saveAuth(auth: SavedAuth): Promise<void> {
  await ensureConfigDir();
  currentAuth = auth;
  await writeFile(AUTH_FILE, JSON.stringify({ currentAuth: auth }, null, 2));
}

export async function clearAuth(): Promise<void> {
  currentAuth = null;
  try {
    await writeFile(AUTH_FILE, JSON.stringify({ currentAuth: null }, null, 2));
  } catch {
    // ignore
  }
}

export async function loadWorkspace(): Promise<{ id: string; name: string } | null> {
  if (currentWorkspace) return currentWorkspace;

  const envWorkspace = process.env.SSOS_WORKSPACE_ID;
  if (envWorkspace) {
    currentWorkspace = { id: envWorkspace, name: 'env' };
    return currentWorkspace;
  }

  try {
    await ensureConfigDir();
    const data = await readFile(WORKSPACE_FILE, 'utf-8');
    const config = JSON.parse(data);
    currentWorkspace = config.currentWorkspace || null;
    return currentWorkspace;
  } catch {
    return null;
  }
}

export async function saveWorkspace(workspace: { id: string; name: string }): Promise<void> {
  await ensureConfigDir();
  currentWorkspace = workspace;
  await writeFile(WORKSPACE_FILE, JSON.stringify({ currentWorkspace: workspace }, null, 2));
}

export function getAuthMethod(): string | null {
  return currentAuth?.method ?? null;
}

export function getAuthHeaders(): Record<string, string> {
  const auth = currentAuth;
  if (!auth) {
    throw new Error(
      'Not authenticated. Run "ssos-cli auth login" or set SSOS_API_KEY environment variable.'
    );
  }

  const token = auth.method === 'api-key' ? auth.apiKey : auth.accessToken;
  if (!token) {
    throw new Error('No valid token. Please re-authenticate.');
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export function getApiUrl(): string {
  return process.env.API_URL || 'https://api.finlaw.cloud';
}

export function getWorkspaceId(): string {
  if (currentWorkspace) return currentWorkspace.id;
  const envWorkspace = process.env.SSOS_WORKSPACE_ID;
  if (envWorkspace) return envWorkspace;
  throw new Error(
    'No workspace selected. Run "ssos-cli workspace switch <id>" or set SSOS_WORKSPACE_ID environment variable.'
  );
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Record<string, unknown>> {
  await loadAuth();
  await loadWorkspace();

  const apiUrl = getApiUrl();
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
    ...(options.headers as Record<string, string> || {}),
  };
  // Auto-add workspace header if available and not explicitly overridden
  if (currentWorkspace?.id && !headers['x-workspace-id']) {
    headers['x-workspace-id'] = currentWorkspace.id;
  }
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<Record<string, unknown>>;
}

export interface RawResponse {
  contentType: string;
  body: string;
  status: number;
}

/** Like apiFetch but returns raw text — use for binary responses (Excel, file downloads). */
export async function apiFetchRaw(path: string, options: RequestInit = {}): Promise<RawResponse> {
  await loadAuth();
  await loadWorkspace();

  const apiUrl = getApiUrl();
  const headers: Record<string, string> = {
    // Intentionally omit Content-Type: application/json — raw may have custom type
  };
  // Set auth header (without forcing JSON content-type)
  const auth = currentAuth;
  if (!auth) {
    throw new Error(
      'Not authenticated. Run "ssos-cli auth login" or set SSOS_API_KEY environment variable.'
    );
  }
  const token = auth.method === 'api-key' ? auth.apiKey : auth.accessToken;
  if (!token) {
    throw new Error('No valid token. Please re-authenticate.');
  }
  headers['Authorization'] = `Bearer ${token}`;

  // Merge explicit headers
  if (options.headers) {
    Object.assign(headers, options.headers as Record<string, string>);
  }

  // Auto-add workspace header if available and not explicitly overridden
  if (currentWorkspace?.id && !headers['x-workspace-id']) {
    headers['x-workspace-id'] = currentWorkspace.id;
  }

  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error (${response.status}): ${errorText}`);
  }

  const contentType = response.headers.get('content-type') || '';
  const body = await response.text();
  return { contentType, body, status: response.status };
}
