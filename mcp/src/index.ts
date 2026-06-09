#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { SSOSClient } from './client.js';
import { createAccountingTools } from './tools/accounting.js';
import { createWorkspaceTools } from './tools/workspace.js';
import { createAuthTools } from './tools/auth.js';
import { createTaxTools } from './tools/tax.js';
import { createReportTools } from './tools/reports.js';
import { createApiKeyManagementTools } from './tools/api-key-management.js';
import { createPayrollTools } from './tools/payroll.js';
import { createFileTools } from './tools/files.js';

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
    name: 'ssos-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Initialize client
await client.initialize();

// Register all tools
const tools = {
  ...createAccountingTools(client),
  ...createWorkspaceTools(client),
  ...createAuthTools(client),
  ...createTaxTools(client),
  ...createReportTools(client),
  ...createApiKeyManagementTools(client),
  ...createPayrollTools(client),
  ...createFileTools(client),
};

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: Object.entries(tools).map(([name, tool]) => ({
      name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  const tool = tools[toolName as keyof typeof tools];

  if (!tool) {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  try {
    return await tool.handler(request.params.arguments || {});
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);

console.error('SSOS MCP Server running on stdio');
