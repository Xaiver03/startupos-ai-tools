import { Command } from 'commander';
import { table } from 'table';
import chalk from 'chalk';
import ora from 'ora';
import { apiFetch } from '../lib/api-client.js';
export function createExpenseCommand() {
    const expenseCmd = new Command('expense')
        .description('Expense claim management (报销)');
    // List expense claims
    expenseCmd
        .command('list')
        .description('List expense claims')
        .option('-w, --workspace <id>', 'Workspace ID (required)')
        .option('--status <status>', 'Filter by status (draft|submitted|approved|rejected|paid)')
        .option('--employee <id>', 'Filter by employee ID')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        if (!options.workspace) {
            console.error(chalk.red('Error: --workspace is required'));
            process.exit(1);
        }
        const spinner = ora('Fetching expense claims...').start();
        try {
            const params = new URLSearchParams();
            params.append('workspace_id', options.workspace);
            if (options.status)
                params.append('status', options.status);
            if (options.employee)
                params.append('employee_id', options.employee);
            const data = await apiFetch(`/api/expense-claims?${params.toString()}`);
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
                return;
            }
            const claims = (data.claims || data.items || data.data) || [];
            if (claims.length === 0) {
                console.log(chalk.yellow('No expense claims found'));
                return;
            }
            const rows = [
                ['ID', 'Claim #', 'Applicant', 'Title', 'Amount', 'Status', 'Submitted'],
                ...claims.map((c) => [
                    c.id,
                    c.claim_number || '-',
                    c.applicant_name?.substring(0, 12) || '-',
                    c.title?.substring(0, 20) || '-',
                    c.total_amount || '-',
                    c.status || '-',
                    c.submitted_at ? new Date(c.submitted_at).toLocaleDateString() : '-',
                ]),
            ];
            console.log(chalk.bold('\nExpense Claims'));
            console.log(table(rows));
            console.log(chalk.gray(`\nTotal: ${claims.length} claims`));
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Create expense claim
    expenseCmd
        .command('create')
        .description('Create an expense claim')
        .requiredOption('-w, --workspace <id>', 'Workspace ID')
        .requiredOption('-t, --title <title>', 'Claim title')
        .requiredOption('--items <json>', 'Items as JSON array [{category_id, expense_date, amount, description, invoice_number}]')
        .option('--description <text>', 'Description')
        .option('--department <dept>', 'Department name')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        const spinner = ora('Creating expense claim...').start();
        try {
            const items = JSON.parse(options.items).map((item) => ({
                category_id: item.category_id || undefined,
                expense_date: item.expense_date,
                amount: String(item.amount),
                description: item.description || undefined,
                invoice_number: item.invoice_number || undefined,
            }));
            const body = {
                workspace_id: options.workspace,
                title: options.title,
                items,
            };
            if (options.description)
                body.description = options.description;
            if (options.department)
                body.department = options.department;
            const data = await apiFetch('/api/expense-claims', {
                method: 'POST',
                body: JSON.stringify(body),
            });
            spinner.succeed('Expense claim created');
            if (options.json) {
                console.log(JSON.stringify(data, null, 2));
            }
            else {
                console.log(chalk.bold('\nCreated Claim:'));
                console.log(`ID: ${data.id}`);
                console.log(`Title: ${data.title}`);
                console.log(`Status: ${data.status}`);
            }
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Submit expense claim
    expenseCmd
        .command('submit')
        .description('Submit an expense claim for approval')
        .argument('<id>', 'Claim ID')
        .option('--json', 'Output as JSON')
        .action(async (id, options) => {
        const spinner = ora('Submitting claim...').start();
        try {
            const data = await apiFetch(`/api/expense-claims/${id}/submit`, { method: 'POST' });
            spinner.succeed('Claim submitted for approval');
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
            }
            else {
                console.log(`${chalk.bold('Status:')} submitted`);
            }
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Approve expense claim
    expenseCmd
        .command('approve')
        .description('Approve an expense claim')
        .argument('<id>', 'Claim ID')
        .option('--json', 'Output as JSON')
        .action(async (id, options) => {
        const spinner = ora('Approving claim...').start();
        try {
            const data = await apiFetch(`/api/expense-claims/${id}/approve`, {
                method: 'POST',
                body: JSON.stringify({}),
            });
            spinner.succeed('Claim approved');
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
            }
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Reject expense claim
    expenseCmd
        .command('reject')
        .description('Reject an expense claim')
        .argument('<id>', 'Claim ID')
        .requiredOption('--reason <reason>', 'Rejection reason')
        .option('--json', 'Output as JSON')
        .action(async (id, options) => {
        const spinner = ora('Rejecting claim...').start();
        try {
            const body = {};
            if (options.reason)
                body.reason = options.reason;
            const data = await apiFetch(`/api/expense-claims/${id}/reject`, {
                method: 'POST',
                body: JSON.stringify(body),
            });
            spinner.succeed('Claim rejected');
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
            }
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Reimburse expense claim
    expenseCmd
        .command('reimburse')
        .description('Reimburse an approved expense claim (creates journal entry)')
        .argument('<id>', 'Claim ID')
        .option('--json', 'Output as JSON')
        .action(async (id, options) => {
        const spinner = ora('Reimbursing claim...').start();
        try {
            const data = await apiFetch(`/api/expense-claims/${id}/reimburse`, { method: 'POST' });
            spinner.succeed('Claim reimbursed');
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
            }
            else {
                const r = (data.data || data);
                console.log(`${chalk.bold('Status:')} ${r.status || 'reimbursed'}`);
                if (r.journal_entry_id)
                    console.log(`${chalk.bold('Journal Entry:')} ${r.journal_entry_id}`);
            }
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Get expense claim
    expenseCmd
        .command('get')
        .description('Get expense claim details')
        .argument('<id>', 'Claim ID')
        .option('--json', 'Output as JSON')
        .action(async (id, options) => {
        const spinner = ora('Fetching claim...').start();
        try {
            const wsId = process.env.SSOS_WORKSPACE_ID;
            // If not a UUID, treat as claim number and resolve to ID first
            let claimId = id;
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
            if (!isUuid) {
                const listData = await apiFetch(`/api/expense-claims?workspace_id=${wsId}`);
                const claims = (listData.data || listData.claims || listData.items || []);
                const matched = claims.find((c) => c.claim_number === id);
                if (!matched) {
                    spinner.fail(`Claim #${id} not found`);
                    process.exit(1);
                }
                claimId = matched.id;
            }
            const data = await apiFetch(`/api/expense-claims/${claimId}?workspace_id=${wsId}`);
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
                return;
            }
            const claim = (data.data || data);
            console.log(chalk.bold('\nExpense Claim Details:'));
            console.log(chalk.gray('─'.repeat(50)));
            console.log(`${chalk.bold('ID:')} ${claim.id}`);
            console.log(`${chalk.bold('Claim #:')} ${claim.claim_number || '-'}`);
            console.log(`${chalk.bold('Applicant:')} ${claim.applicant_name || '-'}`);
            console.log(`${chalk.bold('Title:')} ${claim.title || '-'}`);
            console.log(`${chalk.bold('Submitted:')} ${claim.submitted_at || '-'}`);
            console.log(`${chalk.bold('Amount:')} ${claim.total_amount || '-'}`);
            console.log(`${chalk.bold('Status:')} ${claim.status}`);
            console.log(`${chalk.bold('Description:')} ${claim.description || '-'}`);
            console.log(`${chalk.bold('Department:')} ${claim.department || '-'}`);
            if (claim.reject_reason) {
                console.log(`${chalk.bold('Rejection Reason:')} ${claim.reject_reason}`);
            }
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Update expense claim
    expenseCmd
        .command('update')
        .description('Update an expense claim')
        .argument('<id>', 'Claim ID')
        .option('--title <title>', 'Claim title')
        .option('--description <text>', 'Description')
        .option('--department <dept>', 'Department')
        .option('--items <json>', 'Items JSON array')
        .option('--date <date>', 'Expense date (YYYY-MM-DD)')
        .option('--json', 'Output as JSON')
        .action(async (id, options) => {
        const spinner = ora('Updating claim...').start();
        try {
            const body = {};
            if (options.date)
                body.expense_date = options.date;
            if (options.title)
                body.title = options.title;
            if (options.description)
                body.description = options.description;
            if (options.department)
                body.department = options.department;
            if (options.items) {
                body.items = JSON.parse(options.items).map((item) => ({
                    category_id: item.category_id || undefined,
                    expense_date: item.expense_date,
                    amount: String(item.amount),
                    description: item.description || undefined,
                    invoice_number: item.invoice_number || undefined,
                }));
            }
            const data = await apiFetch(`/api/expense-claims/${id}`, {
                method: 'PUT',
                body: JSON.stringify(body),
            });
            spinner.succeed('Claim updated');
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
            }
            else {
                console.log(chalk.bold('\nUpdated Claim:'));
                const updated = (data.data || data);
                console.log(`ID: ${updated.id}`);
                console.log(`Amount: ${updated.total_amount || '-'}`);
            }
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Delete expense claim
    expenseCmd
        .command('delete')
        .description('Delete an expense claim')
        .argument('<id>', 'Claim ID')
        .action(async (id) => {
        const spinner = ora('Deleting claim...').start();
        try {
            await apiFetch(`/api/expense-claims/${id}`, { method: 'DELETE' });
            spinner.succeed('Claim deleted');
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // List departments
    expenseCmd
        .command('department-list')
        .description('List departments')
        .option('-w, --workspace <id>', 'Workspace ID (required)')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        if (!options.workspace) {
            console.error(chalk.red('Error: --workspace is required'));
            process.exit(1);
        }
        const spinner = ora('Fetching departments...').start();
        try {
            const params = new URLSearchParams();
            params.append('workspace_id', options.workspace);
            const data = await apiFetch(`/api/departments?${params.toString()}`);
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
                return;
            }
            const departments = data.data || [];
            if (departments.length === 0) {
                console.log(chalk.yellow('No departments found'));
                return;
            }
            const rows = [
                ['ID', 'Name', 'Code', 'Manager', 'Employee Count'],
                ...departments.map((d) => [
                    d.id,
                    d.name,
                    d.code || '-',
                    d.manager_name || '-',
                    d.employee_count || '-',
                ]),
            ];
            console.log(chalk.bold('\nDepartments'));
            console.log(table(rows));
            console.log(chalk.gray(`\nTotal: ${departments.length} departments`));
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Create department
    expenseCmd
        .command('department-create')
        .description('Create a department')
        .requiredOption('-w, --workspace <id>', 'Workspace ID')
        .requiredOption('-n, --name <name>', 'Department name')
        .option('--code <code>', 'Department code')
        .option('--manager <id>', 'Manager employee ID')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        const spinner = ora('Creating department...').start();
        try {
            const body = {
                workspace_id: options.workspace,
                name: options.name,
            };
            if (options.code)
                body.code = options.code;
            if (options.manager)
                body.manager_id = options.manager;
            const data = await apiFetch('/api/departments', {
                method: 'POST',
                body: JSON.stringify(body),
            });
            spinner.succeed('Department created');
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
            }
            else {
                const createdDept = (data.data || data);
                console.log(chalk.bold('\nCreated Department:'));
                console.log(`ID: ${createdDept.id}`);
                console.log(`Name: ${createdDept.name}`);
            }
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Update department
    expenseCmd
        .command('department-update')
        .description('Update a department')
        .argument('<id>', 'Department ID')
        .option('-n, --name <name>', 'Department name')
        .option('--code <code>', 'Department code')
        .option('--manager <id>', 'Manager employee ID')
        .option('--json', 'Output as JSON')
        .action(async (id, options) => {
        const spinner = ora('Updating department...').start();
        try {
            const body = {};
            if (options.name)
                body.name = options.name;
            if (options.code)
                body.code = options.code;
            if (options.manager)
                body.manager_id = options.manager;
            const data = await apiFetch(`/api/departments/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(body),
            });
            spinner.succeed('Department updated');
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
            }
            else {
                const updatedDept = (data.data || data);
                console.log(chalk.bold('\nUpdated Department:'));
                console.log(`ID: ${updatedDept.id}`);
                console.log(`Name: ${updatedDept.name}`);
            }
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Delete department
    expenseCmd
        .command('department-delete')
        .description('Delete a department')
        .argument('<id>', 'Department ID')
        .action(async (id) => {
        const spinner = ora('Deleting department...').start();
        try {
            await apiFetch(`/api/departments/${id}`, { method: 'DELETE' });
            spinner.succeed('Department deleted');
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // List projects
    expenseCmd
        .command('project-list')
        .description('List projects')
        .option('-w, --workspace <id>', 'Workspace ID (required)')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        if (!options.workspace) {
            console.error(chalk.red('Error: --workspace is required'));
            process.exit(1);
        }
        const spinner = ora('Fetching projects...').start();
        try {
            const params = new URLSearchParams();
            params.append('workspace_id', options.workspace);
            const data = await apiFetch(`/api/projects?${params.toString()}`);
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
                return;
            }
            const projects = data.data || [];
            if (projects.length === 0) {
                console.log(chalk.yellow('No projects found'));
                return;
            }
            const rows = [
                ['ID', 'Name', 'Code', 'Status', 'Budget', 'Start', 'End'],
                ...projects.map((p) => [
                    p.id,
                    p.name?.substring(0, 20) || '-',
                    p.code || '-',
                    p.status,
                    p.budget || '-',
                    p.start_date || '-',
                    p.end_date || '-',
                ]),
            ];
            console.log(chalk.bold('\nProjects'));
            console.log(table(rows));
            console.log(chalk.gray(`\nTotal: ${projects.length} projects`));
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Create project
    expenseCmd
        .command('project-create')
        .description('Create a project')
        .requiredOption('-w, --workspace <id>', 'Workspace ID')
        .requiredOption('--name <name>', 'Project name')
        .requiredOption('--code <code>', 'Project code')
        .option('--status <status>', 'Status (active|completed|on-hold|cancelled)')
        .option('--budget <amount>', 'Budget amount')
        .option('--start <date>', 'Start date (YYYY-MM-DD)')
        .option('--end <date>', 'End date (YYYY-MM-DD)')
        .option('--desc <text>', 'Description')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        const spinner = ora('Creating project...').start();
        try {
            const body = {
                workspace_id: options.workspace,
                name: options.name,
            };
            if (options.code)
                body.code = options.code;
            if (options.status)
                body.status = options.status;
            if (options.budget)
                body.budget = options.budget;
            if (options.start)
                body.start_date = options.start;
            if (options.end)
                body.end_date = options.end;
            if (options.desc)
                body.description = options.desc;
            const data = await apiFetch('/api/projects', {
                method: 'POST',
                body: JSON.stringify(body),
            });
            spinner.succeed('Project created');
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
            }
            else {
                console.log(chalk.bold('\nCreated Project:'));
                const updatedProj = (data.data || data);
                console.log(`ID: ${updatedProj.id}`);
                console.log(`Name: ${updatedProj.name}`);
                console.log(`Status: ${updatedProj.status}`);
            }
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Update project
    expenseCmd
        .command('project-update')
        .description('Update a project')
        .argument('<id>', 'Project ID')
        .option('--name <name>', 'Project name')
        .option('--code <code>', 'Project code')
        .option('--status <status>', 'Status (active|completed|on-hold|cancelled)')
        .option('--budget <amount>', 'Budget amount')
        .option('--start <date>', 'Start date (YYYY-MM-DD)')
        .option('--end <date>', 'End date (YYYY-MM-DD)')
        .option('--desc <text>', 'Description')
        .option('--json', 'Output as JSON')
        .action(async (id, options) => {
        const spinner = ora('Updating project...').start();
        try {
            const body = {};
            if (options.name)
                body.name = options.name;
            if (options.code)
                body.code = options.code;
            if (options.status)
                body.status = options.status;
            if (options.budget)
                body.budget = options.budget;
            if (options.start)
                body.start_date = options.start;
            if (options.end)
                body.end_date = options.end;
            if (options.desc)
                body.description = options.desc;
            const data = await apiFetch(`/api/projects/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(body),
            });
            spinner.succeed('Project updated');
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
            }
            else {
                const updatedProj = (data.data || data);
                console.log(chalk.bold('\nUpdated Project:'));
                console.log(`ID: ${updatedProj.id}`);
                console.log(`Name: ${updatedProj.name}`);
                console.log(`Status: ${updatedProj.status || '-'}`);
            }
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Delete project
    expenseCmd
        .command('project-delete')
        .description('Delete a project')
        .argument('<id>', 'Project ID')
        .action(async (id) => {
        const spinner = ora('Deleting project...').start();
        try {
            await apiFetch(`/api/projects/${id}`, { method: 'DELETE' });
            spinner.succeed('Project deleted');
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    return expenseCmd;
}
