import { UnifiedAuthManager } from './unified-auth.js';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
export class SSOSClient {
    config;
    authManager;
    currentWorkspace = null;
    constructor(config) {
        this.config = config;
        this.authManager = new UnifiedAuthManager(config);
    }
    async initialize() {
        await this.authManager.initialize();
        await this.loadDefaultWorkspace();
    }
    async apiFetch(path, options = {}, retryCount = 0) {
        try {
            await this.authManager.ensureValidToken();
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.authManager.getAccessToken()}`,
                ...options.headers,
            };
            const response = await fetch(`${this.config.apiBaseUrl}${path}`, {
                ...options,
                headers,
            });
            // Handle 401 - token expired, refresh and retry once
            if (response.status === 401 && retryCount === 0) {
                console.error('Token expired, refreshing...');
                await this.authManager.refreshTokens();
                return this.apiFetch(path, options, retryCount + 1);
            }
            if (!response.ok) {
                let errorMsg;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorData.error || response.statusText;
                }
                catch {
                    errorMsg = await response.text();
                }
                throw new Error(`API error (${response.status}): ${errorMsg}`);
            }
            // Parse JSON response
            try {
                return await response.json();
            }
            catch (parseError) {
                throw new Error(`Invalid JSON response from ${path}`);
            }
        }
        catch (error) {
            // Network errors
            if (error instanceof TypeError && error.message.includes('fetch')) {
                const isRetriable = this.isRetriableMethod(options.method);
                if (isRetriable && retryCount < MAX_RETRIES) {
                    const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
                    console.error(`Network error, retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
                    await this.sleep(delay);
                    return this.apiFetch(path, options, retryCount + 1);
                }
                throw new Error(`Network error: Unable to connect to SSOS API at ${this.config.apiBaseUrl}`);
            }
            throw error;
        }
    }
    isRetriableMethod(method) {
        const safeMethod = (method || 'GET').toUpperCase();
        // GET and POST create operations are safe to retry
        return ['GET', 'POST'].includes(safeMethod);
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async loadDefaultWorkspace() {
        const data = await this.apiFetch('/api/workspaces');
        if (data.data && data.data.length > 0) {
            this.currentWorkspace = data.data[0];
        }
    }
    getCurrentWorkspace() {
        return this.currentWorkspace;
    }
    setCurrentWorkspace(workspace) {
        this.currentWorkspace = workspace;
    }
    getWorkspaceId() {
        if (!this.currentWorkspace) {
            throw new Error('No workspace selected');
        }
        return this.currentWorkspace.id;
    }
}
