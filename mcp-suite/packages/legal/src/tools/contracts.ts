import type { APIResponse, CreateContractInput, GenerateContractInput, GetContractInput, ListContractsInput, SSOSClient, UpdateContractInput } from '@startupos/mcp-shared';

export function createContractTools(client: SSOSClient) {
  return {
    list_contracts: {
      description: 'List contracts',
      inputSchema: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['active', 'expired', 'terminated', 'draft'],
            description: 'Filter by contract status',
          },
          contract_type: {
            type: 'string',
            enum: ['purchase', 'sales', 'service', 'rental', 'labor', 'loan', 'nda', 'equity', 'consultant', 'other'],
            description: 'Filter by contract type',
          },
        },
      },
      handler: async (args: ListContractsInput) => {
        const params = new URLSearchParams();
        if (args.status) params.append('status', args.status);
        if (args.contract_type) params.append('contract_type', args.contract_type);

        const response = await client.apiFetch<APIResponse>(`/api/contracts?${params}`);
        return {
          content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
        };
      },
    },

    get_contract: {
      description: 'Get contract details by ID',
      inputSchema: {
        type: 'object',
        properties: {
          contract_id: {
            type: 'string',
            description: 'Contract ID (UUID)',
          },
        },
        required: ['contract_id'],
      },
      handler: async (args: GetContractInput) => {
        const response = await client.apiFetch<APIResponse>(`/api/contracts/${args.contract_id}`);
        return {
          content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
        };
      },
    },

    create_contract: {
      description: 'Create a new contract',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Contract title' },
          contract_type: {
            type: 'string',
            enum: ['purchase', 'sales', 'service', 'rental', 'labor', 'loan', 'nda', 'equity', 'consultant', 'other'],
          },
          party_a: { type: 'string', description: 'Party A name' },
          party_b: { type: 'string', description: 'Party B name' },
          amount: { type: 'number', description: 'Contract amount' },
          currency: { type: 'string', default: 'CNY' },
          signed_date: { type: 'string', format: 'date' },
          effective_date: { type: 'string', format: 'date' },
          expiry_date: { type: 'string', format: 'date' },
          status: {
            type: 'string',
            enum: ['active', 'expired', 'terminated', 'draft'],
            default: 'active',
          },
        },
        required: ['title', 'party_a', 'party_b'],
      },
      handler: async (args: CreateContractInput) => {
        const response = await client.apiFetch<APIResponse>('/api/contracts', {
          method: 'POST',
          body: JSON.stringify(args),
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
        };
      },
    },

    generate_contract: {
      description: 'Generate contract document from template',
      inputSchema: {
        type: 'object',
        properties: {
          template_type: {
            type: 'string',
            enum: ['labor', 'nda', 'consultant', 'service'],
            description: 'Contract template type',
          },
          params: {
            type: 'object',
            description: 'Template parameters (party names, dates, amounts, etc.)',
          },
        },
        required: ['template_type', 'params'],
      },
      handler: async (args: GenerateContractInput) => {
        const response = await client.apiFetch<APIResponse>('/api/contracts/generate', {
          method: 'POST',
          body: JSON.stringify(args),
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
        };
      },
    },

    update_contract: {
      description: 'Update contract information',
      inputSchema: {
        type: 'object',
        properties: {
          contract_id: { type: 'string', description: 'Contract ID (UUID)' },
          title: { type: 'string' },
          status: {
            type: 'string',
            enum: ['active', 'expired', 'terminated', 'draft'],
          },
          expiry_date: { type: 'string', format: 'date' },
        },
        required: ['contract_id'],
      },
      handler: async (args: UpdateContractInput) => {
        const { contract_id, ...updateData } = args;
        const response = await client.apiFetch<APIResponse>(`/api/contracts/${contract_id}`, {
          method: 'PATCH',
          body: JSON.stringify(updateData),
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
        };
      },
    },
  };
}
