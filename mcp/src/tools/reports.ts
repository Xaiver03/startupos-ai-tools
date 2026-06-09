import type { SSOSClient } from '../client.js';
import type { APIResponse } from '../types.js';

export function createReportTools(client: SSOSClient) {
  return {
    generate_trial_balance: {
      description: 'Generate trial balance (试算平衡表)',
      inputSchema: {
        type: 'object',
        properties: {
          period_id: {
            type: 'string',
            description: 'Accounting period ID (optional)',
          },
        },
      },
      handler: async (args: any) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.period_id) params.append('period_id', args.period_id);

        const data: APIResponse = await client.apiFetch(
          `/api/reports/trial-balance?${params.toString()}`
        );
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    generate_income_statement: {
      description: 'Generate income statement (利润表)',
      inputSchema: {
        type: 'object',
        properties: {
          start_date: {
            type: 'string',
            description: 'Start date in YYYY-MM-DD format',
          },
          end_date: {
            type: 'string',
            description: 'End date in YYYY-MM-DD format',
          },
        },
        required: ['start_date', 'end_date'],
      },
      handler: async (args: any) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        params.append('start_date', args.start_date);
        params.append('end_date', args.end_date);

        const data: APIResponse = await client.apiFetch(
          `/api/reports/income-statement?${params.toString()}`
        );
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    generate_cash_journal: {
      description: 'Generate cash journal (现金日记账)',
      inputSchema: {
        type: 'object',
        properties: {
          start_date: {
            type: 'string',
            description: 'Start date in YYYY-MM-DD format',
          },
          end_date: {
            type: 'string',
            description: 'End date in YYYY-MM-DD format',
          },
        },
      },
      handler: async (args: any) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.start_date) params.append('start_date', args.start_date);
        if (args.end_date) params.append('end_date', args.end_date);

        const data: APIResponse = await client.apiFetch(
          `/api/reports/cash-journal?${params.toString()}`
        );
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    generate_bank_journal: {
      description: 'Generate bank journal (银行日记账)',
      inputSchema: {
        type: 'object',
        properties: {
          start_date: {
            type: 'string',
            description: 'Start date in YYYY-MM-DD format',
          },
          end_date: {
            type: 'string',
            description: 'End date in YYYY-MM-DD format',
          },
          account_code: {
            type: 'string',
            description: 'Bank account code (optional)',
          },
        },
      },
      handler: async (args: any) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.start_date) params.append('start_date', args.start_date);
        if (args.end_date) params.append('end_date', args.end_date);
        if (args.account_code) params.append('account_code', args.account_code);

        const data: APIResponse = await client.apiFetch(
          `/api/reports/bank-journal?${params.toString()}`
        );
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    get_general_ledger: {
      description: 'Get general ledger (总账)',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: {
            type: 'string',
            description: 'Account ID (optional)',
          },
          start_date: {
            type: 'string',
            description: 'Start date in YYYY-MM-DD format',
          },
          end_date: {
            type: 'string',
            description: 'End date in YYYY-MM-DD format',
          },
        },
      },
      handler: async (args: any) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.account_id) params.append('account_id', args.account_id);
        if (args.start_date) params.append('start_date', args.start_date);
        if (args.end_date) params.append('end_date', args.end_date);

        const data: APIResponse = await client.apiFetch(
          `/api/reports/general-ledger?${params.toString()}`
        );
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    get_account_balances: {
      description: 'Get account balances summary (科目余额表)',
      inputSchema: {
        type: 'object',
        properties: {
          period_id: {
            type: 'string',
            description: 'Accounting period ID (optional)',
          },
        },
      },
      handler: async (args: any) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.period_id) params.append('period_id', args.period_id);

        const data: APIResponse = await client.apiFetch(
          `/api/reports/account-balances?${params.toString()}`
        );
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },
  };
}
