import { Command } from 'commander';
import { table } from 'table';
import chalk from 'chalk';
import { apiReport } from '../lib/api-helpers.js';
export function createAccountingCommand() {
    const accountingCmd = new Command('accounting')
        .description('会计报表生成 | 数据操作用 crud 命令');
    // Trial Balance
    accountingCmd
        .command('trial-balance')
        .description('Generate trial balance report')
        .option('-w, --workspace <id>', 'Workspace ID (required)')
        .option('-s, --start <date>', 'Start date (YYYY-MM-DD)')
        .option('-e, --end <date>', 'End date (YYYY-MM-DD)')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        const params = { workspace_id: options.workspace };
        if (options.start)
            params.start_date = options.start;
        if (options.end)
            params.end_date = options.end;
        await apiReport('/api/reports/trial-balance', params, 'Generating trial balance...', ['workspace_id'], {
            json: options.json,
            onSuccess: (data) => {
                console.log(chalk.bold('\n试算平衡表'));
                console.log(chalk.gray('─'.repeat(80)));
                const items = (data.data || data.items || []);
                if (items.length === 0) {
                    console.log(chalk.yellow('No data'));
                    return;
                }
                const rows = [
                    ['Account Code', 'Account Name', 'Debit', 'Credit', 'Balance'],
                    ...items.map((item) => [
                        item.account_code || '-',
                        item.account_name || '-',
                        String(item.debit_amount || '0.00'),
                        String(item.credit_amount || '0.00'),
                        String(item.balance || '0.00'),
                    ]),
                ];
                console.log(table(rows));
            },
        });
    });
    // Income Statement
    accountingCmd
        .command('income-statement')
        .description('Generate income statement (profit & loss)')
        .option('-w, --workspace <id>', 'Workspace ID (required)')
        .option('-s, --start <date>', 'Start date (YYYY-MM-DD)')
        .option('-e, --end <date>', 'End date (YYYY-MM-DD)')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        const params = { workspace_id: options.workspace };
        if (options.start)
            params.start_date = options.start;
        if (options.end)
            params.end_date = options.end;
        await apiReport('/api/reports/income-statement', params, 'Generating income statement...', ['workspace_id'], {
            json: options.json,
            onSuccess: (data) => {
                console.log(chalk.bold('\n利润表'));
                console.log(chalk.gray('─'.repeat(80)));
                console.log(JSON.stringify(data, null, 2));
            },
        });
    });
    // General Ledger
    accountingCmd
        .command('general-ledger')
        .description('Generate general ledger')
        .option('-w, --workspace <id>', 'Workspace ID (required)')
        .option('-a, --account <id>', 'Account ID (required)')
        .option('-s, --start <date>', 'Start date')
        .option('-e, --end <date>', 'End date')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        const params = {
            workspace_id: options.workspace,
            account_id: options.account,
        };
        if (options.start)
            params.start_date = options.start;
        if (options.end)
            params.end_date = options.end;
        await apiReport('/api/general-ledger/accounts', params, 'Generating general ledger...', ['workspace_id', 'account_id'], {
            json: options.json,
            onSuccess: (data) => {
                console.log(chalk.bold('\n总账'));
                console.log(chalk.gray('─'.repeat(80)));
                console.log(JSON.stringify(data, null, 2));
            },
        });
    });
    // Bank Journal
    accountingCmd
        .command('bank-journal')
        .description('Generate bank journal')
        .option('-w, --workspace <id>', 'Workspace ID (required)')
        .option('--account <id>', 'Bank account ID')
        .option('-s, --start <date>', 'Start date')
        .option('-e, --end <date>', 'End date')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        const params = { workspace_id: options.workspace };
        if (options.account)
            params.account_id = options.account;
        if (options.start)
            params.start_date = options.start;
        if (options.end)
            params.end_date = options.end;
        await apiReport('/api/reports/bank-journal', params, 'Generating bank journal...', ['workspace_id'], {
            json: options.json,
            onSuccess: (data) => {
                console.log(chalk.bold('\n银行日记账'));
                console.log(chalk.gray('─'.repeat(80)));
                console.log(JSON.stringify(data, null, 2));
            },
        });
    });
    // Cash Journal
    accountingCmd
        .command('cash-journal')
        .description('Generate cash journal')
        .option('-w, --workspace <id>', 'Workspace ID (required)')
        .option('-s, --start <date>', 'Start date')
        .option('-e, --end <date>', 'End date')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        const params = { workspace_id: options.workspace };
        if (options.start)
            params.start_date = options.start;
        if (options.end)
            params.end_date = options.end;
        await apiReport('/api/reports/cash-journal', params, 'Generating cash journal...', ['workspace_id'], {
            json: options.json,
            onSuccess: (data) => {
                console.log(chalk.bold('\n现金日记账'));
                console.log(chalk.gray('─'.repeat(80)));
                console.log(JSON.stringify(data, null, 2));
            },
        });
    });
    // Account Balances
    accountingCmd
        .command('account-balances')
        .description('Generate account balances report')
        .option('-w, --workspace <id>', 'Workspace ID (required)')
        .option('-p, --period <id>', 'Period ID')
        .option('-s, --start <date>', 'Start date')
        .option('-e, --end <date>', 'End date')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        const params = { workspace_id: options.workspace };
        if (options.period)
            params.period_id = options.period;
        if (options.start)
            params.start_date = options.start;
        if (options.end)
            params.end_date = options.end;
        await apiReport('/api/general-ledger/account-balances', params, 'Generating account balances...', ['workspace_id'], {
            json: options.json,
            onSuccess: (data) => {
                console.log(chalk.bold('\n科目余额表'));
                console.log(chalk.gray('─'.repeat(80)));
                console.log(JSON.stringify(data, null, 2));
            },
        });
    });
    // Single Account Balance
    accountingCmd
        .command('account-balance')
        .description('Get balance for a single account')
        .argument('<account-code>', 'Account code (e.g., 1001)')
        .option('-w, --workspace <id>', 'Workspace ID (required)')
        .option('-s, --start <date>', 'Start date')
        .option('-e, --end <date>', 'End date')
        .option('--json', 'Output as JSON')
        .action(async (accountCode, options) => {
        const params = {
            workspace_id: options.workspace,
            account_code: accountCode,
        };
        if (options.start)
            params.start_date = options.start;
        if (options.end)
            params.end_date = options.end;
        await apiReport('/api/accounts/balance', params, 'Fetching account balance...', ['workspace_id'], {
            json: options.json,
            onSuccess: (data) => {
                const balance = (data.data || data);
                console.log(chalk.bold('\n账户余额'));
                console.log(chalk.gray('─'.repeat(60)));
                console.log(`${chalk.bold('账户代码:')} ${accountCode}`);
                console.log(`${chalk.bold('账户名称:')} ${balance.account_name || '-'}`);
                console.log(`${chalk.bold('借方金额:')} ${String(balance.debit_amount || '0.00')}`);
                console.log(`${chalk.bold('贷方金额:')} ${String(balance.credit_amount || '0.00')}`);
                console.log(`${chalk.bold('余额:')} ${String(balance.balance || '0.00')}`);
            },
        });
    });
    return accountingCmd;
}
