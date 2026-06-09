import type { APIResponse, CreateApiKeyInput, ListApiKeysInput, RevokeApiKeyInput, SSOSClient, ToggleApiKeyInput } from '@ssos/mcp-shared';

export function createApiKeyManagementTools(client: SSOSClient) {
  return {
    create_api_key: {
      description: 'Create a new API key',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name for the API key',
          },
          workspace_id: {
            type: 'string',
            description: 'Scope to specific workspace (optional)',
          },
          scopes: {
            type: 'array',
            items: { type: 'string' },
            description: 'Permission scopes (e.g., ["read:accounting", "write:accounting"])',
          },
          expires_at: {
            type: 'string',
            description: 'Expiration date in ISO format (optional)',
          },
        },
        required: ['name'],
      },
      handler: async (args: CreateApiKeyInput) => {
        const body: Record<string, unknown> = {
          name: args.name,
        };
        if (args.workspace_id) body.workspaceId = args.workspace_id;
        if (args.scopes) body.scopes = args.scopes;
        if (args.expires_at) body.expiresAt = args.expires_at;

        const data: APIResponse = await client.apiFetch('/api/api-keys', {
          method: 'POST',
          body: JSON.stringify(body),
        });

        return {
          content: [{
            type: 'text',
            text: `✓ API Key created!\n\n⚠️ IMPORTANT: Copy this key now, it will not be shown again!\n\nKey: ${data.data.key}\n\n${JSON.stringify({
              id: data.data.id,
              name: data.data.name,
              keyPrefix: data.data.keyPrefix,
              scopes: data.data.scopes,
              expiresAt: data.data.expiresAt,
            }, null, 2)}`
          }]
        };
      },
    },

    list_api_keys: {
      description: 'List all your API keys',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: async () => {
        const data: APIResponse = await client.apiFetch('/api/api-keys');
        return { content: [{ type: 'text', text: JSON.stringify(data.data, null, 2) }] };
      },
    },

    revoke_api_key: {
      description: 'Revoke (delete) an API key',
      inputSchema: {
        type: 'object',
        properties: {
          key_id: {
            type: 'string',
            description: 'API key ID to revoke',
          },
        },
        required: ['key_id'],
      },
      handler: async (args: ListApiKeysInput) => {
        const data: APIResponse = await client.apiFetch(`/api/api-keys/${args.key_id}`, {
          method: 'DELETE',
        });
        return {
          content: [{
            type: 'text',
            text: `✓ API Key revoked: ${data.data.name} (${data.data.keyPrefix}...)`
          }]
        };
      },
    },

    toggle_api_key: {
      description: 'Enable or disable an API key',
      inputSchema: {
        type: 'object',
        properties: {
          key_id: {
            type: 'string',
            description: 'API key ID',
          },
          is_active: {
            type: 'boolean',
            description: 'true to enable, false to disable',
          },
        },
        required: ['key_id', 'is_active'],
      },
      handler: async (args: RevokeApiKeyInput) => {
        const data: APIResponse = await client.apiFetch(`/api/api-keys/${args.key_id}/toggle`, {
          method: 'PATCH',
          body: JSON.stringify({ isActive: args.is_active }),
        });
        return {
          content: [{
            type: 'text',
            text: `✓ API Key ${args.is_active ? 'enabled' : 'disabled'}: ${data.data.name}`
          }]
        };
      },
    },
  };
}
