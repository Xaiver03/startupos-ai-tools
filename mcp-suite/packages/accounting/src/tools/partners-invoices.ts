import type { APIResponse, CreatePartnerInput, CreateVatInvoiceInput, ListPartnersInput, ListVatInvoicesInput, SSOSClient, UpdatePartnerInput } from '@ssos/mcp-shared';

export function createInvoiceTools(client: SSOSClient) {
  return {
    list_vat_invoices: {
      description: 'List VAT invoices (business invoices for accounting)',
      inputSchema: {
        type: 'object',
        properties: {
          invoice_type: {
            type: 'string',
            enum: ['input', 'output'],
            description: 'Invoice type (input = purchase, output = sales)',
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
      handler: async (args: ListVatInvoicesInput) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.invoice_type) params.append('invoice_type', args.invoice_type);
        if (args.start_date) params.append('start_date', args.start_date);
        if (args.end_date) params.append('end_date', args.end_date);
        params.append('limit', String(args.limit || 50));

        const data: APIResponse = await client.apiFetch(
          `/api/business-vat-invoices?${params.toString()}`
        );
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    create_vat_invoice: {
      description: 'Create a VAT invoice record',
      inputSchema: {
        type: 'object',
        properties: {
          invoice_type: {
            type: 'string',
            enum: ['input', 'output'],
            description: 'Invoice type',
          },
          invoice_number: {
            type: 'string',
            description: 'Invoice number',
          },
          invoice_date: {
            type: 'string',
            description: 'Invoice date (YYYY-MM-DD)',
          },
          seller_name: {
            type: 'string',
            description: 'Seller/supplier name',
          },
          buyer_name: {
            type: 'string',
            description: 'Buyer/customer name',
          },
          amount: {
            type: 'string',
            description: 'Amount (excluding tax)',
          },
          tax_amount: {
            type: 'string',
            description: 'Tax amount',
          },
          total_amount: {
            type: 'string',
            description: 'Total amount (including tax)',
          },
          tax_rate: {
            type: 'number',
            description: 'Tax rate (e.g., 13, 6, 3)',
          },
        },
        required: ['invoice_type', 'invoice_number', 'invoice_date', 'total_amount'],
      },
      handler: async (args: CreateVatInvoiceInput) => {
        const body: Record<string, unknown> = {
          workspace_id: client.getWorkspaceId(),
          invoice_type: args.invoice_type,
          invoice_number: args.invoice_number,
          invoice_date: args.invoice_date,
          total_amount: args.total_amount,
        };
        if (args.seller_name) body.seller_name = args.seller_name;
        if (args.buyer_name) body.buyer_name = args.buyer_name;
        if (args.amount) body.amount = args.amount;
        if (args.tax_amount) body.tax_amount = args.tax_amount;
        if (args.tax_rate) body.tax_rate = args.tax_rate;

        const data: APIResponse = await client.apiFetch('/api/business-vat-invoices', {
          method: 'POST',
          body: JSON.stringify(body),
        });

        return {
          content: [{
            type: 'text',
            text: `✓ VAT invoice created: ${data.data?.invoice_number}\n\n${JSON.stringify(data.data, null, 2)}`,
          }],
        };
      },
    },
  };
}

export function createPartnerTools(client: SSOSClient) {
  return {
    list_partners: {
      description: 'List partners (customers and suppliers)',
      inputSchema: {
        type: 'object',
        properties: {
          partner_type: {
            type: 'string',
            enum: ['customer', 'supplier', 'both'],
            description: 'Filter by partner type',
          },
          search: {
            type: 'string',
            description: 'Search by name',
          },
        },
      },
      handler: async (args: ListPartnersInput) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.partner_type) params.append('partner_type', args.partner_type);
        if (args.search) params.append('search', args.search);

        const data: APIResponse = await client.apiFetch(
          `/api/partners?${params.toString()}`
        );
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    create_partner: {
      description: 'Create a new partner (customer or supplier)',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Partner name',
          },
          partner_type: {
            type: 'string',
            enum: ['customer', 'supplier', 'both'],
            description: 'Partner type',
          },
          tax_number: {
            type: 'string',
            description: 'Tax registration number',
          },
          contact_person: {
            type: 'string',
            description: 'Contact person name',
          },
          phone: {
            type: 'string',
            description: 'Phone number',
          },
          address: {
            type: 'string',
            description: 'Address',
          },
          bank_name: {
            type: 'string',
            description: 'Bank name',
          },
          bank_account: {
            type: 'string',
            description: 'Bank account number',
          },
        },
        required: ['name', 'partner_type'],
      },
      handler: async (args: CreatePartnerInput) => {
        const body: Record<string, unknown> = {
          workspace_id: client.getWorkspaceId(),
          name: args.name,
          partner_type: args.partner_type,
        };
        if (args.tax_number) body.tax_number = args.tax_number;
        if (args.contact_person) body.contact_person = args.contact_person;
        if (args.phone) body.phone = args.phone;
        if (args.address) body.address = args.address;
        if (args.bank_name) body.bank_name = args.bank_name;
        if (args.bank_account) body.bank_account = args.bank_account;

        const data: APIResponse = await client.apiFetch('/api/partners', {
          method: 'POST',
          body: JSON.stringify(body),
        });

        return {
          content: [{
            type: 'text',
            text: `✓ Partner created: ${data.data?.name}\n\n${JSON.stringify(data.data, null, 2)}`,
          }],
        };
      },
    },

    update_partner: {
      description: 'Update partner information',
      inputSchema: {
        type: 'object',
        properties: {
          partner_id: {
            type: 'string',
            description: 'Partner ID',
          },
          name: { type: 'string' },
          contact_person: { type: 'string' },
          phone: { type: 'string' },
          address: { type: 'string' },
        },
        required: ['partner_id'],
      },
      handler: async (args: UpdatePartnerInput) => {
        const { partner_id, ...updates } = args;

        const data: APIResponse = await client.apiFetch(`/api/partners/${partner_id}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        });

        return {
          content: [{
            type: 'text',
            text: `✓ Partner updated: ${data.data?.name}\n\n${JSON.stringify(data.data, null, 2)}`,
          }],
        };
      },
    },
  };
}
