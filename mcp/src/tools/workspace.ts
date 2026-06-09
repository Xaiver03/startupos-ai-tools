import type { SSOSClient } from '../client.js';
import type { Workspace, APIResponse } from '../types.js';

export function createWorkspaceTools(client: SSOSClient) {
  return {
    list_workspaces: {
      description: 'List all accessible workspaces',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: async () => {
        const data: APIResponse<Workspace[]> = await client.apiFetch('/api/workspaces');
        return { content: [{ type: 'text', text: JSON.stringify(data.data, null, 2) }] };
      },
    },

    get_current_workspace: {
      description: 'Get current workspace information',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: async () => {
        const workspace = client.getCurrentWorkspace();
        if (!workspace) {
          return { content: [{ type: 'text', text: 'No workspace selected' }] };
        }
        return { content: [{ type: 'text', text: JSON.stringify(workspace, null, 2) }] };
      },
    },

    switch_workspace: {
      description: 'Switch to a different workspace',
      inputSchema: {
        type: 'object',
        properties: {
          workspace_id: {
            type: 'string',
            description: 'Workspace ID to switch to',
          },
        },
        required: ['workspace_id'],
      },
      handler: async (args: any) => {
        const data: APIResponse<Workspace> = await client.apiFetch(
          `/api/workspaces/${args.workspace_id}`
        );
        client.setCurrentWorkspace(data.data!);
        return {
          content: [{
            type: 'text',
            text: `Switched to workspace: ${data.data!.name}`
          }]
        };
      },
    },

    get_workspace_settings: {
      description: 'Get workspace settings and configuration',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: async () => {
        const workspaceId = client.getWorkspaceId();
        const data: APIResponse = await client.apiFetch(
          `/api/workspaces/${workspaceId}/settings`
        );
        return { content: [{ type: 'text', text: JSON.stringify(data.data, null, 2) }] };
      },
    },
  };
}
