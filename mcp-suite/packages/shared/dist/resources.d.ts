/**
 * Shared resource registry for SSOS
 * Used by both CLI (crud.ts) and MCP (core package)
 */
export interface ResourceConfig {
    apiPath: string;
    label?: string;
    actions?: string[];
    noCrud?: boolean;
    workspaceOptional?: boolean;
    admin?: boolean;
    method?: 'PUT' | 'PATCH';
}
/**
 * Resource Registry — maps resource names to API paths
 * 127 resources registered
 */
export declare const RESOURCES: Record<string, ResourceConfig>;
/**
 * Get resource config by name
 * @throws Error if resource not found
 */
export declare function getResource(name: string): ResourceConfig;
/**
 * Check if resource supports CRUD operations
 * @throws Error if resource is action-only
 */
export declare function assertCrud(cfg: ResourceConfig, resource: string, operation: string): void;
/**
 * Get all CRUD-enabled resources
 */
export declare function getCrudResources(): string[];
/**
 * Get all action-only resources
 */
export declare function getActionOnlyResources(): string[];
