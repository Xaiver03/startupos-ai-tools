import { Command } from 'commander';
import chalk from 'chalk';
import { apiGet, apiPost } from '../lib/api-helpers.js';

/**
 * Period module - 会计期间业务逻辑
 *
 * 本模块提供 3 个期间管理命令。
 * 期间数据操作请使用 'crud' 命令：
 *   crud list accounting-periods
 *   crud create accounting-periods
 *   crud update accounting-periods <id>
 */

interface ClosedPeriod {
  status?: string;
}

interface OpeningBalance {
  account_code?: string;
  account_name?: string;
  debit_balance?: number | string;
  credit_balance?: number | string;
  period_start_date?: string;
}

interface OpeningBalancesResponse {
  data?: OpeningBalance[];
}

export function createPeriodCommand() {
  const periodCmd = new Command('period')
    .description('会计期间业务逻辑 | 数据操作用 crud 命令');

  // Close period
  periodCmd
    .command('close')
    .description('Close an accounting period')
    .requiredOption('-w, --workspace <id>', 'Workspace ID')
    .requiredOption('--period <id>', 'Period ID to close')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      await apiPost<{ data: ClosedPeriod }>(
        '/api/period-end/close',
        {
          workspace_id: options.workspace,
          period_id: options.period,
        },
        'Closing period...',
        {
          json: options.json,
          onSuccess: (data) => {
            const closedData = (data.data || data) as ClosedPeriod;
            console.log(chalk.bold('\n期末关账完成:'));
            console.log(`期间 ID: ${options.period}`);
            console.log(`状态: ${closedData.status || 'closed'}`);
          },
        }
      );
    });

  // Get opening balances
  periodCmd
    .command('opening-balances')
    .description('Get opening balances report')
    .option('-w, --workspace <id>', 'Workspace ID (required)')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      if (!options.workspace) {
        console.error(chalk.red('Error: --workspace is required'));
        process.exit(1);
      }

      await apiGet<OpeningBalancesResponse>(
        '/api/opening-balances',
        { workspace_id: options.workspace },
        'Fetching opening balances...',
        {
          json: options.json,
          onSuccess: (data) => {
            const balances = (data.data as OpeningBalance[]) || [];
            if (balances.length === 0) {
              console.log(chalk.yellow('No opening balances found'));
              return;
            }

            console.log(chalk.bold('\n期初余额'));
            console.log(chalk.gray('─'.repeat(80)));
            balances.forEach((b: OpeningBalance) => {
              console.log(`${b.account_code} ${b.account_name}: 借方 ${b.debit_balance || 0} | 贷方 ${b.credit_balance || 0}`);
            });
            console.log(chalk.gray(`\n共 ${balances.length} 个科目`));
          },
        }
      );
    });

  // Set opening balance
  periodCmd
    .command('set-opening-balance')
    .description('Set opening balance for an account')
    .requiredOption('-w, --workspace <id>', 'Workspace ID')
    .requiredOption('--period <id>', 'Period ID (UUID)')
    .requiredOption('--account <id>', 'Account ID (UUID)')
    .option('--debit <amount>', 'Opening debit balance', '0')
    .option('--credit <amount>', 'Opening credit balance', '0')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      await apiPost(
        '/api/opening-balances/batch',
        {
          workspace_id: options.workspace,
          period_id: options.period,
          balances: [{
            account_id: options.account,
            opening_debit: Number(options.debit),
            opening_credit: Number(options.credit),
          }],
        },
        'Setting opening balance...',
        {
          json: options.json,
          onSuccess: () => {
            console.log(chalk.bold('\n期初余额已设置:'));
            console.log(`科目 ID: ${options.account}`);
            console.log(`借方余额: ${options.debit}`);
            console.log(`贷方余额: ${options.credit}`);
          },
        }
      );
    });

  return periodCmd;
}
