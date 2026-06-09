import type { SSOSClient, SwitchAccountInput, RemoveAccountInput } from '@ssos/mcp-shared';

export function createAuthTools(client: SSOSClient) {
  return {
    logout: {
      description: 'Logout from SSOS (remove current account)',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: async () => {
        await (client as any).authManager.logout();
        return {
          content: [{
            type: 'text',
            text: 'Successfully logged out. You will need to re-authenticate on next use.'
          }]
        };
      },
    },

    get_auth_info: {
      description: 'Get current authentication information',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: async () => {
        const auth = (client as any).authManager.getCurrentAuth();
        if (!auth) {
          return {
            content: [{
              type: 'text',
              text: 'Not authenticated'
            }]
          };
        }

        const info: any = {
          method: auth.method,
          email: auth.email,
          userId: auth.userId,
          savedAt: new Date(auth.savedAt).toISOString(),
          lastUsedAt: auth.lastUsedAt ? new Date(auth.lastUsedAt).toISOString() : 'N/A',
        };

        if (auth.method === 'api-key') {
          info.apiKeyPrefix = auth.apiKeyPrefix;
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(info, null, 2)
          }]
        };
      },
    },

    list_saved_accounts: {
      description: 'List all saved authentication accounts',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: async () => {
        const accounts = await (client as any).authManager.listAccounts();
        if (accounts.length === 0) {
          return {
            content: [{
              type: 'text',
              text: 'No saved accounts'
            }]
          };
        }

        const accountsInfo = accounts.map((a: any) => ({
          email: a.email,
          method: a.method,
          userId: a.userId,
          apiKeyPrefix: a.method === 'api-key' ? a.apiKeyPrefix : undefined,
          savedAt: new Date(a.savedAt).toISOString(),
        }));

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(accountsInfo, null, 2)
          }]
        };
      },
    },

    switch_account: {
      description: 'Switch to a different saved account',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: {
            type: 'string',
            description: 'User ID or API Key to switch to',
          },
        },
        required: ['account_id'],
      },
      handler: async (args: SwitchAccountInput) => {
        try {
          await (client as any).authManager.switchAccount(args.account_id);
          return {
            content: [{
              type: 'text',
              text: 'Successfully switched account'
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`
            }]
          };
        }
      },
    },

    remove_account: {
      description: 'Remove a saved account',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: {
            type: 'string',
            description: 'User ID or API Key to remove',
          },
        },
        required: ['account_id'],
      },
      handler: async (args: SwitchAccountInput) => {
        const accountManager = (client as any).authManager.accountManager;
        await accountManager.deleteAccount(args.account_id);
        return {
          content: [{
            type: 'text',
            text: 'Account removed successfully'
          }]
        };
      },
    },
  };
}
