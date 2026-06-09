export function createLaborContractTools(client) {
    return {
        list_labor_contracts: {
            description: 'List labor contracts',
            inputSchema: {
                type: 'object',
                properties: {
                    employee_id: {
                        type: 'string',
                        description: 'Filter by employee ID',
                    },
                    status: {
                        type: 'string',
                        enum: ['active', 'expired', 'terminated'],
                        description: 'Filter by contract status',
                    },
                },
            },
            handler: async (args) => {
                const params = new URLSearchParams();
                params.append('workspace_id', client.getWorkspaceId());
                if (args.employee_id)
                    params.append('employee_id', args.employee_id);
                if (args.status)
                    params.append('status', args.status);
                const data = await client.apiFetch(`/api/labor-contracts?${params.toString()}`);
                return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
            },
        },
        create_labor_contract: {
            description: 'Create labor contract',
            inputSchema: {
                type: 'object',
                properties: {
                    employee_id: {
                        type: 'string',
                        description: 'Employee ID',
                    },
                    contract_type: {
                        type: 'string',
                        enum: ['fixed_term', 'unlimited', 'project_based'],
                        description: 'Contract type',
                    },
                    start_date: {
                        type: 'string',
                        description: 'Contract start date (YYYY-MM-DD)',
                    },
                    end_date: {
                        type: 'string',
                        description: 'Contract end date (YYYY-MM-DD, optional for unlimited)',
                    },
                    probation_months: {
                        type: 'number',
                        description: 'Probation period in months',
                    },
                    base_salary: {
                        type: 'string',
                        description: 'Base salary amount',
                    },
                    remark: {
                        type: 'string',
                        description: 'Contract remarks',
                    },
                },
                required: ['employee_id', 'contract_type', 'start_date'],
            },
            handler: async (args) => {
                const body = {
                    workspace_id: client.getWorkspaceId(),
                    employee_id: args.employee_id,
                    contract_type: args.contract_type,
                    start_date: args.start_date,
                };
                if (args.end_date)
                    body.end_date = args.end_date;
                if (args.probation_months)
                    body.probation_months = args.probation_months;
                if (args.base_salary)
                    body.base_salary = args.base_salary;
                if (args.remark)
                    body.remark = args.remark;
                const data = await client.apiFetch('/api/labor-contracts', {
                    method: 'POST',
                    body: JSON.stringify(body),
                });
                return {
                    content: [{
                            type: 'text',
                            text: `✓ Labor contract created\n\n${JSON.stringify(data.data, null, 2)}`,
                        }],
                };
            },
        },
    };
}
