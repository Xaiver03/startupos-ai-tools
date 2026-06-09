export function createAIBookkeepingTools(client) {
    return {
        ai_bookkeeping: {
            description: 'AI automatic bookkeeping - generate journal entry from text or OCR data',
            inputSchema: {
                type: 'object',
                properties: {
                    text: {
                        type: 'string',
                        description: 'Transaction description text (e.g., "收到客户A货款10000元")',
                    },
                    ocr_data: {
                        type: 'object',
                        description: 'OCR extracted data from invoice/receipt',
                    },
                    input_mode: {
                        type: 'string',
                        enum: ['text', 'document', 'text_with_document'],
                        description: 'Input mode (default: text)',
                    },
                    conversation_id: {
                        type: 'string',
                        description: 'Conversation ID for multi-turn dialogue',
                    },
                },
            },
            handler: async (args) => {
                const body = {
                    workspace_id: client.getWorkspaceId(),
                };
                if (args.text)
                    body.text = args.text;
                if (args.ocr_data)
                    body.ocr_data = args.ocr_data;
                if (args.input_mode)
                    body.input_mode = args.input_mode;
                if (args.conversation_id)
                    body.conversation_id = args.conversation_id;
                const data = await client.apiFetch('/api/ai/bookkeeping', {
                    method: 'POST',
                    body: JSON.stringify(body),
                });
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        }],
                };
            },
        },
        list_ai_conversations: {
            description: 'List AI bookkeeping conversation history',
            inputSchema: {
                type: 'object',
                properties: {
                    type: {
                        type: 'string',
                        enum: ['bookkeeping', 'invoice_detection'],
                        description: 'Conversation type',
                    },
                    limit: {
                        type: 'number',
                        description: 'Maximum number to return (default: 20)',
                        default: 20,
                    },
                },
            },
            handler: async (args) => {
                const params = new URLSearchParams();
                params.append('workspace_id', client.getWorkspaceId());
                if (args.type)
                    params.append('type', args.type);
                params.append('limit', String(args.limit || 20));
                const data = await client.apiFetch(`/api/ai/conversations?${params.toString()}`);
                return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
            },
        },
        ocr_invoice: {
            description: 'OCR recognition for invoice or bank statement',
            inputSchema: {
                type: 'object',
                properties: {
                    file_url: {
                        type: 'string',
                        description: 'File URL (already uploaded to SSOS)',
                    },
                    image_url: {
                        type: 'string',
                        description: 'External image URL',
                    },
                    document_type: {
                        type: 'string',
                        enum: ['invoice', 'bank_statement'],
                        description: 'Document type',
                    },
                },
                required: ['document_type'],
            },
            handler: async (args) => {
                const body = {
                    workspace_id: client.getWorkspaceId(),
                    document_type: args.document_type,
                };
                if (args.file_url)
                    body.file_url = args.file_url;
                if (args.image_url)
                    body.image_url = args.image_url;
                const data = await client.apiFetch('/api/ocr', {
                    method: 'POST',
                    body: JSON.stringify(body),
                });
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        }],
                };
            },
        },
        ask_compliance_question: {
            description: 'Ask compliance or accounting regulation questions',
            inputSchema: {
                type: 'object',
                properties: {
                    question: {
                        type: 'string',
                        description: 'Compliance question',
                    },
                },
                required: ['question'],
            },
            handler: async (args) => {
                const body = {
                    workspace_id: client.getWorkspaceId(),
                    question: args.question,
                };
                const data = await client.apiFetch('/api/compliance-qa', {
                    method: 'POST',
                    body: JSON.stringify(body),
                });
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        }],
                };
            },
        },
    };
}
