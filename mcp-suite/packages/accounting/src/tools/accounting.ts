import type { SSOSClient } from '@ssos/mcp-shared';
import type {
  JournalEntry,
  Account,
  APIResponse,
  ListJournalEntriesInput,
  GetJournalEntryInput,
  CreateJournalEntryInput,
  CreateJournalLineItemInput,
  ListAccountsInput,
  GetAccountBalanceInput,
} from '@ssos/mcp-shared';

export function createAccountingTools(client: SSOSClient) {
  return {
    list_journal_entries: {
      description: 'List journal entries with optional filters',
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
          status: {
            type: 'string',
            enum: ['draft', 'posted', 'voided'],
            description: 'Filter by status',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of entries to return (default: 20)',
            default: 20,
          },
        },
      },
      handler: async (args: ListJournalEntriesInput) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.start_date) params.append('start_date', args.start_date);
        if (args.end_date) params.append('end_date', args.end_date);
        if (args.status) params.append('status', args.status);
        params.append('limit', String(args.limit || 20));

        const data: APIResponse<JournalEntry[]> = await client.apiFetch(
          `/api/journal-entries?${params.toString()}`
        );
        return { content: [{ type: 'text', text: JSON.stringify(data.data, null, 2) }] };
      },
    },

    get_journal_entry: {
      description: 'Get a specific journal entry by ID',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Journal entry ID',
          },
        },
        required: ['id'],
      },
      handler: async (args: GetJournalEntryInput) => {
        const data: APIResponse<JournalEntry> = await client.apiFetch(
          `/api/journal-entries/${args.id}`
        );
        return { content: [{ type: 'text', text: JSON.stringify(data.data, null, 2) }] };
      },
    },

    list_accounts: {
      description: 'List chart of accounts',
      inputSchema: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Filter by account category (asset, liability, equity, revenue, expense)',
          },
          search: {
            type: 'string',
            description: 'Search by account code or name',
          },
        },
      },
      handler: async (args: ListAccountsInput) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.category) params.append('category', args.category);
        if (args.search) params.append('search', args.search);

        const data: APIResponse<Account[]> = await client.apiFetch(
          `/api/accounts?${params.toString()}`
        );
        return { content: [{ type: 'text', text: JSON.stringify(data.data, null, 2) }] };
      },
    },

    get_account_balance: {
      description: 'Get account balance for a specific period',
      inputSchema: {
        type: 'object',
        properties: {
          account_code: {
            type: 'string',
            description: 'Account code',
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
        required: ['account_code'],
      },
      handler: async (args: GetAccountBalanceInput) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        params.append('account_code', args.account_code);
        if (args.start_date) params.append('start_date', args.start_date);
        if (args.end_date) params.append('end_date', args.end_date);

        const data: APIResponse = await client.apiFetch(
          `/api/accounts/balance?${params.toString()}`
        );
        return { content: [{ type: 'text', text: JSON.stringify(data.data, null, 2) }] };
      },
    },

    create_journal_entry: {
      description: 'Create a new journal entry',
      inputSchema: {
        type: 'object',
        properties: {
          entry_date: {
            type: 'string',
            description: 'Entry date in YYYY-MM-DD format',
          },
          description: {
            type: 'string',
            description: 'Entry description',
          },
          line_items: {
            type: 'array',
            description: 'Journal line items (must balance)',
            items: {
              type: 'object',
              properties: {
                account_code: { type: 'string' },
                debit_amount: { type: 'number' },
                credit_amount: { type: 'number' },
                description: { type: 'string' },
              },
              required: ['account_code'],
            },
          },
        },
        required: ['entry_date', 'description', 'line_items'],
      },
      handler: async (args: CreateJournalEntryInput) => {
        // Validate date format
        if (!args.entry_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({ error: 'Invalid date format. Expected YYYY-MM-DD' }, null, 2)
            }],
            isError: true,
          };
        }

        // Validate balance
        const totalDebit = args.line_items.reduce((sum: number, item: CreateJournalLineItemInput) => sum + (item.debit_amount || 0), 0);
        const totalCredit = args.line_items.reduce((sum: number, item: CreateJournalLineItemInput) => sum + (item.credit_amount || 0), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                error: `Journal entry not balanced: debit=${totalDebit}, credit=${totalCredit}`
              }, null, 2)
            }],
            isError: true,
          };
        }

        const data: APIResponse<JournalEntry> = await client.apiFetch(
          `/api/journal-entries`,
          {
            method: 'POST',
            body: JSON.stringify({
              workspace_id: client.getWorkspaceId(),
              entry_date: args.entry_date,
              description: args.description,
              line_items: args.line_items,
            }),
          }
        );
        return { content: [{ type: 'text', text: JSON.stringify(data.data, null, 2) }] };
      },
    },
  };
}
