export function createEmployeeTools(client) {
    return {
        list_employees: {
            description: 'List all employees in workspace',
            inputSchema: {
                type: 'object',
                properties: {
                    status: {
                        type: 'string',
                        enum: ['active', 'terminated'],
                        description: 'Filter by employee status',
                    },
                },
            },
            handler: async (args) => {
                const params = new URLSearchParams();
                params.append('workspace_id', client.getWorkspaceId());
                if (args.status)
                    params.append('status', args.status);
                const data = await client.apiFetch(`/api/employees?${params.toString()}`);
                return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
            },
        },
        get_employee: {
            description: 'Get employee details by ID',
            inputSchema: {
                type: 'object',
                properties: {
                    employee_id: {
                        type: 'string',
                        description: 'Employee ID',
                    },
                },
                required: ['employee_id'],
            },
            handler: async (args) => {
                const data = await client.apiFetch(`/api/employees/${args.employee_id}`);
                return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
            },
        },
        create_employee: {
            description: 'Create a new employee',
            inputSchema: {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                        description: 'Employee name',
                    },
                    id_card_no: {
                        type: 'string',
                        description: 'ID card number',
                    },
                    department: {
                        type: 'string',
                        description: 'Department name',
                    },
                    position: {
                        type: 'string',
                        description: 'Job position',
                    },
                    hire_date: {
                        type: 'string',
                        description: 'Hire date (YYYY-MM-DD)',
                    },
                    monthly_special_deduction: {
                        type: 'string',
                        description: 'Monthly special deduction amount',
                    },
                    status: {
                        type: 'string',
                        enum: ['active', 'terminated'],
                        description: 'Employee status',
                    },
                    remark: {
                        type: 'string',
                        description: 'Remark',
                    },
                },
                required: ['name', 'hire_date'],
            },
            handler: async (args) => {
                const body = {
                    workspace_id: client.getWorkspaceId(),
                    name: args.name,
                    hire_date: args.hire_date,
                };
                if (args.id_card_no)
                    body.id_card_no = args.id_card_no;
                if (args.department)
                    body.department = args.department;
                if (args.position)
                    body.position = args.position;
                if (args.monthly_special_deduction)
                    body.monthly_special_deduction = args.monthly_special_deduction;
                if (args.status)
                    body.status = args.status;
                if (args.remark)
                    body.remark = args.remark;
                const data = await client.apiFetch('/api/employees', {
                    method: 'POST',
                    body: JSON.stringify(body),
                });
                return {
                    content: [{
                            type: 'text',
                            text: `✓ Employee created: ${data.data?.name} (ID: ${data.data?.id})\n\n${JSON.stringify(data.data, null, 2)}`,
                        }],
                };
            },
        },
        update_employee: {
            description: 'Update employee information',
            inputSchema: {
                type: 'object',
                properties: {
                    employee_id: {
                        type: 'string',
                        description: 'Employee ID',
                    },
                    name: { type: 'string' },
                    department: { type: 'string' },
                    position: { type: 'string' },
                    leave_date: { type: 'string', description: 'Leave date (YYYY-MM-DD)' },
                    status: { type: 'string', enum: ['active', 'terminated'] },
                    remark: { type: 'string' },
                },
                required: ['employee_id'],
            },
            handler: async (args) => {
                const { employee_id, ...updates } = args;
                const data = await client.apiFetch(`/api/employees/${employee_id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(updates),
                });
                return {
                    content: [{
                            type: 'text',
                            text: `✓ Employee updated: ${data.data?.name}\n\n${JSON.stringify(data.data, null, 2)}`,
                        }],
                };
            },
        },
        delete_employee: {
            description: 'Delete an employee',
            inputSchema: {
                type: 'object',
                properties: {
                    employee_id: {
                        type: 'string',
                        description: 'Employee ID to delete',
                    },
                },
                required: ['employee_id'],
            },
            handler: async (args) => {
                const data = await client.apiFetch(`/api/employees/${args.employee_id}`, {
                    method: 'DELETE',
                });
                return {
                    content: [{
                            type: 'text',
                            text: `✓ Employee deleted successfully`,
                        }],
                };
            },
        },
    };
}
