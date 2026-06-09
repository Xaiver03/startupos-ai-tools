import type {
  SSOSClient,
  APIResponse,
  CreateBankAccountInput,
  ListBankTransactionsInput,
  ImportBankTransactionsInput,
  ListReconciliationRecordsInput,
} from '@startupos/mcp-shared';

export function createBankTools(client: SSOSClient) {
  return {
    list_bank_accounts: {
      description: 'List all bank accounts',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: async () => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());

        const data: APIResponse = await client.apiFetch(
          `/api/bank-accounts?${params.toString()}`
        );
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    create_bank_account: {
      description: 'Create a new bank account',
      inputSchema: {
        type: 'object',
        properties: {
          account_name: {
            type: 'string',
            description: 'Bank account name',
          },
          bank_name: {
            type: 'string',
            description: 'Bank name',
          },
          account_number: {
            type: 'string',
            description: 'Bank account number',
          },
          currency: {
            type: 'string',
            description: 'Currency (default: CNY)',
            default: 'CNY',
          },
          opening_balance: {
            type: 'string',
            description: 'Opening balance',
          },
        },
        required: ['account_name', 'bank_name', 'account_number'],
      },
      handler: async (args: CreateBankAccountInput) => {
        const body: Record<string, unknown> = {
          workspace_id: client.getWorkspaceId(),
          account_name: args.account_name,
          bank_name: args.bank_name,
          account_number: args.account_number,
          currency: args.currency || 'CNY',
        };
        if (args.opening_balance) body.opening_balance = args.opening_balance;

        const data: APIResponse = await client.apiFetch('/api/bank-accounts', {
          method: 'POST',
          body: JSON.stringify(body),
        });

        return {
          content: [{
            type: 'text',
            text: `✓ Bank account created: ${data.data?.account_name}\n\n${JSON.stringify(data.data, null, 2)}`,
          }],
        };
      },
    },

    list_bank_transactions: {
      description: 'List bank transactions',
      inputSchema: {
        type: 'object',
        properties: {
          bank_account_id: {
            type: 'string',
            description: 'Filter by bank account ID',
          },
          start_date: {
            type: 'string',
            description: 'Start date (YYYY-MM-DD)',
          },
          end_date: {
            type: 'string',
            description: 'End date (YYYY-MM-DD)',
          },
          limit: {
            type: 'number',
            description: 'Maximum number to return (default: 50)',
            default: 50,
          },
        },
      },
      handler: async (args: ListBankTransactionsInput) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.bank_account_id) params.append('bank_account_id', args.bank_account_id);
        if (args.start_date) params.append('start_date', args.start_date);
        if (args.end_date) params.append('end_date', args.end_date);
        params.append('limit', String(args.limit || 50));

        const data: APIResponse = await client.apiFetch(
          `/api/bank-transactions?${params.toString()}`
        );
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    import_bank_transactions: {
      description: 'Import bank transactions from bank statement',
      inputSchema: {
        type: 'object',
        properties: {
          bank_account_id: {
            type: 'string',
            description: 'Bank account ID',
          },
          transactions: {
            type: 'array',
            description: 'Array of transaction records',
            items: {
              type: 'object',
              properties: {
                transaction_date: { type: 'string' },
                description: { type: 'string' },
                amount: { type: 'string' },
                balance: { type: 'string' },
                counterparty: { type: 'string' },
              },
            },
          },
        },
        required: ['bank_account_id', 'transactions'],
      },
      handler: async (args: ImportBankTransactionsInput) => {
        const body = {
          workspace_id: client.getWorkspaceId(),
          bank_account_id: args.bank_account_id,
          transactions: args.transactions,
        };

        const data: APIResponse = await client.apiFetch('/api/bank-transactions/import', {
          method: 'POST',
          body: JSON.stringify(body),
        });

        return {
          content: [{
            type: 'text',
            text: `✓ Imported ${data.data?.imported_count || 0} transactions\n\n${JSON.stringify(data.data, null, 2)}`,
          }],
        };
      },
    },

    list_reconciliation_records: {
      description: 'List bank reconciliation records',
      inputSchema: {
        type: 'object',
        properties: {
          bank_account_id: {
            type: 'string',
            description: 'Filter by bank account ID',
          },
          status: {
            type: 'string',
            enum: ['pending', 'reconciled'],
            description: 'Filter by reconciliation status',
          },
        },
      },
      handler: async (args: ListReconciliationRecordsInput) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.bank_account_id) params.append('bank_account_id', args.bank_account_id);
        if (args.status) params.append('status', args.status);

        const data: APIResponse = await client.apiFetch(
          `/api/reconciliation-records?${params.toString()}`
        );
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },
  };
}
