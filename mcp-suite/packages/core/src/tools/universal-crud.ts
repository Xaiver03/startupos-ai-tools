import type { SSOSClient } from '@ssos/mcp-shared';
import { RESOURCES, getResource, assertCrud } from '@ssos/mcp-shared';

/**
 * Universal CRUD tools for all resources
 * 6 tools that replace 200+ specialized tools
 */
export function createUniversalCrudTools(client: SSOSClient) {
  return {
    /**
     * List resources with optional filters
     * Replaces 127+ individual list tools
     *
     * Examples:
     *   resource_list('accounts', { limit: 10 })
     *   resource_list('journal-entries', { status: 'posted', start_date: '2026-01-01' })
     *   resource_list('employees', { department: 'tech' })
     */
    resource_list: {
      description: 'List resources of any type with optional filters. Supports 127 resource types including accounts, journal-entries, employees, contracts, invoices, etc.',
      inputSchema: {
        type: 'object',
        properties: {
          resource: {
            type: 'string',
            description: 'Resource type (e.g., "accounts", "journal-entries", "employees"). Use resource_list_types to see all available types.',
          },
          filters: {
            type: 'object',
            description: 'Optional filters (workspace_id, start_date, end_date, status, limit, offset, etc.)',
            additionalProperties: true,
          },
        },
        required: ['resource'],
      },
      handler: async (args: { resource: string; filters?: Record<string, any> }) => {
        const cfg = getResource(args.resource);
        assertCrud(cfg, args.resource, 'list');

        const params = new URLSearchParams();

        // Add workspace_id if not optional
        if (!cfg.workspaceOptional) {
          params.append('workspace_id', client.getWorkspaceId());
        }

        // Add filters
        if (args.filters) {
          for (const [key, value] of Object.entries(args.filters)) {
            if (value !== undefined && value !== null) {
              params.append(key, String(value));
            }
          }
        }

        const url = `${cfg.apiPath}?${params.toString()}`;
        const data = await client.apiFetch(url);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(data, null, 2)
          }]
        };
      },
    },

    /**
     * Get a single resource by ID
     * Replaces 127+ individual get tools
     *
     * Examples:
     *   resource_get('accounts', '123')
     *   resource_get('journal-entries', 'abc-def')
     *   resource_get('employees', 'emp-001')
     */
    resource_get: {
      description: 'Get a single resource by ID. Supports all resource types.',
      inputSchema: {
        type: 'object',
        properties: {
          resource: {
            type: 'string',
            description: 'Resource type (e.g., "accounts", "journal-entries")',
          },
          id: {
            type: 'string',
            description: 'Resource ID',
          },
        },
        required: ['resource', 'id'],
      },
      handler: async (args: { resource: string; id: string }) => {
        const cfg = getResource(args.resource);
        assertCrud(cfg, args.resource, 'get');

        const url = `${cfg.apiPath}/${args.id}`;
        const data = await client.apiFetch(url);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(data, null, 2)
          }]
        };
      },
    },

    /**
     * Create a new resource
     * Replaces 127+ individual create tools
     *
     * Examples:
     *   resource_create('accounts', { code: '1001', name: '库存现金', category: 'asset' })
     *   resource_create('employees', { name: '张三', department: 'tech', hire_date: '2026-01-01' })
     */
    resource_create: {
      description: 'Create a new resource. Supports all resource types.',
      inputSchema: {
        type: 'object',
        properties: {
          resource: {
            type: 'string',
            description: 'Resource type',
          },
          data: {
            type: 'object',
            description: 'Resource data to create',
            additionalProperties: true,
          },
        },
        required: ['resource', 'data'],
      },
      handler: async (args: { resource: string; data: Record<string, any> }) => {
        const cfg = getResource(args.resource);
        assertCrud(cfg, args.resource, 'create');

        const url = cfg.apiPath;
        const data = await client.apiFetch(url, {
          method: 'POST',
          body: JSON.stringify(args.data),
        });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(data, null, 2)
          }]
        };
      },
    },

    /**
     * Update an existing resource
     * Replaces 127+ individual update tools
     *
     * Examples:
     *   resource_update('accounts', '123', { name: '银行存款-工行' })
     *   resource_update('employees', 'emp-001', { department: '销售部' })
     */
    resource_update: {
      description: 'Update an existing resource. Supports all resource types.',
      inputSchema: {
        type: 'object',
        properties: {
          resource: {
            type: 'string',
            description: 'Resource type',
          },
          id: {
            type: 'string',
            description: 'Resource ID',
          },
          data: {
            type: 'object',
            description: 'Fields to update',
            additionalProperties: true,
          },
        },
        required: ['resource', 'id', 'data'],
      },
      handler: async (args: { resource: string; id: string; data: Record<string, any> }) => {
        const cfg = getResource(args.resource);
        assertCrud(cfg, args.resource, 'update');

        const method = cfg.method || 'PATCH';
        const url = `${cfg.apiPath}/${args.id}`;
        const data = await client.apiFetch(url, {
          method,
          body: JSON.stringify(args.data),
        });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(data, null, 2)
          }]
        };
      },
    },

    /**
     * Delete a resource
     * Replaces 127+ individual delete tools
     *
     * Examples:
     *   resource_delete('accounts', '123')
     *   resource_delete('employees', 'emp-001')
     */
    resource_delete: {
      description: 'Delete a resource. Supports all resource types.',
      inputSchema: {
        type: 'object',
        properties: {
          resource: {
            type: 'string',
            description: 'Resource type',
          },
          id: {
            type: 'string',
            description: 'Resource ID to delete',
          },
        },
        required: ['resource', 'id'],
      },
      handler: async (args: { resource: string; id: string }) => {
        const cfg = getResource(args.resource);
        assertCrud(cfg, args.resource, 'delete');

        const url = `${cfg.apiPath}/${args.id}`;
        const data = await client.apiFetch(url, {
          method: 'DELETE',
        });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(data, null, 2)
          }]
        };
      },
    },

    /**
     * Execute a resource action
     * Replaces all action commands (e.g., post, approve, reject, reverse)
     *
     * Examples:
     *   resource_action('journal-entries', '123', 'post')
     *   resource_action('journal-entries', '123', 'reverse', { date: '2026-06-08' })
     *   resource_action('annual-bonus', '456', 'post')
     *   resource_action('expense-claims', '789', 'approve')
     */
    resource_action: {
      description: 'Execute an action on a resource (e.g., post, approve, reverse). Each resource type has specific actions available.',
      inputSchema: {
        type: 'object',
        properties: {
          resource: {
            type: 'string',
            description: 'Resource type',
          },
          id: {
            type: 'string',
            description: 'Resource ID (optional for some actions)',
          },
          action: {
            type: 'string',
            description: 'Action name (e.g., "post", "approve", "reverse"). See resource config for available actions.',
          },
          data: {
            type: 'object',
            description: 'Optional action parameters',
            additionalProperties: true,
          },
        },
        required: ['resource', 'action'],
      },
      handler: async (args: { resource: string; id?: string; action: string; data?: Record<string, any> }) => {
        const cfg = getResource(args.resource);

        let url = cfg.apiPath;
        if (args.id) {
          url += `/${args.id}`;
        }
        url += `/${args.action}`;

        const data = await client.apiFetch(url, {
          method: 'POST',
          body: args.data ? JSON.stringify(args.data) : undefined,
        });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(data, null, 2)
          }]
        };
      },
    },

    /**
     * List all available resource types
     * Helper tool to discover what resources are available
     */
    resource_list_types: {
      description: 'List all available resource types (127 types). Returns CRUD resources and action-only resources separately.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: async () => {
        const crudResources = Object.entries(RESOURCES)
          .filter(([_, cfg]) => !cfg.noCrud)
          .map(([name, cfg]) => ({
            name,
            label: cfg.label,
            apiPath: cfg.apiPath,
            actions: cfg.actions || [],
          }));

        const actionOnlyResources = Object.entries(RESOURCES)
          .filter(([_, cfg]) => cfg.noCrud === true)
          .map(([name, cfg]) => ({
            name,
            label: cfg.label,
            apiPath: cfg.apiPath,
            actions: cfg.actions || [],
          }));

        const summary = {
          total: Object.keys(RESOURCES).length,
          crud_resources: crudResources.length,
          action_only_resources: actionOnlyResources.length,
          crud_resources_list: crudResources,
          action_only_resources_list: actionOnlyResources,
        };

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(summary, null, 2)
          }]
        };
      },
    },
  };
}
