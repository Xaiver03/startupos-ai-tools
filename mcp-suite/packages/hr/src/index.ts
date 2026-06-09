#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { SSOSClient } from '@ssos/mcp-shared';
import { createEmployeeTools } from './tools/employees.js';
import { createPayrollTools } from './tools/payroll.js';
import { createLaborContractTools } from './tools/labor-contracts.js';
import { SSOS_HR_INSTRUCTIONS } from './instructions.js';

const API_BASE_URL = process.env.SSOS_API_URL || 'https://api.finlaw.cloud';
const EMAIL = process.env.SSOS_EMAIL;
const PASSWORD = process.env.SSOS_PASSWORD;

const client = new SSOSClient({
  apiBaseUrl: API_BASE_URL,
  email: EMAIL,
  password: PASSWORD,
});

const server = new Server(
  {
    name: 'ssos-hr',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
    instructions: SSOS_HR_INSTRUCTIONS,
  }
);

// Initialize client
await client.initialize();

// Register all tools
const tools = {
  ...createEmployeeTools(client),
  ...createPayrollTools(client),
  ...createLaborContractTools(client),
};

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: Object.entries(tools).map(([name, tool]) => ({
      name,
      description: (tool as any).description,
      inputSchema: (tool as any).inputSchema,
    })),
  };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = tools[request.params.name as keyof typeof tools];
  if (!tool) {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }
  return await (tool as any).handler(request.params.arguments);
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);

console.error('SSOS HR MCP server running on stdio');
