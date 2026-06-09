import type { APIResponse, AskContractQuestionInput, GetContractReviewInput, ListContractReviewsInput, ReviewContractTextInput, SSOSClient } from '@startupos/mcp-shared';

export function createContractReviewTools(client: SSOSClient) {
  return {
    review_contract_text: {
      description: 'Submit contract text for AI review (returns review ID)',
      inputSchema: {
        type: 'object',
        properties: {
          contract_text: {
            type: 'string',
            description: 'Contract text content (10-50000 chars)',
          },
          perspective: {
            type: 'string',
            enum: ['party_a', 'party_b', 'neutral'],
            default: 'neutral',
            description: 'Review perspective',
          },
          custom_prompt: {
            type: 'string',
            description: 'Custom review instructions',
          },
        },
        required: ['contract_text'],
      },
      handler: async (args: ReviewContractTextInput) => {
        const response = await client.apiFetch<APIResponse>('/api/contract-reviews/text', {
          method: 'POST',
          body: JSON.stringify(args),
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
        };
      },
    },

    get_contract_review: {
      description: 'Get contract review result by ID',
      inputSchema: {
        type: 'object',
        properties: {
          review_id: {
            type: 'string',
            description: 'Contract review ID (UUID)',
          },
        },
        required: ['review_id'],
      },
      handler: async (args: GetContractReviewInput) => {
        const response = await client.apiFetch<APIResponse>(`/api/contract-reviews/${args.review_id}`);
        return {
          content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
        };
      },
    },

    list_contract_reviews: {
      description: 'List contract reviews',
      inputSchema: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['pending', 'completed', 'failed'],
            description: 'Filter by review status',
          },
        },
      },
      handler: async (args: ListContractReviewsInput) => {
        const params = new URLSearchParams();
        if (args.status) params.append('status', args.status);

        const response = await client.apiFetch<APIResponse>(`/api/contract-reviews?${params}`);
        return {
          content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
        };
      },
    },

    ask_contract_question: {
      description: 'Ask follow-up question about a contract review',
      inputSchema: {
        type: 'object',
        properties: {
          review_id: {
            type: 'string',
            description: 'Contract review ID (UUID)',
          },
          question: {
            type: 'string',
            description: 'Follow-up question about the contract',
          },
        },
        required: ['review_id', 'question'],
      },
      handler: async (args: AskContractQuestionInput) => {
        const { review_id, question } = args;
        const response = await client.apiFetch<APIResponse>(`/api/contract-reviews/${review_id}/ask`, {
          method: 'POST',
          body: JSON.stringify({ question }),
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
        };
      },
    },
  };
}
