#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { SSOSClient } from '@startupos/mcp-shared';
import { createContractTools } from './tools/contracts.js';
import { createContractReviewTools } from './tools/contract-review.js';
import { createDemandLetterTools } from './tools/demand-letters.js';
import { SSOS_LEGAL_INSTRUCTIONS } from './instructions.js';
const API_BASE_URL = process.env.SSOS_API_URL || 'https://api.finlaw.cloud';
const EMAIL = process.env.SSOS_EMAIL;
const PASSWORD = process.env.SSOS_PASSWORD;
const client = new SSOSClient({
    apiBaseUrl: API_BASE_URL,
    email: EMAIL,
    password: PASSWORD,
});
const server = new Server({
    name: 'ssos-legal',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
    instructions: SSOS_LEGAL_INSTRUCTIONS,
});
// Initialize client
await client.initialize();
// Register all tools
const tools = {
    ...createContractTools(client),
    ...createContractReviewTools(client),
    ...createDemandLetterTools(client),
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
console.error('SSOS Legal MCP server running on stdio');
