import type { APIResponse, ApproveExpenseClaimInput, CreateDepartmentInput, CreateExpenseClaimInput, CreateProjectInput, ListDepartmentsInput, ListExpenseClaimsInput, ListProjectsInput, SSOSClient } from '@ssos/mcp-shared';

export function createExpenseTools(client: SSOSClient) {
  return {
    list_expense_claims: {
      description: 'List expense claims (报销单)',
      inputSchema: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['draft', 'submitted', 'approved', 'rejected', 'paid'],
            description: 'Filter by claim status',
          },
          employee_id: {
            type: 'string',
            description: 'Filter by employee ID',
          },
        },
      },
      handler: async (args: ListExpenseClaimsInput) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.status) params.append('status', args.status);
        if (args.employee_id) params.append('employee_id', args.employee_id);

        const data: APIResponse = await client.apiFetch(
          `/api/expense-claims?${params.toString()}`
        );
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    create_expense_claim: {
      description: 'Create an expense claim',
      inputSchema: {
        type: 'object',
        properties: {
          employee_id: {
            type: 'string',
            description: 'Employee ID',
          },
          claim_date: {
            type: 'string',
            description: 'Claim date (YYYY-MM-DD)',
          },
          description: {
            type: 'string',
            description: 'Expense description',
          },
          amount: {
            type: 'string',
            description: 'Total amount',
          },
          category: {
            type: 'string',
            description: 'Expense category',
          },
        },
        required: ['employee_id', 'claim_date', 'amount'],
      },
      handler: async (args: CreateExpenseClaimInput) => {
        const body: Record<string, unknown> = {
          workspace_id: client.getWorkspaceId(),
          employee_id: args.employee_id,
          claim_date: args.claim_date,
          amount: args.amount,
        };
        if (args.description) body.description = args.description;
        if (args.category) body.category = args.category;

        const data: APIResponse = await client.apiFetch('/api/expense-claims', {
          method: 'POST',
          body: JSON.stringify(body),
        });

        return {
          content: [{
            type: 'text',
            text: `✓ Expense claim created\n\n${JSON.stringify(data.data, null, 2)}`,
          }],
        };
      },
    },

    approve_expense_claim: {
      description: 'Approve an expense claim',
      inputSchema: {
        type: 'object',
        properties: {
          claim_id: {
            type: 'string',
            description: 'Expense claim ID',
          },
        },
        required: ['claim_id'],
      },
      handler: async (args: ApproveExpenseClaimInput) => {
        const data: APIResponse = await client.apiFetch(
          `/api/expense-claims/${args.claim_id}/approve`,
          { method: 'POST' }
        );

        return {
          content: [{
            type: 'text',
            text: `✓ Expense claim approved\n\n${JSON.stringify(data.data, null, 2)}`,
          }],
        };
      },
    },
  };
}

export function createOrganizationTools(client: SSOSClient) {
  return {
    list_departments: {
      description: 'List departments',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: async () => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());

        const data: APIResponse = await client.apiFetch(
          `/api/departments?${params.toString()}`
        );
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    create_department: {
      description: 'Create a new department',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Department name',
          },
          parent_id: {
            type: 'string',
            description: 'Parent department ID (optional)',
          },
          manager_id: {
            type: 'string',
            description: 'Department manager employee ID (optional)',
          },
        },
        required: ['name'],
      },
      handler: async (args: CreateDepartmentInput) => {
        const body: Record<string, unknown> = {
          workspace_id: client.getWorkspaceId(),
          name: args.name,
        };
        if (args.parent_id) body.parent_id = args.parent_id;
        if (args.manager_id) body.manager_id = args.manager_id;

        const data: APIResponse = await client.apiFetch('/api/departments', {
          method: 'POST',
          body: JSON.stringify(body),
        });

        return {
          content: [{
            type: 'text',
            text: `✓ Department created: ${data.data?.name}\n\n${JSON.stringify(data.data, null, 2)}`,
          }],
        };
      },
    },

    list_projects: {
      description: 'List projects',
      inputSchema: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['active', 'completed', 'cancelled'],
            description: 'Filter by project status',
          },
        },
      },
      handler: async (args: CreateDepartmentInput) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.status) params.append('status', args.status);

        const data: APIResponse = await client.apiFetch(
          `/api/projects?${params.toString()}`
        );
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    create_project: {
      description: 'Create a new project',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Project name',
          },
          code: {
            type: 'string',
            description: 'Project code',
          },
          start_date: {
            type: 'string',
            description: 'Project start date (YYYY-MM-DD)',
          },
          end_date: {
            type: 'string',
            description: 'Project end date (YYYY-MM-DD)',
          },
          budget: {
            type: 'string',
            description: 'Project budget',
          },
        },
        required: ['name'],
      },
      handler: async (args: CreateProjectInput) => {
        const body: Record<string, unknown> = {
          workspace_id: client.getWorkspaceId(),
          name: args.name,
        };
        if (args.code) body.code = args.code;
        if (args.start_date) body.start_date = args.start_date;
        if (args.end_date) body.end_date = args.end_date;
        if (args.budget) body.budget = args.budget;

        const data: APIResponse = await client.apiFetch('/api/projects', {
          method: 'POST',
          body: JSON.stringify(body),
        });

        return {
          content: [{
            type: 'text',
            text: `✓ Project created: ${data.data?.name}\n\n${JSON.stringify(data.data, null, 2)}`,
          }],
        };
      },
    },
  };
}
