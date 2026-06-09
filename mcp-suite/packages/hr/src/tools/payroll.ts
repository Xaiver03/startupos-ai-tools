import type { APIResponse, CreatePayrollRecordInput, ListPayrollRecordsInput, PostPayrollInput, SSOSClient } from '@startupos/mcp-shared';

export function createPayrollTools(client: SSOSClient) {
  return {
    list_payroll_records: {
      description: 'List payroll records',
      inputSchema: {
        type: 'object',
        properties: {
          employee_id: {
            type: 'string',
            description: 'Filter by employee ID',
          },
          period: {
            type: 'string',
            description: 'Filter by period (YYYY-MM)',
          },
          status: {
            type: 'string',
            enum: ['draft', 'posted'],
            description: 'Filter by status',
          },
        },
      },
      handler: async (args: ListPayrollRecordsInput) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.employee_id) params.append('employee_id', args.employee_id);
        if (args.period) params.append('period', args.period);
        if (args.status) params.append('status', args.status);

        const data: APIResponse = await client.apiFetch(
          `/api/payroll-records?${params.toString()}`
        );
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      },
    },

    create_payroll_record: {
      description: 'Create payroll record (single employee)',
      inputSchema: {
        type: 'object',
        properties: {
          employee_id: {
            type: 'string',
            description: 'Employee ID',
          },
          period: {
            type: 'string',
            description: 'Payroll period (YYYY-MM)',
          },
          gross_salary: {
            type: 'string',
            description: 'Gross salary amount',
          },
          social_insurance: {
            type: 'string',
            description: 'Social insurance deduction',
          },
          housing_fund: {
            type: 'string',
            description: 'Housing fund deduction',
          },
          special_deduction: {
            type: 'string',
            description: 'Special deductions (children, elderly care, etc.)',
          },
          other_deduction: {
            type: 'string',
            description: 'Other deductions',
          },
          remark: {
            type: 'string',
            description: 'Remark',
          },
        },
        required: ['employee_id', 'period', 'gross_salary'],
      },
      handler: async (args: CreatePayrollRecordInput) => {
        const body: Record<string, unknown> = {
          workspace_id: client.getWorkspaceId(),
          employee_id: args.employee_id,
          period: args.period,
          gross_salary: args.gross_salary,
          social_insurance: args.social_insurance || '0',
          housing_fund: args.housing_fund || '0',
          special_deduction: args.special_deduction || '0',
          other_deduction: args.other_deduction || '0',
        };
        if (args.remark) body.remark = args.remark;

        const data: APIResponse = await client.apiFetch('/api/payroll-records', {
          method: 'POST',
          body: JSON.stringify(body),
        });

        return {
          content: [{
            type: 'text',
            text: `✓ Payroll record created\n\n${JSON.stringify(data.data, null, 2)}`,
          }],
        };
      },
    },

    post_payroll: {
      description: 'Post payroll records to journal entries',
      inputSchema: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            description: 'Payroll period to post (YYYY-MM)',
          },
          entry_date: {
            type: 'string',
            description: 'Journal entry date (YYYY-MM-DD)',
          },
        },
        required: ['period', 'entry_date'],
      },
      handler: async (args: PostPayrollInput) => {
        const body = {
          workspace_id: client.getWorkspaceId(),
          period: args.period,
          entry_date: args.entry_date,
        };

        const data: APIResponse = await client.apiFetch('/api/payroll-records/post', {
          method: 'POST',
          body: JSON.stringify(body),
        });

        return {
          content: [{
            type: 'text',
            text: `✓ Payroll posted to journal entry\n\n${JSON.stringify(data.data, null, 2)}`,
          }],
        };
      },
    },
  };
}
