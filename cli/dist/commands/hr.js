import { Command } from 'commander';
import { table } from 'table';
import chalk from 'chalk';
import ora from 'ora';
import { apiFetch } from '../lib/api-client.js';
export function createHRCommand() {
    const hrCmd = new Command('hr')
        .description('HR operations (employees, payroll, labor contracts)');
    // List employees
    hrCmd
        .command('employee-list')
        .description('List all employees')
        .option('-w, --workspace <id>', 'Workspace ID (required)')
        .option('--status <status>', 'Filter by status (active|terminated)')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        if (!options.workspace) {
            console.error(chalk.red('Error: --workspace is required'));
            process.exit(1);
        }
        const spinner = ora('Fetching employees...').start();
        try {
            const params = new URLSearchParams();
            params.append('workspace_id', options.workspace);
            if (options.status)
                params.append('status', options.status);
            const data = await apiFetch(`/api/employees?${params.toString()}`);
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(data, null, 2));
                return;
            }
            const employees = (data.employees || data.data || []);
            if (employees.length === 0) {
                console.log(chalk.yellow('No employees found'));
                return;
            }
            const rows = [
                ['ID', 'Name', 'Department', 'Position', 'Hire Date', 'Status'],
                ...employees.map((emp) => [
                    emp.id,
                    emp.name,
                    emp.department || '-',
                    emp.position || '-',
                    emp.hire_date,
                    emp.status,
                ]),
            ];
            console.log(chalk.bold('\nEmployees'));
            console.log(table(rows));
            console.log(chalk.gray(`\nTotal: ${employees.length} employees`));
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Get employee
    hrCmd
        .command('employee-get')
        .description('Get employee details')
        .argument('<id>', 'Employee ID')
        .option('--json', 'Output as JSON')
        .action(async (id, options) => {
        const spinner = ora('Fetching employee...').start();
        try {
            const data = await apiFetch(`/api/employees/${id}`);
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
                return;
            }
            const emp = (data.data || data);
            console.log(chalk.bold('\nEmployee Details:'));
            console.log(chalk.gray('─'.repeat(50)));
            console.log(`${chalk.bold('ID:')} ${emp.id}`);
            console.log(`${chalk.bold('Name:')} ${emp.name}`);
            console.log(`${chalk.bold('ID Card:')} ${emp.id_card_no || '-'}`);
            console.log(`${chalk.bold('Department:')} ${emp.department || '-'}`);
            console.log(`${chalk.bold('Position:')} ${emp.position || '-'}`);
            console.log(`${chalk.bold('Hire Date:')} ${emp.hire_date}`);
            console.log(`${chalk.bold('Status:')} ${emp.status}`);
            console.log(`${chalk.bold('Monthly Special Deduction:')} ${emp.monthly_special_deduction || '-'}`);
            if (emp.leave_date) {
                console.log(`${chalk.bold('Leave Date:')} ${emp.leave_date}`);
            }
            if (emp.remark) {
                console.log(`${chalk.bold('Remark:')} ${emp.remark}`);
            }
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Create employee
    hrCmd
        .command('employee-create')
        .description('Create a new employee')
        .requiredOption('-w, --workspace <id>', 'Workspace ID')
        .requiredOption('-n, --name <name>', 'Employee name')
        .requiredOption('--hire-date <date>', 'Hire date (YYYY-MM-DD)')
        .option('--id-card <number>', 'ID card number')
        .option('--department <name>', 'Department')
        .option('--position <title>', 'Position')
        .option('--deduction <amount>', 'Monthly special deduction')
        .option('--status <status>', 'Status (active|terminated)', 'active')
        .option('--remark <text>', 'Remark')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        const spinner = ora('Creating employee...').start();
        try {
            const body = {
                workspace_id: options.workspace,
                name: options.name,
                hire_date: options.hireDate,
            };
            if (options.idCard)
                body.id_card_no = options.idCard;
            if (options.department)
                body.department = options.department;
            if (options.position)
                body.position = options.position;
            if (options.deduction)
                body.monthly_special_deduction = options.deduction;
            if (options.status)
                body.status = options.status;
            if (options.remark)
                body.remark = options.remark;
            const data = await apiFetch('/api/employees', {
                method: 'POST',
                body: JSON.stringify(body),
            });
            spinner.succeed('Employee created');
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
            }
            else {
                const created = (data.data || data);
                console.log(chalk.bold('\nCreated Employee:'));
                console.log(`ID: ${created.id}`);
                console.log(`Name: ${created.name}`);
                console.log(`Department: ${created.department || '-'}`);
                console.log(`Hire Date: ${created.hire_date}`);
            }
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Update employee
    hrCmd
        .command('employee-update')
        .description('Update employee information')
        .argument('<id>', 'Employee ID')
        .option('-n, --name <name>', 'Name')
        .option('--department <name>', 'Department')
        .option('--position <title>', 'Position')
        .option('--leave-date <date>', 'Leave date (YYYY-MM-DD)')
        .option('--status <status>', 'Status (active|terminated)')
        .option('--remark <text>', 'Remark')
        .option('--json', 'Output as JSON')
        .action(async (id, options) => {
        const spinner = ora('Updating employee...').start();
        try {
            const body = {};
            if (options.name)
                body.name = options.name;
            if (options.department)
                body.department = options.department;
            if (options.position)
                body.position = options.position;
            if (options.leaveDate)
                body.leave_date = options.leaveDate;
            if (options.status)
                body.status = options.status;
            if (options.remark)
                body.remark = options.remark;
            const data = await apiFetch(`/api/employees/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(body),
            });
            spinner.succeed('Employee updated');
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
            }
            else {
                const updated = (data.data || data);
                console.log(chalk.bold('\nUpdated Employee:'));
                console.log(`ID: ${updated.id}`);
                console.log(`Name: ${updated.name}`);
            }
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Delete employee
    hrCmd
        .command('employee-delete')
        .description('Delete an employee')
        .argument('<id>', 'Employee ID')
        .action(async (id) => {
        const spinner = ora('Deleting employee...').start();
        try {
            await apiFetch(`/api/employees/${id}`, { method: 'DELETE' });
            spinner.succeed('Employee deleted');
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // List payroll records
    hrCmd
        .command('payroll-list')
        .description('List payroll records')
        .option('-w, --workspace <id>', 'Workspace ID (required)')
        .option('--employee <id>', 'Filter by employee ID')
        .option('--period <period>', 'Filter by period (YYYY-MM)')
        .option('--status <status>', 'Filter by status (draft|posted)')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        if (!options.workspace) {
            console.error(chalk.red('Error: --workspace is required'));
            process.exit(1);
        }
        const spinner = ora('Fetching payroll records...').start();
        try {
            const params = new URLSearchParams();
            params.append('workspace_id', options.workspace);
            if (options.employee)
                params.append('employee_id', options.employee);
            if (options.period)
                params.append('period', options.period);
            if (options.status)
                params.append('status', options.status);
            const data = await apiFetch(`/api/payroll-records?${params.toString()}`);
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
                return;
            }
            const records = data.data || [];
            if (records.length === 0) {
                console.log(chalk.yellow('No payroll records found'));
                return;
            }
            const rows = [
                ['Period', 'Employee', 'Gross', 'Social', 'Housing', 'Special', 'Other', 'Net', 'Status'],
                ...records.map((r) => [
                    r.period,
                    r.employee_name?.substring(0, 15) || '-',
                    r.gross_salary,
                    r.social_insurance,
                    r.housing_fund,
                    r.special_deduction,
                    r.other_deduction,
                    r.net_salary || '-',
                    r.status,
                ]),
            ];
            console.log(chalk.bold('\nPayroll Records'));
            console.log(table(rows));
            console.log(chalk.gray(`\nTotal: ${records.length} records`));
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Create payroll record
    hrCmd
        .command('payroll-create')
        .description('Create payroll record')
        .requiredOption('-w, --workspace <id>', 'Workspace ID')
        .requiredOption('--employee <id>', 'Employee ID')
        .requiredOption('--period <period>', 'Payroll period (YYYY-MM)')
        .requiredOption('--gross <amount>', 'Gross salary')
        .option('--social <amount>', 'Social insurance', '0')
        .option('--housing <amount>', 'Housing fund', '0')
        .option('--special <amount>', 'Special deductions', '0')
        .option('--other <amount>', 'Other deductions', '0')
        .option('--remark <text>', 'Remark')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        const spinner = ora('Creating payroll record...').start();
        try {
            const body = {
                workspace_id: options.workspace,
                employee_id: options.employee,
                period: options.period,
                gross_salary: options.gross,
                social_insurance: options.social,
                housing_fund: options.housing,
                special_deduction: options.special,
                other_deduction: options.other,
            };
            if (options.remark)
                body.remark = options.remark;
            const data = await apiFetch('/api/payroll-records', {
                method: 'POST',
                body: JSON.stringify(body),
            });
            spinner.succeed('Payroll record created');
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
            }
            else {
                const created = (data.data || data);
                console.log(chalk.bold('\nCreated Payroll Record:'));
                console.log(`ID: ${created.id}`);
                console.log(`Period: ${created.period}`);
                console.log(`Gross: ${created.gross_salary}`);
                console.log(`Net: ${created.net_salary || '-'}`);
            }
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Post payroll
    hrCmd
        .command('payroll-post')
        .description('Post payroll to journal entries')
        .requiredOption('-w, --workspace <id>', 'Workspace ID')
        .requiredOption('--period <period>', 'Payroll period (YYYY-MM)')
        .requiredOption('--ids <ids>', 'Comma-separated payroll record IDs to post')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        const spinner = ora('Posting payroll...').start();
        try {
            const payrollIds = options.ids.split(',').map((s) => s.trim()).filter(Boolean);
            if (payrollIds.length === 0) {
                spinner.fail('At least one payroll ID is required');
                process.exit(1);
            }
            const body = {
                period: options.period,
                payroll_ids: payrollIds,
            };
            const data = await apiFetch('/api/payroll-records/post', {
                method: 'POST',
                body: JSON.stringify(body),
            });
            spinner.succeed('Payroll posted');
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
            }
            else {
                const posted = (data.data || data);
                console.log(chalk.bold('\nPosted Payroll:'));
                console.log(`Journal Entry ID: ${posted.journal_entry_id}`);
                console.log(`Period: ${options.period}`);
                console.log(`Payroll IDs: ${payrollIds.join(', ')}`);
            }
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Get payroll record
    hrCmd
        .command('payroll-get')
        .description('Get payroll record details')
        .argument('<id>', 'Payroll record ID')
        .option('--json', 'Output as JSON')
        .action(async (id, options) => {
        const spinner = ora('Fetching payroll record...').start();
        try {
            const data = await apiFetch(`/api/payroll-records/${id}`);
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
                return;
            }
            const p = (data.data || data);
            console.log(chalk.bold('\nPayroll Record Details:'));
            console.log(chalk.gray('─'.repeat(50)));
            console.log(`${chalk.bold('ID:')} ${p.id}`);
            console.log(`${chalk.bold('Employee:')} ${p.employee_name || '-'}`);
            console.log(`${chalk.bold('Period:')} ${p.period}`);
            console.log(`${chalk.bold('Gross:')} ${p.gross_salary}`);
            console.log(`${chalk.bold('Social Insurance:')} ${p.social_insurance || '0'}`);
            console.log(`${chalk.bold('Housing Fund:')} ${p.housing_fund || '0'}`);
            console.log(`${chalk.bold('Special Deduction:')} ${p.special_deduction || '0'}`);
            console.log(`${chalk.bold('Other Deduction:')} ${p.other_deduction || '0'}`);
            console.log(`${chalk.bold('Net Salary:')} ${p.net_salary || '-'}`);
            console.log(`${chalk.bold('Status:')} ${p.status}`);
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Update payroll record
    hrCmd
        .command('payroll-update')
        .description('Update a payroll record')
        .argument('<id>', 'Payroll record ID')
        .option('--gross <amount>', 'Gross salary')
        .option('--social <amount>', 'Social insurance')
        .option('--housing <amount>', 'Housing fund')
        .option('--special <amount>', 'Special deductions')
        .option('--other <amount>', 'Other deductions')
        .option('--remark <text>', 'Remark')
        .option('--json', 'Output as JSON')
        .action(async (id, options) => {
        const spinner = ora('Updating payroll...').start();
        try {
            const body = {};
            if (options.gross)
                body.gross_salary = options.gross;
            if (options.social)
                body.social_insurance = options.social;
            if (options.housing)
                body.housing_fund = options.housing;
            if (options.special)
                body.special_deduction = options.special;
            if (options.other)
                body.other_deduction = options.other;
            if (options.remark)
                body.remark = options.remark;
            const data = await apiFetch(`/api/payroll-records/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(body),
            });
            spinner.succeed('Payroll updated');
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
            }
            else {
                const updated = (data.data || data);
                console.log(chalk.bold('\nUpdated Payroll:'));
                console.log(`ID: ${updated.id}`);
                console.log(`Period: ${updated.period}`);
            }
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Delete payroll record
    hrCmd
        .command('payroll-delete')
        .description('Delete a payroll record')
        .argument('<id>', 'Payroll record ID')
        .action(async (id) => {
        const spinner = ora('Deleting payroll...').start();
        try {
            await apiFetch(`/api/payroll-records/${id}`, { method: 'DELETE' });
            spinner.succeed('Payroll record deleted');
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // List labor contracts
    hrCmd
        .command('contract-list')
        .description('List labor contracts')
        .option('-w, --workspace <id>', 'Workspace ID (required)')
        .option('--employee <id>', 'Filter by employee ID')
        .option('--status <status>', 'Filter by status')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        if (!options.workspace) {
            console.error(chalk.red('Error: --workspace is required'));
            process.exit(1);
        }
        const spinner = ora('Fetching labor contracts...').start();
        try {
            const params = new URLSearchParams();
            params.append('workspace_id', options.workspace);
            if (options.employee)
                params.append('employee_id', options.employee);
            if (options.status)
                params.append('status', options.status);
            const data = await apiFetch(`/api/labor-contracts?${params.toString()}`);
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
                return;
            }
            const contracts = (data.items || data.data || []);
            if (contracts.length === 0) {
                console.log(chalk.yellow('No labor contracts found'));
                return;
            }
            const rows = [
                ['ID', 'Employee', 'Type', 'Start Date', 'End Date', 'Salary', 'Status'],
                ...contracts.map((c) => [
                    c.id,
                    c.employee_name?.substring(0, 15) || '-',
                    c.contract_type || '-',
                    c.start_date,
                    c.end_date || 'Indefinite',
                    c.monthly_salary || c.base_salary || '-',
                    c.status,
                ]),
            ];
            console.log(chalk.bold('\nLabor Contracts'));
            console.log(table(rows));
            console.log(chalk.gray(`\nTotal: ${contracts.length} contracts`));
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Create labor contract
    hrCmd
        .command("contract-create")
        .description("Create a labor contract")
        .requiredOption("-w, --workspace <id>", "Workspace ID")
        .requiredOption("--employee <id>", "Employee ID")
        .requiredOption("--employer <name>", "Employer/company name")
        .requiredOption("--emp-name <name>", "Employee name")
        .requiredOption("--position <title>", "Job position")
        .requiredOption("--type <type>", "Contract type (fixed_term|open_term|project_based)")
        .requiredOption("--salary <amount>", "Base salary")
        .option("--start <date>", "Start date (YYYY-MM-DD)")
        .option("--end <date>", "End date (YYYY-MM-DD)")
        .option("--probation <months>", "Probation months (0-6)")
        .option("--location <addr>", "Work location")
        .option("--remark <text>", "Remark")
        .option("--json", "Output as JSON")
        .action(async (options) => {
        const spinner = ora("Creating labor contract...").start();
        try {
            const body = {
                employee_id: options.employee,
                employee_name: options.empName,
                employer_name: options.employer,
                position: options.position,
                contract_type: options.type,
                base_salary: parseFloat(options.salary),
            };
            if (options.workspace)
                body.workspace_id = options.workspace;
            if (options.start)
                body.start_date = options.start;
            if (options.end)
                body.end_date = options.end;
            if (options.probation)
                body.probation_months = parseInt(options.probation);
            if (options.location)
                body.work_location = options.location;
            const data = await apiFetch("/api/labor-contracts", {
                method: "POST",
                body: JSON.stringify(body),
            });
            spinner.succeed("Labor contract created");
            if (options.json) {
                console.log(JSON.stringify(data, null, 2));
            }
            else {
                console.log(chalk.bold("\nCreated Labor Contract:"));
                console.log(`ID: ${data.id}`);
            }
        }
        catch (error) {
            spinner.fail("Failed");
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Get labor contract
    hrCmd
        .command('contract-get')
        .description('Get labor contract details')
        .argument('<id>', 'Contract ID')
        .option('--json', 'Output as JSON')
        .action(async (id, options) => {
        const spinner = ora('Fetching contract...').start();
        try {
            const data = await apiFetch(`/api/labor-contracts/${id}`);
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
                return;
            }
            const contract = (data.data || data);
            console.log(chalk.bold('\nLabor Contract Details:'));
            console.log(chalk.gray('─'.repeat(50)));
            console.log(`${chalk.bold('ID:')} ${contract.id}`);
            console.log(`${chalk.bold('Employee:')} ${contract.employee_name || '-'}`);
            console.log(`${chalk.bold('Type:')} ${contract.contract_type}`);
            console.log(`${chalk.bold('Start:')} ${contract.start_date}`);
            console.log(`${chalk.bold('End:')} ${contract.end_date || 'Indefinite'}`);
            console.log(`${chalk.bold('Salary:')} ${contract.base_salary || '-'}`);
            console.log(`${chalk.bold('Probation:')} ${contract.probation_months || '-'} months`);
            console.log(`${chalk.bold('Status:')} ${contract.status}`);
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Update labor contract
    hrCmd
        .command('contract-update')
        .description('Update a labor contract')
        .argument('<id>', 'Contract ID')
        .option('--type <type>', 'Contract type (fixed_term|unlimited|project_based)')
        .option('--start <date>', 'Start date (YYYY-MM-DD)')
        .option('--end <date>', 'End date (YYYY-MM-DD)')
        .option('--probation <months>', 'Probation period in months')
        .option('--salary <amount>', 'Base salary')
        .option('--status <status>', 'Status')
        .option('--remark <text>', 'Remark')
        .option('--json', 'Output as JSON')
        .action(async (id, options) => {
        const spinner = ora('Updating contract...').start();
        try {
            const body = {};
            if (options.type)
                body.contract_type = options.type;
            if (options.start)
                body.start_date = options.start;
            if (options.end)
                body.end_date = options.end;
            if (options.probation)
                body.probation_months = parseInt(options.probation);
            if (options.salary)
                body.base_salary = options.salary;
            if (options.status)
                body.status = options.status;
            if (options.remark)
                body.remark = options.remark;
            const data = await apiFetch(`/api/labor-contracts/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(body),
            });
            spinner.succeed('Contract updated');
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
            }
            else {
                const updated = (data.data || data);
                console.log(chalk.bold('\nUpdated Contract:'));
                console.log(`ID: ${updated.id}`);
                console.log(`Employee: ${updated.employee_name}`);
            }
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Delete labor contract
    hrCmd
        .command('contract-delete')
        .description('Delete a labor contract')
        .argument('<id>', 'Contract ID')
        .action(async (id) => {
        const spinner = ora('Deleting contract...').start();
        try {
            await apiFetch(`/api/labor-contracts/${id}`, { method: 'DELETE' });
            spinner.succeed('Contract deleted');
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    return hrCmd;
}
