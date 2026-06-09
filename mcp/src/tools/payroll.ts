import type { SSOSClient } from '../client.js';

export function createPayrollTools(client: SSOSClient) {
  return {
    // ========== Annual Bonus (年终奖) ==========
    list_annual_bonuses: {
      description: 'List annual bonus records with optional filters',
      inputSchema: {
        type: 'object',
        properties: {
          year: {
            type: 'number',
            description: 'Filter by year (e.g., 2026)',
          },
          status: {
            type: 'string',
            enum: ['draft', 'posted', 'void'],
            description: 'Filter by status',
          },
        },
      },
      handler: async (args: any) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.year) params.append('year', String(args.year));
        if (args.status) params.append('status', args.status);

        const data = await client.apiFetch(`/api/annual-bonus?${params.toString()}`);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(data, null, 2)
          }]
        };
      },
    },

    get_annual_bonus: {
      description: 'Get a specific annual bonus record by ID',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Annual bonus record ID (UUID)',
          },
        },
        required: ['id'],
      },
      handler: async (args: any) => {
        const data = await client.apiFetch(`/api/annual-bonus/${args.id}`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    create_annual_bonus: {
      description: 'Create a new annual bonus record',
      inputSchema: {
        type: 'object',
        properties: {
          employee_id: {
            type: 'string',
            description: 'Employee ID (UUID)',
          },
          year: {
            type: 'number',
            description: 'Bonus year (e.g., 2026)',
          },
          bonus_amount: {
            type: 'number',
            description: 'Bonus amount',
          },
          tax_method: {
            type: 'string',
            enum: ['separate', 'combined'],
            description: 'Tax calculation method',
          },
          remark: {
            type: 'string',
            description: 'Optional remark',
          },
        },
        required: ['employee_id', 'year', 'bonus_amount', 'tax_method'],
      },
      handler: async (args: any) => {
        const data = await client.apiFetch('/api/annual-bonus', {
          method: 'POST',
          body: JSON.stringify({
            workspace_id: client.getWorkspaceId(),
            employee_id: args.employee_id,
            year: args.year,
            bonus_amount: String(args.bonus_amount),
            tax_method: args.tax_method,
            remark: args.remark,
          }),
        });
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    update_annual_bonus: {
      description: 'Update an existing annual bonus record',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Annual bonus record ID',
          },
          bonus_amount: {
            type: 'number',
            description: 'Updated bonus amount',
          },
          tax_method: {
            type: 'string',
            enum: ['separate', 'combined'],
            description: 'Updated tax method',
          },
          remark: {
            type: 'string',
            description: 'Updated remark',
          },
        },
        required: ['id'],
      },
      handler: async (args: any) => {
        const { id, ...updateData } = args;
        if (updateData.bonus_amount !== undefined) {
          updateData.bonus_amount = String(updateData.bonus_amount);
        }
        const data = await client.apiFetch(`/api/annual-bonus/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(updateData),
        });
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    post_annual_bonus: {
      description: 'Post an annual bonus record (change status to posted)',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Annual bonus record ID',
          },
        },
        required: ['id'],
      },
      handler: async (args: any) => {
        const data = await client.apiFetch(`/api/annual-bonus/${args.id}/post`, {
          method: 'POST',
        });
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    export_annual_bonuses_csv: {
      description: 'Export annual bonuses to CSV file',
      inputSchema: {
        type: 'object',
        properties: {
          year: {
            type: 'number',
            description: 'Filter by year',
          },
        },
      },
      handler: async (args: any) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.year) params.append('year', String(args.year));

        const response = await client.apiFetch(
          `/api/annual-bonus/export/csv?${params.toString()}`,
          { raw: true } as any
        );

        const blob = await (response as any).blob();
        const text = await blob.text();

        return {
          content: [{
            type: 'text',
            text: `CSV exported successfully. ${text.split('\n').length - 1} rows.`
          }]
        };
      },
    },

    // ========== Dividend Payments (股东分红) ==========
    list_dividend_payments: {
      description: 'List dividend payment records with optional filters',
      inputSchema: {
        type: 'object',
        properties: {
          year: {
            type: 'number',
            description: 'Filter by year',
          },
          status: {
            type: 'string',
            enum: ['draft', 'posted', 'void'],
            description: 'Filter by status',
          },
        },
      },
      handler: async (args: any) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.year) params.append('year', String(args.year));
        if (args.status) params.append('status', args.status);

        const data = await client.apiFetch(`/api/dividend-payments?${params.toString()}`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    get_dividend_payment: {
      description: 'Get a specific dividend payment record by ID',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Dividend payment record ID (UUID)',
          },
        },
        required: ['id'],
      },
      handler: async (args: any) => {
        const data = await client.apiFetch(`/api/dividend-payments/${args.id}`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    create_dividend_payment: {
      description: 'Create a new dividend payment record',
      inputSchema: {
        type: 'object',
        properties: {
          shareholder_id: {
            type: 'string',
            description: 'Shareholder ID (UUID)',
          },
          payment_date: {
            type: 'string',
            description: 'Payment date (YYYY-MM-DD)',
          },
          dividend_amount: {
            type: 'number',
            description: 'Dividend amount',
          },
          remark: {
            type: 'string',
            description: 'Optional remark',
          },
        },
        required: ['shareholder_id', 'payment_date', 'dividend_amount'],
      },
      handler: async (args: any) => {
        const data = await client.apiFetch('/api/dividend-payments', {
          method: 'POST',
          body: JSON.stringify({
            workspace_id: client.getWorkspaceId(),
            shareholder_id: args.shareholder_id,
            payment_date: args.payment_date,
            dividend_amount: String(args.dividend_amount),
            remark: args.remark,
          }),
        });
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    post_dividend_payment: {
      description: 'Post a dividend payment record (change status to posted)',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Dividend payment record ID',
          },
        },
        required: ['id'],
      },
      handler: async (args: any) => {
        const data = await client.apiFetch(`/api/dividend-payments/${args.id}/post`, {
          method: 'POST',
        });
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    export_dividend_payments_csv: {
      description: 'Export dividend payments to CSV file',
      inputSchema: {
        type: 'object',
        properties: {
          year: {
            type: 'number',
            description: 'Filter by year',
          },
        },
      },
      handler: async (args: any) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.year) params.append('year', String(args.year));

        const response = await client.apiFetch(
          `/api/dividend-payments/export/csv?${params.toString()}`,
          { raw: true } as any
        );

        const blob = await (response as any).blob();
        const text = await blob.text();

        return {
          content: [{
            type: 'text',
            text: `CSV exported successfully. ${text.split('\n').length - 1} rows.`
          }]
        };
      },
    },

    // ========== Labor Fee Payments (劳务费) ==========
    list_labor_fee_payments: {
      description: 'List labor fee payment records with optional filters',
      inputSchema: {
        type: 'object',
        properties: {
          year: {
            type: 'number',
            description: 'Filter by year',
          },
          period: {
            type: 'string',
            description: 'Filter by period (YYYY-MM)',
          },
          status: {
            type: 'string',
            enum: ['draft', 'posted', 'void'],
            description: 'Filter by status',
          },
        },
      },
      handler: async (args: any) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.year) params.append('year', String(args.year));
        if (args.period) params.append('period', args.period);
        if (args.status) params.append('status', args.status);

        const data = await client.apiFetch(`/api/labor-fee-payments?${params.toString()}`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    get_labor_fee_payment: {
      description: 'Get a specific labor fee payment record by ID',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Labor fee payment record ID (UUID)',
          },
        },
        required: ['id'],
      },
      handler: async (args: any) => {
        const data = await client.apiFetch(`/api/labor-fee-payments/${args.id}`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    create_labor_fee_payment: {
      description: 'Create a new labor fee payment record',
      inputSchema: {
        type: 'object',
        properties: {
          payee_name: {
            type: 'string',
            description: 'Payee name',
          },
          id_number: {
            type: 'string',
            description: 'ID number',
          },
          payment_date: {
            type: 'string',
            description: 'Payment date (YYYY-MM-DD)',
          },
          fee_amount: {
            type: 'number',
            description: 'Fee amount',
          },
          remark: {
            type: 'string',
            description: 'Optional remark',
          },
        },
        required: ['payee_name', 'id_number', 'payment_date', 'fee_amount'],
      },
      handler: async (args: any) => {
        const data = await client.apiFetch('/api/labor-fee-payments', {
          method: 'POST',
          body: JSON.stringify({
            workspace_id: client.getWorkspaceId(),
            payee_name: args.payee_name,
            id_number: args.id_number,
            payment_date: args.payment_date,
            fee_amount: String(args.fee_amount),
            remark: args.remark,
          }),
        });
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    post_labor_fee_payment: {
      description: 'Post a labor fee payment record (change status to posted)',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Labor fee payment record ID',
          },
        },
        required: ['id'],
      },
      handler: async (args: any) => {
        const data = await client.apiFetch(`/api/labor-fee-payments/${args.id}/post`, {
          method: 'POST',
        });
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    export_labor_fee_payments_csv: {
      description: 'Export labor fee payments to CSV file',
      inputSchema: {
        type: 'object',
        properties: {
          year: {
            type: 'number',
            description: 'Filter by year',
          },
          period: {
            type: 'string',
            description: 'Filter by period (YYYY-MM)',
          },
        },
      },
      handler: async (args: any) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.year) params.append('year', String(args.year));
        if (args.period) params.append('period', args.period);

        const response = await client.apiFetch(
          `/api/labor-fee-payments/export/csv?${params.toString()}`,
          { raw: true } as any
        );

        const blob = await (response as any).blob();
        const text = await blob.text();

        return {
          content: [{
            type: 'text',
            text: `CSV exported successfully. ${text.split('\n').length - 1} rows.`
          }]
        };
      },
    },

    // ========== Severance Payments (补偿金) ==========
    list_severance_payments: {
      description: 'List severance payment records with optional filters',
      inputSchema: {
        type: 'object',
        properties: {
          year: {
            type: 'number',
            description: 'Filter by year',
          },
          status: {
            type: 'string',
            enum: ['draft', 'posted', 'void'],
            description: 'Filter by status',
          },
        },
      },
      handler: async (args: any) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.year) params.append('year', String(args.year));
        if (args.status) params.append('status', args.status);

        const data = await client.apiFetch(`/api/severance-payments?${params.toString()}`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    get_severance_payment: {
      description: 'Get a specific severance payment record by ID',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Severance payment record ID (UUID)',
          },
        },
        required: ['id'],
      },
      handler: async (args: any) => {
        const data = await client.apiFetch(`/api/severance-payments/${args.id}`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    create_severance_payment: {
      description: 'Create a new severance payment record',
      inputSchema: {
        type: 'object',
        properties: {
          employee_id: {
            type: 'string',
            description: 'Employee ID (UUID)',
          },
          payment_date: {
            type: 'string',
            description: 'Payment date (YYYY-MM-DD)',
          },
          severance_amount: {
            type: 'number',
            description: 'Severance amount',
          },
          severance_type: {
            type: 'string',
            enum: ['economic_compensation', 'statutory_compensation'],
            description: 'Type of severance',
          },
          remark: {
            type: 'string',
            description: 'Optional remark',
          },
        },
        required: ['employee_id', 'payment_date', 'severance_amount', 'severance_type'],
      },
      handler: async (args: any) => {
        const data = await client.apiFetch('/api/severance-payments', {
          method: 'POST',
          body: JSON.stringify({
            workspace_id: client.getWorkspaceId(),
            employee_id: args.employee_id,
            payment_date: args.payment_date,
            severance_amount: String(args.severance_amount),
            severance_type: args.severance_type,
            remark: args.remark,
          }),
        });
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    post_severance_payment: {
      description: 'Post a severance payment record (change status to posted)',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Severance payment record ID',
          },
        },
        required: ['id'],
      },
      handler: async (args: any) => {
        const data = await client.apiFetch(`/api/severance-payments/${args.id}/post`, {
          method: 'POST',
        });
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    export_severance_payments_csv: {
      description: 'Export severance payments to CSV file',
      inputSchema: {
        type: 'object',
        properties: {
          year: {
            type: 'number',
            description: 'Filter by year',
          },
        },
      },
      handler: async (args: any) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.year) params.append('year', String(args.year));

        const response = await client.apiFetch(
          `/api/severance-payments/export/csv?${params.toString()}`,
          { raw: true } as any
        );

        const blob = await (response as any).blob();
        const text = await blob.text();

        return {
          content: [{
            type: 'text',
            text: `CSV exported successfully. ${text.split('\n').length - 1} rows.`
          }]
        };
      },
    },

    // ========== Pension Payments (企业年金) ==========
    list_pension_payments: {
      description: 'List pension payment records with optional filters',
      inputSchema: {
        type: 'object',
        properties: {
          year: {
            type: 'number',
            description: 'Filter by year',
          },
          period: {
            type: 'string',
            description: 'Filter by period (YYYY-MM)',
          },
        },
      },
      handler: async (args: any) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.year) params.append('year', String(args.year));
        if (args.period) params.append('period', args.period);

        const data = await client.apiFetch(`/api/pension-payments?${params.toString()}`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    get_pension_payment: {
      description: 'Get a specific pension payment record by ID',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Pension payment record ID (UUID)',
          },
        },
        required: ['id'],
      },
      handler: async (args: any) => {
        const data = await client.apiFetch(`/api/pension-payments/${args.id}`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    export_pension_payments_csv: {
      description: 'Export pension payments to CSV file',
      inputSchema: {
        type: 'object',
        properties: {
          year: {
            type: 'number',
            description: 'Filter by year',
          },
          period: {
            type: 'string',
            description: 'Filter by period (YYYY-MM)',
          },
        },
      },
      handler: async (args: any) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.year) params.append('year', String(args.year));
        if (args.period) params.append('period', args.period);

        const response = await client.apiFetch(
          `/api/pension-payments/export/csv?${params.toString()}`,
          { raw: true } as any
        );

        const blob = await (response as any).blob();
        const text = await blob.text();

        return {
          content: [{
            type: 'text',
            text: `CSV exported successfully. ${text.split('\n').length - 1} rows.`
          }]
        };
      },
    },

    // ========== Pension Deductions (个人养老金扣除) ==========
    list_pension_deductions: {
      description: 'List pension deduction records with optional filters',
      inputSchema: {
        type: 'object',
        properties: {
          year: {
            type: 'number',
            description: 'Filter by year',
          },
          period: {
            type: 'string',
            description: 'Filter by period (YYYY-MM)',
          },
        },
      },
      handler: async (args: any) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.year) params.append('year', String(args.year));
        if (args.period) params.append('period', args.period);

        const data = await client.apiFetch(`/api/pension-deductions?${params.toString()}`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    get_pension_deduction: {
      description: 'Get a specific pension deduction record by ID',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Pension deduction record ID (UUID)',
          },
        },
        required: ['id'],
      },
      handler: async (args: any) => {
        const data = await client.apiFetch(`/api/pension-deductions/${args.id}`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    export_pension_deductions_csv: {
      description: 'Export pension deductions to CSV file',
      inputSchema: {
        type: 'object',
        properties: {
          year: {
            type: 'number',
            description: 'Filter by year',
          },
          period: {
            type: 'string',
            description: 'Filter by period (YYYY-MM)',
          },
        },
      },
      handler: async (args: any) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.year) params.append('year', String(args.year));
        if (args.period) params.append('period', args.period);

        const response = await client.apiFetch(
          `/api/pension-deductions/export/csv?${params.toString()}`,
          { raw: true } as any
        );

        const blob = await (response as any).blob();
        const text = await blob.text();

        return {
          content: [{
            type: 'text',
            text: `CSV exported successfully. ${text.split('\n').length - 1} rows.`
          }]
        };
      },
    },

    // ========== Equity Incentive (股权激励) ==========
    list_equity_incentives: {
      description: 'List equity incentive records with optional filters',
      inputSchema: {
        type: 'object',
        properties: {
          year: {
            type: 'number',
            description: 'Filter by year',
          },
          status: {
            type: 'string',
            enum: ['granted', 'exercised', 'void'],
            description: 'Filter by status',
          },
        },
      },
      handler: async (args: any) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.year) params.append('year', String(args.year));
        if (args.status) params.append('status', args.status);

        const data = await client.apiFetch(`/api/equity-incentive?${params.toString()}`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    get_equity_incentive: {
      description: 'Get a specific equity incentive record by ID',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Equity incentive record ID (UUID)',
          },
        },
        required: ['id'],
      },
      handler: async (args: any) => {
        const data = await client.apiFetch(`/api/equity-incentive/${args.id}`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    exercise_equity_incentive: {
      description: 'Exercise an equity incentive (stock option)',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Equity incentive record ID',
          },
          exercise_quantity: {
            type: 'number',
            description: 'Number of shares to exercise',
          },
          exercise_date: {
            type: 'string',
            description: 'Exercise date (YYYY-MM-DD)',
          },
        },
        required: ['id', 'exercise_quantity', 'exercise_date'],
      },
      handler: async (args: any) => {
        const data = await client.apiFetch(`/api/equity-incentive/${args.id}/exercise`, {
          method: 'POST',
          body: JSON.stringify({
            exercise_quantity: args.exercise_quantity,
            exercise_date: args.exercise_date,
          }),
        });
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    export_equity_incentives_csv: {
      description: 'Export equity incentives to CSV file',
      inputSchema: {
        type: 'object',
        properties: {
          year: {
            type: 'number',
            description: 'Filter by year',
          },
        },
      },
      handler: async (args: any) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.year) params.append('year', String(args.year));

        const response = await client.apiFetch(
          `/api/equity-incentive/export/csv?${params.toString()}`,
          { raw: true } as any
        );

        const blob = await (response as any).blob();
        const text = await blob.text();

        return {
          content: [{
            type: 'text',
            text: `CSV exported successfully. ${text.split('\n').length - 1} rows.`
          }]
        };
      },
    },

    // ========== Incidental Income (偶然所得) ==========
    list_incidental_incomes: {
      description: 'List incidental income records with optional filters',
      inputSchema: {
        type: 'object',
        properties: {
          year: {
            type: 'number',
            description: 'Filter by year',
          },
        },
      },
      handler: async (args: any) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.year) params.append('year', String(args.year));

        const data = await client.apiFetch(`/api/incidental-income?${params.toString()}`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    get_incidental_income: {
      description: 'Get a specific incidental income record by ID',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Incidental income record ID (UUID)',
          },
        },
        required: ['id'],
      },
      handler: async (args: any) => {
        const data = await client.apiFetch(`/api/incidental-income/${args.id}`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    export_incidental_incomes_csv: {
      description: 'Export incidental incomes to CSV file',
      inputSchema: {
        type: 'object',
        properties: {
          year: {
            type: 'number',
            description: 'Filter by year',
          },
        },
      },
      handler: async (args: any) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.year) params.append('year', String(args.year));

        const response = await client.apiFetch(
          `/api/incidental-income/export/csv?${params.toString()}`,
          { raw: true } as any
        );

        const blob = await (response as any).blob();
        const text = await blob.text();

        return {
          content: [{
            type: 'text',
            text: `CSV exported successfully. ${text.split('\n').length - 1} rows.`
          }]
        };
      },
    },

    // ========== Property Transfer (财产转让) ==========
    list_property_transfers: {
      description: 'List property transfer records with optional filters',
      inputSchema: {
        type: 'object',
        properties: {
          year: {
            type: 'number',
            description: 'Filter by year',
          },
        },
      },
      handler: async (args: any) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.year) params.append('year', String(args.year));

        const data = await client.apiFetch(`/api/property-transfer?${params.toString()}`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    get_property_transfer: {
      description: 'Get a specific property transfer record by ID',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Property transfer record ID (UUID)',
          },
        },
        required: ['id'],
      },
      handler: async (args: any) => {
        const data = await client.apiFetch(`/api/property-transfer/${args.id}`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    export_property_transfers_csv: {
      description: 'Export property transfers to CSV file',
      inputSchema: {
        type: 'object',
        properties: {
          year: {
            type: 'number',
            description: 'Filter by year',
          },
        },
      },
      handler: async (args: any) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.year) params.append('year', String(args.year));

        const response = await client.apiFetch(
          `/api/property-transfer/export/csv?${params.toString()}`,
          { raw: true } as any
        );

        const blob = await (response as any).blob();
        const text = await blob.text();

        return {
          content: [{
            type: 'text',
            text: `CSV exported successfully. ${text.split('\n').length - 1} rows.`
          }]
        };
      },
    },

    // ========== Discount Housing Sale (低价售房) ==========
    list_discount_housing_sales: {
      description: 'List discount housing sale records with optional filters',
      inputSchema: {
        type: 'object',
        properties: {
          year: {
            type: 'number',
            description: 'Filter by year',
          },
        },
      },
      handler: async (args: any) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.year) params.append('year', String(args.year));

        const data = await client.apiFetch(`/api/discount-housing-sale?${params.toString()}`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    get_discount_housing_sale: {
      description: 'Get a specific discount housing sale record by ID',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Discount housing sale record ID (UUID)',
          },
        },
        required: ['id'],
      },
      handler: async (args: any) => {
        const data = await client.apiFetch(`/api/discount-housing-sale/${args.id}`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    export_discount_housing_sales_csv: {
      description: 'Export discount housing sales to CSV file',
      inputSchema: {
        type: 'object',
        properties: {
          year: {
            type: 'number',
            description: 'Filter by year',
          },
        },
      },
      handler: async (args: any) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.year) params.append('year', String(args.year));

        const response = await client.apiFetch(
          `/api/discount-housing-sale/export/csv?${params.toString()}`,
          { raw: true } as any
        );

        const blob = await (response as any).blob();
        const text = await blob.text();

        return {
          content: [{
            type: 'text',
            text: `CSV exported successfully. ${text.split('\n').length - 1} rows.`
          }]
        };
      },
    },

    // ========== Overseas Dispatch (派员出境) ==========
    list_overseas_dispatches: {
      description: 'List overseas dispatch records with optional filters',
      inputSchema: {
        type: 'object',
        properties: {
          year: {
            type: 'number',
            description: 'Filter by year',
          },
        },
      },
      handler: async (args: any) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.year) params.append('year', String(args.year));

        const data = await client.apiFetch(`/api/overseas-dispatch?${params.toString()}`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    get_overseas_dispatch: {
      description: 'Get a specific overseas dispatch record by ID',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Overseas dispatch record ID (UUID)',
          },
        },
        required: ['id'],
      },
      handler: async (args: any) => {
        const data = await client.apiFetch(`/api/overseas-dispatch/${args.id}`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    export_overseas_dispatches_csv: {
      description: 'Export overseas dispatches to CSV file',
      inputSchema: {
        type: 'object',
        properties: {
          year: {
            type: 'number',
            description: 'Filter by year',
          },
        },
      },
      handler: async (args: any) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.year) params.append('year', String(args.year));

        const response = await client.apiFetch(
          `/api/overseas-dispatch/export/csv?${params.toString()}`,
          { raw: true } as any
        );

        const blob = await (response as any).blob();
        const text = await blob.text();

        return {
          content: [{
            type: 'text',
            text: `CSV exported successfully. ${text.split('\n').length - 1} rows.`
          }]
        };
      },
    },

    // ========== Tech Achievements (技术成果) ==========
    list_tech_achievements: {
      description: 'List tech achievement records with optional filters',
      inputSchema: {
        type: 'object',
        properties: {
          year: {
            type: 'number',
            description: 'Filter by year',
          },
        },
      },
      handler: async (args: any) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.year) params.append('year', String(args.year));

        const data = await client.apiFetch(`/api/tech-achievements?${params.toString()}`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    get_tech_achievement: {
      description: 'Get a specific tech achievement record by ID',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Tech achievement record ID (UUID)',
          },
        },
        required: ['id'],
      },
      handler: async (args: any) => {
        const data = await client.apiFetch(`/api/tech-achievements/${args.id}`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    export_tech_achievements_csv: {
      description: 'Export tech achievements to CSV file',
      inputSchema: {
        type: 'object',
        properties: {
          year: {
            type: 'number',
            description: 'Filter by year',
          },
        },
      },
      handler: async (args: any) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.year) params.append('year', String(args.year));

        const response = await client.apiFetch(
          `/api/tech-achievements/export/csv?${params.toString()}`,
          { raw: true } as any
        );

        const blob = await (response as any).blob();
        const text = await blob.text();

        return {
          content: [{
            type: 'text',
            text: `CSV exported successfully. ${text.split('\n').length - 1} rows.`
          }]
        };
      },
    },

    // ========== Property Rental (财产租赁) ==========
    list_property_rentals: {
      description: 'List property rental records with optional filters',
      inputSchema: {
        type: 'object',
        properties: {
          year: {
            type: 'number',
            description: 'Filter by year',
          },
          period: {
            type: 'string',
            description: 'Filter by period (YYYY-MM)',
          },
        },
      },
      handler: async (args: any) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.year) params.append('year', String(args.year));
        if (args.period) params.append('period', args.period);

        const data = await client.apiFetch(`/api/property-rental?${params.toString()}`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    get_property_rental: {
      description: 'Get a specific property rental record by ID',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Property rental record ID (UUID)',
          },
        },
        required: ['id'],
      },
      handler: async (args: any) => {
        const data = await client.apiFetch(`/api/property-rental/${args.id}`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    export_property_rentals_csv: {
      description: 'Export property rentals to CSV file',
      inputSchema: {
        type: 'object',
        properties: {
          year: {
            type: 'number',
            description: 'Filter by year',
          },
          period: {
            type: 'string',
            description: 'Filter by period (YYYY-MM)',
          },
        },
      },
      handler: async (args: any) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.year) params.append('year', String(args.year));
        if (args.period) params.append('period', args.period);

        const response = await client.apiFetch(
          `/api/property-rental/export/csv?${params.toString()}`,
          { raw: true } as any
        );

        const blob = await (response as any).blob();
        const text = await blob.text();

        return {
          content: [{
            type: 'text',
            text: `CSV exported successfully. ${text.split('\n').length - 1} rows.`
          }]
        };
      },
    },

    // ========== Labor Contracts (劳动合同) ==========
    list_labor_contracts: {
      description: 'List labor contract records with optional filters',
      inputSchema: {
        type: 'object',
        properties: {
          year: {
            type: 'number',
            description: 'Filter by year',
          },
          status: {
            type: 'string',
            enum: ['active', 'terminated', 'expired'],
            description: 'Filter by status',
          },
        },
      },
      handler: async (args: any) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.year) params.append('year', String(args.year));
        if (args.status) params.append('status', args.status);

        const data = await client.apiFetch(`/api/labor-contracts?${params.toString()}`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    get_labor_contract: {
      description: 'Get a specific labor contract record by ID',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Labor contract record ID (UUID)',
          },
        },
        required: ['id'],
      },
      handler: async (args: any) => {
        const data = await client.apiFetch(`/api/labor-contracts/${args.id}`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    export_labor_contracts_csv: {
      description: 'Export labor contracts to CSV file',
      inputSchema: {
        type: 'object',
        properties: {
          year: {
            type: 'number',
            description: 'Filter by year',
          },
        },
      },
      handler: async (args: any) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.year) params.append('year', String(args.year));

        const response = await client.apiFetch(
          `/api/labor-contracts/export/csv?${params.toString()}`,
          { raw: true } as any
        );

        const blob = await (response as any).blob();
        const text = await blob.text();

        return {
          content: [{
            type: 'text',
            text: `CSV exported successfully. ${text.split('\n').length - 1} rows.`
          }]
        };
      },
    },
  };
}
