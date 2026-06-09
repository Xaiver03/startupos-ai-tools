import { Command } from 'commander';
import { table } from 'table';
import chalk from 'chalk';
import ora from 'ora';
import { apiFetch, getAuthHeaders, getApiUrl } from '../lib/api-client.js';
async function formDataFetch(path, formData) {
    const headers = {
        'Authorization': getAuthHeaders().Authorization,
    };
    const wsId = process.env.SSOS_WORKSPACE_ID;
    if (wsId)
        headers['x-workspace-id'] = wsId;
    // Don't set Content-Type — fetch sets it automatically for FormData with boundary
    const response = await fetch(`${getApiUrl()}${path}`, {
        method: 'POST',
        headers,
        body: formData,
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error (${response.status}): ${errorText}`);
    }
    return response.json();
}
export function createBankingCommand() {
    const bankingCmd = new Command('banking')
        .description('Banking operations (accounts, transactions, reconciliation)');
    // List bank accounts
    bankingCmd
        .command('account-list')
        .description('List all bank accounts')
        .option('-w, --workspace <id>', 'Workspace ID (required)')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        if (!options.workspace) {
            console.error(chalk.red('Error: --workspace is required'));
            process.exit(1);
        }
        const spinner = ora('Fetching bank accounts...').start();
        try {
            const params = new URLSearchParams();
            params.append('workspace_id', options.workspace);
            const data = await apiFetch(`/api/bank-accounts?${params.toString()}`);
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
                return;
            }
            const accounts = (Array.isArray(data) ? data : data.data || []);
            if (accounts.length === 0) {
                console.log(chalk.yellow('No bank accounts found'));
                return;
            }
            const rows = [
                ['ID', 'Name', 'Bank', 'Account Number', 'Currency', 'Balance'],
                ...accounts.map((acc) => [
                    acc.id,
                    acc.account_name?.substring(0, 20) || '-',
                    acc.bank_name?.substring(0, 15) || '-',
                    acc.account_number?.substring(0, 12) + '...',
                    acc.currency || 'CNY',
                    acc.balance || '-',
                ]),
            ];
            console.log(chalk.bold('\nBank Accounts'));
            console.log(table(rows));
            console.log(chalk.gray(`\nTotal: ${accounts.length} accounts`));
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Create bank account
    bankingCmd
        .command('account-create')
        .description('Create a new bank account')
        .requiredOption('-w, --workspace <id>', 'Workspace ID')
        .requiredOption('-n, --name <name>', 'Account name')
        .requiredOption('-b, --bank <name>', 'Bank name')
        .requiredOption('--number <number>', 'Account number')
        .option('-c, --currency <currency>', 'Currency', 'CNY')
        .option('--opening-balance <amount>', 'Opening balance')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        const spinner = ora('Creating bank account...').start();
        try {
            const body = {
                workspace_id: options.workspace,
                account_name: options.name,
                bank_name: options.bank,
                account_number: options.number,
                currency: options.currency,
            };
            if (options.openingBalance)
                body.opening_balance = options.openingBalance;
            const data = await apiFetch('/api/bank-accounts', {
                method: 'POST',
                body: JSON.stringify(body),
            });
            spinner.succeed('Bank account created');
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
            }
            else {
                const created = (data.data || data);
                console.log(chalk.bold('\nCreated Account:'));
                console.log(`ID: ${created.id}`);
                console.log(`Name: ${created.account_name}`);
                console.log(`Bank: ${created.bank_name}`);
                console.log(`Number: ${created.account_number}`);
            }
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Get bank account
    bankingCmd
        .command('account-get')
        .description('Get bank account details')
        .argument('<id>', 'Bank account ID')
        .option('--json', 'Output as JSON')
        .action(async (id, options) => {
        const spinner = ora('Fetching bank account...').start();
        try {
            const data = await apiFetch(`/api/bank-accounts/${id}`);
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
                return;
            }
            const acc = (data.data || data);
            console.log(chalk.bold('\nBank Account Details:'));
            console.log(chalk.gray('─'.repeat(50)));
            console.log(`${chalk.bold('ID:')} ${acc.id}`);
            console.log(`${chalk.bold('Name:')} ${acc.account_name}`);
            console.log(`${chalk.bold('Bank:')} ${acc.bank_name}`);
            console.log(`${chalk.bold('Number:')} ${acc.account_number}`);
            console.log(`${chalk.bold('Currency:')} ${acc.currency || 'CNY'}`);
            console.log(`${chalk.bold('Balance:')} ${acc.balance || '-'}`);
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Update bank account
    bankingCmd
        .command('account-update')
        .description('Update a bank account')
        .argument('<id>', 'Bank account ID')
        .option('-n, --name <name>', 'Account name')
        .option('-b, --bank <name>', 'Bank name')
        .option('--json', 'Output as JSON')
        .action(async (id, options) => {
        const spinner = ora('Updating bank account...').start();
        try {
            const body = {};
            if (options.name)
                body.account_name = options.name;
            if (options.bank)
                body.bank_name = options.bank;
            const data = await apiFetch(`/api/bank-accounts/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(body),
            });
            spinner.succeed('Bank account updated');
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
            }
            else {
                const updated = (data.data || data);
                console.log(chalk.bold('\nUpdated Account:'));
                console.log(`ID: ${updated.id}`);
                console.log(`Name: ${updated.account_name}`);
            }
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Delete bank account
    bankingCmd
        .command('account-delete')
        .description('Delete a bank account')
        .argument('<id>', 'Bank account ID')
        .action(async (id) => {
        const spinner = ora('Deleting bank account...').start();
        try {
            await apiFetch(`/api/bank-accounts/${id}`, { method: 'DELETE' });
            spinner.succeed('Bank account deleted');
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // List bank transactions
    bankingCmd
        .command('transaction-list')
        .description('List bank transactions')
        .option('-w, --workspace <id>', 'Workspace ID (required)')
        .option('--account <id>', 'Filter by bank account ID')
        .option('-s, --start <date>', 'Start date (YYYY-MM-DD)')
        .option('-e, --end <date>', 'End date (YYYY-MM-DD)')
        .option('-l, --limit <n>', 'Limit results', '50')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        if (!options.workspace) {
            console.error(chalk.red('Error: --workspace is required'));
            process.exit(1);
        }
        const spinner = ora('Fetching transactions...').start();
        try {
            const params = new URLSearchParams();
            params.append('workspace_id', options.workspace);
            if (options.account)
                params.append('bank_account_id', options.account);
            if (options.start)
                params.append('start_date', options.start);
            if (options.end)
                params.append('end_date', options.end);
            params.append('limit', options.limit);
            const data = await apiFetch(`/api/bank-transactions?${params.toString()}`);
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
                return;
            }
            const transactions = (Array.isArray(data) ? data : data.data || []);
            if (transactions.length === 0) {
                console.log(chalk.yellow('No transactions found'));
                return;
            }
            const rows = [
                ['Date', 'Description', 'Amount', 'Balance', 'Counterparty'],
                ...transactions.map((t) => [
                    t.transaction_date,
                    t.description?.substring(0, 25) || '-',
                    t.amount,
                    t.balance || '-',
                    t.counterparty?.substring(0, 20) || '-',
                ]),
            ];
            console.log(chalk.bold('\nBank Transactions'));
            console.log(table(rows));
            console.log(chalk.gray(`\nTotal: ${transactions.length} transactions`));
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Get bank transaction
    bankingCmd
        .command('transaction-get')
        .description('Get bank transaction details')
        .argument('<id>', 'Transaction ID')
        .option('--json', 'Output as JSON')
        .action(async (id, options) => {
        const spinner = ora('Fetching transaction...').start();
        try {
            const data = await apiFetch(`/api/bank-transactions/${id}`);
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
                return;
            }
            const t = (data.data || data);
            console.log(chalk.bold('\nTransaction Details:'));
            console.log(chalk.gray('─'.repeat(50)));
            console.log(`${chalk.bold('ID:')} ${t.id}`);
            console.log(`${chalk.bold('Date:')} ${t.transaction_date}`);
            console.log(`${chalk.bold('Amount:')} ${t.amount}`);
            console.log(`${chalk.bold('Description:')} ${t.description || '-'}`);
            console.log(`${chalk.bold('Counterparty:')} ${t.counterparty || '-'}`);
            console.log(`${chalk.bold('Balance:')} ${t.balance || '-'}`);
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Import bank transactions
    bankingCmd
        .command('transaction-import')
        .description('Import bank transactions from CSV statement')
        .requiredOption('-w, --workspace <id>', 'Workspace ID')
        .requiredOption('--account <id>', 'Bank account ID')
        .requiredOption('--file <path>', 'CSV file path')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        const spinner = ora('Importing transactions...').start();
        try {
            const { readFile } = await import('fs/promises');
            const csvContent = await readFile(options.file, 'utf-8');
            // Backend expects multipart/form-data with bank_account_id + file (CSV)
            const formData = new FormData();
            formData.append('bank_account_id', options.account);
            formData.append('file', new Blob([csvContent], { type: 'text/csv' }), 'transactions.csv');
            const result = await formDataFetch('/api/bank-transactions/import', formData);
            spinner.succeed('Transactions imported');
            if (options.json) {
                console.log(JSON.stringify(result, null, 2));
            }
            else {
                console.log(chalk.bold('\nImport Result:'));
                console.log(`Imported: ${result.imported ?? 0}`);
                console.log(`Skipped: ${result.skipped ?? 0}`);
                if (result.errors) {
                    const errs = result.errors;
                    console.log(`Errors: ${errs.length}`);
                    errs.forEach((e) => console.log(chalk.yellow(`  - ${e}`)));
                }
            }
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // List reconciliation records
    bankingCmd
        .command('reconciliation-list')
        .description('List bank reconciliation records')
        .option('-w, --workspace <id>', 'Workspace ID (required)')
        .option('--account <id>', 'Filter by bank account ID')
        .option('--status <status>', 'Filter by status (in_progress|completed|failed)')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        if (!options.workspace) {
            console.error(chalk.red('Error: --workspace is required'));
            process.exit(1);
        }
        const spinner = ora('Fetching reconciliation records...').start();
        try {
            const params = new URLSearchParams();
            params.append('workspace_id', options.workspace);
            if (options.account)
                params.append('bank_account_id', options.account);
            if (options.status)
                params.append('status', options.status);
            const data = await apiFetch(`/api/reconciliation-records?${params.toString()}`);
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
                return;
            }
            const records = (Array.isArray(data) ? data : data.data || []);
            if (records.length === 0) {
                console.log(chalk.yellow('No reconciliation records found'));
                return;
            }
            const rows = [
                ['Date', 'Bank Transaction', 'Journal Entry', 'Status', 'Difference'],
                ...records.map((r) => [
                    r.reconciliation_date,
                    r.bank_transaction_id,
                    r.journal_entry_id,
                    r.status,
                    r.difference || '-',
                ]),
            ];
            console.log(chalk.bold('\nReconciliation Records'));
            console.log(table(rows));
            console.log(chalk.gray(`\nTotal: ${records.length} records`));
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Get reconciliation record
    bankingCmd
        .command('reconciliation-get')
        .description('Get reconciliation record details')
        .argument('<id>', 'Reconciliation ID')
        .option('--json', 'Output as JSON')
        .action(async (id, options) => {
        const spinner = ora('Fetching reconciliation...').start();
        try {
            const data = await apiFetch(`/api/reconciliation-records/${id}`);
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
                return;
            }
            const r = (data.data || data);
            console.log(chalk.bold('\nReconciliation Details:'));
            console.log(chalk.gray('─'.repeat(50)));
            console.log(`${chalk.bold('ID:')} ${r.id}`);
            console.log(`${chalk.bold('Date:')} ${r.reconciliation_date}`);
            console.log(`${chalk.bold('Bank Transaction:')} ${r.bank_transaction_id || '-'}`);
            console.log(`${chalk.bold('Journal Entry:')} ${r.journal_entry_id || '-'}`);
            console.log(`${chalk.bold('Status:')} ${r.status}`);
            console.log(`${chalk.bold('Difference:')} ${r.difference || '0'}`);
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Update reconciliation record
    bankingCmd
        .command('reconciliation-update')
        .description('Update a reconciliation record')
        .argument('<id>', 'Reconciliation ID')
        .option('--status <status>', 'Status (in_progress|completed|failed)')
        .option('--json', 'Output as JSON')
        .action(async (id, options) => {
        const spinner = ora('Updating reconciliation...').start();
        try {
            const body = {};
            if (options.status)
                body.status = options.status;
            const data = await apiFetch(`/api/reconciliation-records/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(body),
            });
            spinner.succeed('Reconciliation updated');
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
            }
            else {
                const updated = (data.data || data);
                console.log(chalk.bold('\nUpdated Reconciliation:'));
                console.log(`ID: ${updated.id}`);
                console.log(`Status: ${updated.status}`);
            }
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Create reconciliation record
    bankingCmd
        .command('reconciliation-create')
        .description('Create a bank reconciliation record')
        .requiredOption('-w, --workspace <id>', 'Workspace ID')
        .requiredOption('--bank-account <id>', 'Bank account ID')
        .requiredOption('--period-start <date>', 'Period start date (YYYY-MM-DD)')
        .requiredOption('--period-end <date>', 'Period end date (YYYY-MM-DD)')
        .requiredOption('--bank-balance <amount>', 'Bank statement balance')
        .requiredOption('--book-balance <amount>', 'Book balance')
        .option('--notes <text>', 'Notes')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        const spinner = ora('Creating reconciliation...').start();
        try {
            const body = {
                bank_account_id: options.bankAccount,
                period_start: options.periodStart,
                period_end: options.periodEnd,
                bank_statement_balance: parseFloat(options.bankBalance),
                book_balance: parseFloat(options.bookBalance),
            };
            if (options.workspace)
                body.workspace_id = options.workspace;
            if (options.notes)
                body.notes = options.notes;
            const data = await apiFetch('/api/reconciliation-records', {
                method: 'POST',
                body: JSON.stringify(body),
            });
            spinner.succeed('Reconciliation created');
            if (options.json) {
                console.log(JSON.stringify(data, null, 2));
            }
            else {
                console.log(chalk.bold('\nCreated Reconciliation:'));
                console.log(`ID: ${data.id}`);
                console.log(`Bank Balance: ${data.bank_balance}`);
                console.log(`Book Balance: ${data.book_balance}`);
                console.log(`Difference: ${data.difference}`);
            }
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Delete reconciliation record
    bankingCmd
        .command('reconciliation-delete')
        .description('Delete a bank reconciliation record')
        .argument('<id>', 'Reconciliation ID')
        .action(async (id) => {
        const spinner = ora('Deleting reconciliation...').start();
        try {
            await apiFetch(`/api/reconciliation-records/${id}`, { method: 'DELETE' });
            spinner.succeed('Reconciliation deleted');
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    return bankingCmd;
}
