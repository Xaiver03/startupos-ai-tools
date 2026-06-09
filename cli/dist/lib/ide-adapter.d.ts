/**
 * AI IDE Adapter - Automatically detect and configure MCP servers for various AI IDEs
 *
 * Supported IDEs:
 * - Claude Code (official)
 * - Cursor
 * - Windsurf (Codeium)
 * - VS Code + Cline
 * - Zed Editor
 */
export interface IDEConfig {
    name: string;
    displayName: string;
    configPaths: {
        darwin?: string;
        win32?: string;
        linux?: string;
    };
    configFormat: 'json' | 'toml' | 'yaml';
    mcpKey: string;
    detected: boolean;
    configPath?: string;
}
export interface MCPServerConfig {
    command: string;
    args: string[];
    env?: Record<string, string>;
}
export declare function detectInstalledIDEs(): IDEConfig[];
export declare function readIDEConfig(ide: IDEConfig): any;
export declare function writeIDEConfig(ide: IDEConfig, config: any): boolean;
export declare function addMCPServersToIDE(ide: IDEConfig, servers: Record<string, MCPServerConfig>): {
    added: number;
    skipped: number;
    errors: string[];
};
export declare function getMCPServerConfigs(mcpSuitePath: string): Record<string, MCPServerConfig>;
export declare function getIDESkillPath(ide: IDEConfig): string | null;
