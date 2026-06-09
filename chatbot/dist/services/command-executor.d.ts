/**
 * Execute parsed CLI commands by calling the SSOS API directly.
 * Avoids spawning child processes — uses the same apiFetch pattern as the CLI.
 */
export declare function executeCommand(command: {
    name: string;
    args: string;
}, workspaceId?: string): Promise<any>;
