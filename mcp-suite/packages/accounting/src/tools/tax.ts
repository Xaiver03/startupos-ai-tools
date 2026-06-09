import type { SSOSClient, APIResponse, GetTaxCalendarTasksInput, GetTaxCalculationsInput, GetTaxFilingFormsInput } from '@startupos/mcp-shared';

export function createTaxTools(client: SSOSClient) {
  return {
    get_tax_calendar_tasks: {
      description: 'Get tax calendar tasks with deadlines',
      inputSchema: {
        type: 'object',
        properties: {
          from: {
            type: 'string',
            description: 'Start date in YYYY-MM-DD format (optional)',
          },
          to: {
            type: 'string',
            description: 'End date in YYYY-MM-DD format (optional)',
          },
          status: {
            type: 'string',
            enum: ['pending', 'done', 'skipped'],
            description: 'Filter by status (optional)',
          },
        },
      },
      handler: async (args: GetTaxCalendarTasksInput) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.from) params.append('from', args.from);
        if (args.to) params.append('to', args.to);
        if (args.status) params.append('status', args.status);

        const data: APIResponse = await client.apiFetch(
          `/api/tax-calendar/tasks?${params.toString()}`
        );
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    get_tax_calendar_rules: {
      description: 'Get available tax calendar rules',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: async () => {
        const data: APIResponse = await client.apiFetch('/api/tax-calendar/rules');
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    get_tax_calculations: {
      description: 'List historical tax calculations',
      inputSchema: {
        type: 'object',
        properties: {
          tax_type: {
            type: 'string',
            description: 'Filter by tax type',
          },
          limit: {
            type: 'number',
            description: 'Maximum number to return (default: 20)',
            default: 20,
          },
        },
      },
      handler: async (args: GetTaxCalculationsInput) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.tax_type) params.append('tax_type', args.tax_type);
        params.append('limit', String(args.limit || 20));

        const data: APIResponse = await client.apiFetch(
          `/api/tax-calculations?${params.toString()}`
        );
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    get_tax_filing_forms: {
      description: 'Get tax filing forms (declarations)',
      inputSchema: {
        type: 'object',
        properties: {
          form_type: {
            type: 'string',
            description: 'Form type (e.g., vat_return, cit_return)',
          },
          status: {
            type: 'string',
            enum: ['draft', 'submitted', 'approved'],
            description: 'Filter by status',
          },
        },
      },
      handler: async (args: GetTaxFilingFormsInput) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.form_type) params.append('form_type', args.form_type);
        if (args.status) params.append('status', args.status);

        const data: APIResponse = await client.apiFetch(
          `/api/tax-filing-forms?${params.toString()}`
        );
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },
  };
}
