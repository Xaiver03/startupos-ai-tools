import type { APIResponse, GenerateDemandLetterInput, GetLegalPathRecommendationInput, ListDemandLettersInput, SSOSClient, SaveDemandLetterInput } from '@ssos/mcp-shared';

export function createDemandLetterTools(client: SSOSClient) {
  return {
    list_demand_letters: {
      description: 'List demand letters (催款函)',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: async (args: ListDemandLettersInput) => {
        const response = await client.apiFetch<APIResponse>('/api/demand-letters');
        return {
          content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
        };
      },
    },

    generate_demand_letter: {
      description: 'Generate demand letter content from template',
      inputSchema: {
        type: 'object',
        properties: {
          debtor_name: {
            type: 'string',
            description: 'Debtor name (债务人)',
          },
          creditor_name: {
            type: 'string',
            description: 'Creditor name (债权人)',
          },
          amount: {
            type: 'number',
            description: 'Outstanding amount',
          },
          contract_number: {
            type: 'string',
            description: 'Related contract number',
          },
          due_date: {
            type: 'string',
            format: 'date',
            description: 'Payment due date',
          },
          payment_deadline: {
            type: 'string',
            format: 'date',
            description: 'Final payment deadline in the letter',
          },
        },
        required: ['debtor_name', 'creditor_name', 'amount'],
      },
      handler: async (args: GenerateDemandLetterInput) => {
        const response = await client.apiFetch<APIResponse>('/api/demand-letters/generate', {
          method: 'POST',
          body: JSON.stringify(args),
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
        };
      },
    },

    save_demand_letter: {
      description: 'Save demand letter record',
      inputSchema: {
        type: 'object',
        properties: {
          debtor_name: { type: 'string' },
          creditor_name: { type: 'string' },
          amount: { type: 'number' },
          contract_number: { type: 'string' },
          due_date: { type: 'string', format: 'date' },
          letter_content: { type: 'string', description: 'Generated letter content' },
        },
        required: ['debtor_name', 'creditor_name', 'amount', 'letter_content'],
      },
      handler: async (args: SaveDemandLetterInput) => {
        const response = await client.apiFetch<APIResponse>('/api/demand-letters', {
          method: 'POST',
          body: JSON.stringify(args),
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
        };
      },
    },

    get_legal_path_recommendation: {
      description: 'Get recommended legal action path based on amount (支付令/诉讼/仲裁)',
      inputSchema: {
        type: 'object',
        properties: {
          amount: {
            type: 'number',
            description: 'Debt amount',
          },
        },
        required: ['amount'],
      },
      handler: async (args: GetLegalPathRecommendationInput) => {
        const response = await client.apiFetch<APIResponse>(`/api/demand-letters/legal-path?amount=${args.amount}`);
        return {
          content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
        };
      },
    },
  };
}
