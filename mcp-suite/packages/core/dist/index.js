#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { SSOSClient } from '@startupos/mcp-shared';
import { createAuthTools } from './tools/auth.js';
import { createWorkspaceTools } from './tools/workspace.js';
import { createApiKeyManagementTools } from './tools/api-key-management.js';
import { createUniversalCrudTools } from './tools/universal-crud.js';
import { SSOS_CORE_INSTRUCTIONS } from './instructions.js';
const API_BASE_URL = process.env.SSOS_API_URL || 'https://api.finlaw.cloud';
const EMAIL = process.env.SSOS_EMAIL;
const PASSWORD = process.env.SSOS_PASSWORD;
const client = new SSOSClient({
    apiBaseUrl: API_BASE_URL,
    email: EMAIL,
    password: PASSWORD,
});
const server = new Server({
    name: 'ssos-core',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
    instructions: SSOS_CORE_INSTRUCTIONS,
});
// Initialize client
await client.initialize();
// Register all tools
const tools = {
    ...createUniversalCrudTools(client), // 7 tools covering 127 resources
    ...createAuthTools(client),
    ...createWorkspaceTools(client),
    ...createApiKeyManagementTools(client),
};
// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: Object.entries(tools).map(([name, tool]) => ({
            name,
            description: tool.description,
            inputSchema: tool.inputSchema,
        })),
    };
});
// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = tools[request.params.name];
    if (!tool) {
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
    return await tool.handler(request.params.arguments);
});
// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
console.error('SSOS Core MCP server running on stdio');
