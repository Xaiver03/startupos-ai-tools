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
import fs from 'fs';
import path from 'path';
import os from 'os';
const IDE_CONFIGS = [
    {
        name: 'claude-code',
        displayName: 'Claude Code',
        configPaths: {
            darwin: '~/.claude.json',
            win32: '%USERPROFILE%\\.claude.json',
            linux: '~/.claude.json',
        },
        configFormat: 'json',
        mcpKey: 'mcpServers',
        detected: false,
    },
    {
        name: 'cursor',
        displayName: 'Cursor',
        configPaths: {
            darwin: '~/Library/Application Support/Cursor/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json',
            win32: '%APPDATA%\\Cursor\\User\\globalStorage\\rooveterinaryinc.roo-cline\\settings\\cline_mcp_settings.json',
            linux: '~/.config/Cursor/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json',
        },
        configFormat: 'json',
        mcpKey: 'mcpServers',
        detected: false,
    },
    {
        name: 'windsurf',
        displayName: 'Windsurf (Codeium)',
        configPaths: {
            darwin: '~/Library/Application Support/Windsurf/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json',
            win32: '%APPDATA%\\Windsurf\\User\\globalStorage\\rooveterinaryinc.roo-cline\\settings\\cline_mcp_settings.json',
            linux: '~/.config/Windsurf/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json',
        },
        configFormat: 'json',
        mcpKey: 'mcpServers',
        detected: false,
    },
    {
        name: 'vscode-cline',
        displayName: 'VS Code + Cline',
        configPaths: {
            darwin: '~/Library/Application Support/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json',
            win32: '%APPDATA%\\Code\\User\\globalStorage\\rooveterinaryinc.roo-cline\\settings\\cline_mcp_settings.json',
            linux: '~/.config/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json',
        },
        configFormat: 'json',
        mcpKey: 'mcpServers',
        detected: false,
    },
    {
        name: 'zed',
        displayName: 'Zed Editor',
        configPaths: {
            darwin: '~/.config/zed/settings.json',
            win32: '%APPDATA%\\Zed\\settings.json',
            linux: '~/.config/zed/settings.json',
        },
        configFormat: 'json',
        mcpKey: 'language_models.anthropic.mcpServers',
        detected: false,
    },
    {
        name: 'opencode',
        displayName: 'OpenCode',
        configPaths: {
            darwin: '~/.opencode/mcp_settings.json',
            win32: '%APPDATA%\\OpenCode\\mcp_settings.json',
            linux: '~/.config/opencode/mcp_settings.json',
        },
        configFormat: 'json',
        mcpKey: 'mcpServers',
        detected: false,
    },
    {
        name: 'hermes',
        displayName: 'Hermes',
        configPaths: {
            darwin: '~/.hermes/config.json',
            win32: '%APPDATA%\\Hermes\\config.json',
            linux: '~/.config/hermes/config.json',
        },
        configFormat: 'json',
        mcpKey: 'mcpServers',
        detected: false,
    },
    {
        name: 'codex',
        displayName: 'Codex',
        configPaths: {
            darwin: '~/Library/Application Support/Codex/mcp.json',
            win32: '%APPDATA%\\Codex\\mcp.json',
            linux: '~/.config/codex/mcp.json',
        },
        configFormat: 'json',
        mcpKey: 'servers',
        detected: false,
    },
    {
        name: 'openclaw',
        displayName: 'OpenClaw',
        configPaths: {
            darwin: '~/.openclaw/mcp.json',
            win32: '%USERPROFILE%\\.openclaw\\mcp.json',
            linux: '~/.openclaw/mcp.json',
        },
        configFormat: 'json',
        mcpKey: 'mcpServers',
        detected: false,
    },
];
function expandPath(pathTemplate) {
    // Expand ~ to home directory
    if (pathTemplate.startsWith('~/')) {
        return path.join(os.homedir(), pathTemplate.slice(2));
    }
    // Expand Windows environment variables
    if (process.platform === 'win32') {
        return pathTemplate.replace(/%([^%]+)%/g, (_, varName) => {
            return process.env[varName] || '';
        });
    }
    return pathTemplate;
}
export function detectInstalledIDEs() {
    const platform = process.platform;
    const detected = [];
    for (const ide of IDE_CONFIGS) {
        const pathTemplate = ide.configPaths[platform];
        if (!pathTemplate) {
            continue;
        }
        const configPath = expandPath(pathTemplate);
        // Check if config file or parent directory exists
        const exists = fs.existsSync(configPath);
        const parentExists = fs.existsSync(path.dirname(configPath));
        if (exists || parentExists) {
            detected.push({
                ...ide,
                detected: exists,
                configPath: exists ? configPath : undefined,
            });
        }
    }
    return detected;
}
export function readIDEConfig(ide) {
    if (!ide.configPath || !fs.existsSync(ide.configPath)) {
        return null;
    }
    try {
        const content = fs.readFileSync(ide.configPath, 'utf-8');
        if (ide.configFormat === 'json') {
            return JSON.parse(content);
        }
        // TODO: Add TOML/YAML parsers if needed
        return null;
    }
    catch (error) {
        console.error(`Failed to read ${ide.name} config:`, error);
        return null;
    }
}
export function writeIDEConfig(ide, config) {
    if (!ide.configPath) {
        return false;
    }
    try {
        // Ensure parent directory exists
        const dir = path.dirname(ide.configPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        if (ide.configFormat === 'json') {
            fs.writeFileSync(ide.configPath, JSON.stringify(config, null, 2), 'utf-8');
            return true;
        }
        return false;
    }
    catch (error) {
        console.error(`Failed to write ${ide.name} config:`, error);
        return false;
    }
}
export function addMCPServersToIDE(ide, servers) {
    const result = { added: 0, skipped: 0, errors: [] };
    // Read existing config
    let config = readIDEConfig(ide);
    if (!config) {
        config = {};
    }
    // Navigate to MCP servers key (support nested keys like "language_models.anthropic.mcpServers")
    const keys = ide.mcpKey.split('.');
    let current = config;
    for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
            current[keys[i]] = {};
        }
        current = current[keys[i]];
    }
    const mcpKey = keys[keys.length - 1];
    if (!current[mcpKey]) {
        current[mcpKey] = {};
    }
    const mcpServers = current[mcpKey];
    // Add each server
    for (const [name, serverConfig] of Object.entries(servers)) {
        if (mcpServers[name]) {
            result.skipped++;
        }
        else {
            mcpServers[name] = serverConfig;
            result.added++;
        }
    }
    // Write config back
    const success = writeIDEConfig(ide, config);
    if (!success) {
        result.errors.push(`Failed to write config for ${ide.displayName}`);
    }
    return result;
}
export function getMCPServerConfigs(mcpSuitePath) {
    const packages = ['core', 'accounting', 'hr', 'ai', 'legal'];
    const servers = {};
    for (const pkg of packages) {
        // Try bundled path first (NPM install: cli/mcp-servers/pkg/index.js)
        let distPath = path.join(mcpSuitePath, pkg, 'index.js');
        // Fall back to source path (development: mcp-suite/packages/pkg/dist/index.js)
        if (!fs.existsSync(distPath)) {
            distPath = path.join(mcpSuitePath, 'packages', pkg, 'dist', 'index.js');
        }
        servers[`startupos-${pkg}`] = {
            command: 'node',
            args: [distPath],
            env: {
                STARTUPOS_API_URL: process.env.STARTUPOS_API_URL || 'https://api.finlaw.cloud',
                STARTUPOS_API_KEY: process.env.STARTUPOS_API_KEY || '',
            },
        };
    }
    return servers;
}
export function getIDESkillPath(ide) {
    const platform = process.platform;
    // Only Claude Code supports skills
    if (ide.name === 'claude-code') {
        const skillPaths = {
            darwin: '~/.claude/skills/startupos',
            win32: '%USERPROFILE%\\.claude\\skills\\startupos',
            linux: '~/.claude/skills/startupos',
        };
        const pathTemplate = skillPaths[platform];
        return pathTemplate ? expandPath(pathTemplate) : null;
    }
    return null;
}
