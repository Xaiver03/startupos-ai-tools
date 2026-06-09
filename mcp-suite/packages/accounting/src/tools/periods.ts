import type {
  SSOSClient,
  APIResponse,
  ListAccountingPeriodsInput,
  CreateAccountingPeriodInput,
  CloseAccountingPeriodInput,
  SetOpeningBalanceInput,
} from '@startupos/mcp-shared';

export function createAccountingPeriodTools(client: SSOSClient) {
  return {
    list_accounting_periods: {
      description: 'List accounting periods',
      inputSchema: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['open', 'closed'],
            description: 'Filter by period status',
          },
        },
      },
      handler: async (args: ListAccountingPeriodsInput) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.status) params.append('status', args.status);

        const data: APIResponse = await client.apiFetch(
          `/api/accounting-periods?${params.toString()}`
        );
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    create_accounting_period: {
      description: 'Create a new accounting period',
      inputSchema: {
        type: 'object',
        properties: {
          start_date: {
            type: 'string',
            description: 'Period start date (YYYY-MM-DD)',
          },
          end_date: {
            type: 'string',
            description: 'Period end date (YYYY-MM-DD)',
          },
          period_name: {
            type: 'string',
            description: 'Period name (e.g., "2024年1月")',
          },
        },
        required: ['start_date', 'end_date', 'period_name'],
      },
      handler: async (args: CreateAccountingPeriodInput) => {
        const body = {
          workspace_id: client.getWorkspaceId(),
          start_date: args.start_date,
          end_date: args.end_date,
          period_name: args.period_name,
        };

        const data: APIResponse = await client.apiFetch('/api/accounting-periods', {
          method: 'POST',
          body: JSON.stringify(body),
        });

        return {
          content: [{
            type: 'text',
            text: `✓ Accounting period created: ${data.data?.period_name}\n\n${JSON.stringify(data.data, null, 2)}`,
          }],
        };
      },
    },

    close_period: {
      description: 'Close an accounting period (period-end closing)',
      inputSchema: {
        type: 'object',
        properties: {
          period_id: {
            type: 'string',
            description: 'Period ID to close',
          },
        },
        required: ['period_id'],
      },
      handler: async (args: CloseAccountingPeriodInput) => {
        const body = {
          workspace_id: client.getWorkspaceId(),
          period_id: args.period_id,
        };

        const data: APIResponse = await client.apiFetch('/api/period-end/close', {
          method: 'POST',
          body: JSON.stringify(body),
        });

        return {
          content: [{
            type: 'text',
            text: `✓ Period closed successfully\n\n${JSON.stringify(data.data, null, 2)}`,
          }],
        };
      },
    },

    get_opening_balances: {
      description: 'Get opening balances for accounts',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: async () => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());

        const data: APIResponse = await client.apiFetch(
          `/api/opening-balances?${params.toString()}`
        );
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    set_opening_balance: {
      description: 'Set opening balance for an account',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: {
            type: 'string',
            description: 'Account ID',
          },
          debit_balance: {
            type: 'string',
            description: 'Opening debit balance',
          },
          credit_balance: {
            type: 'string',
            description: 'Opening credit balance',
          },
          period_start_date: {
            type: 'string',
            description: 'Period start date (YYYY-MM-DD)',
          },
        },
        required: ['account_id', 'period_start_date'],
      },
      handler: async (args: SetOpeningBalanceInput) => {
        const body: Record<string, unknown> = {
          workspace_id: client.getWorkspaceId(),
          account_id: args.account_id,
          period_start_date: args.period_start_date,
          debit_balance: args.debit_balance || '0',
          credit_balance: args.credit_balance || '0',
        };

        const data: APIResponse = await client.apiFetch('/api/opening-balances', {
          method: 'POST',
          body: JSON.stringify(body),
        });

        return {
          content: [{
            type: 'text',
            text: `✓ Opening balance set\n\n${JSON.stringify(data.data, null, 2)}`,
          }],
        };
      },
    },
  };
}
