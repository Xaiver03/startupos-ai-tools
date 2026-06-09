import { Command } from 'commander';
import chalk from 'chalk';
import { apiGet } from '../lib/api-helpers.js';

/**
 * Tax module - 税务业务逻辑
 *
 * 本模块提供 6 个税务计算和查询命令。
 * 税务数据操作请使用 'crud' 命令：
 *   crud list annual-bonus
 *   crud list dividend-payments
 *   crud list iit-filings
 */

export function createTaxCommand() {
  const taxCmd = new Command('tax')
    .description('税务业务逻辑 | 数据操作用 crud 命令');

  // Tax Calendar
  taxCmd
    .command('calendar')
    .description('Get tax calendar tasks')
    .option('-w, --workspace <id>', 'Workspace ID (required)')
    .option('-f, --from <date>', 'From date (YYYY-MM-DD)')
    .option('-t, --to <date>', 'To date (YYYY-MM-DD)')
    .option('--status <status>', 'Filter by status')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      if (!options.workspace) {
        console.error(chalk.red('Error: --workspace is required'));
        process.exit(1);
      }

      const params: Record<string, string> = { workspace_id: options.workspace };
      if (options.from) params.from_date = options.from;
      if (options.to) params.to_date = options.to;
      if (options.status) params.status = options.status;

      await apiGet(
        '/api/tax-calendar/tasks',
        params,
        'Fetching tax calendar...',
        {
          json: options.json,
          onSuccess: (data) => {
            console.log(chalk.bold('\n税务日历'));
            console.log(chalk.gray('─'.repeat(80)));
            console.log(JSON.stringify(data, null, 2));
          },
        }
      );
    });

  // Tax Rules
  taxCmd
    .command('rules')
    .description('Get tax rules')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      await apiGet(
        '/api/tax-calendar/rules',
        {},
        'Fetching tax rules...',
        {
          json: options.json,
          onSuccess: (data) => {
            console.log(chalk.bold('\n税务规则'));
            console.log(chalk.gray('─'.repeat(80)));
            console.log(JSON.stringify(data, null, 2));
          },
        }
      );
    });

  // Tax Calculations
  taxCmd
    .command('calculations')
    .description('Get tax calculations')
    .option('-w, --workspace <id>', 'Workspace ID (required)')
    .option('--type <type>', 'Tax type')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      if (!options.workspace) {
        console.error(chalk.red('Error: --workspace is required'));
        process.exit(1);
      }

      const params: Record<string, string> = { workspace_id: options.workspace };
      if (options.type) params.type = options.type;

      await apiGet(
        '/api/tax-calculations',
        params,
        'Fetching tax calculations...',
        {
          json: options.json,
          onSuccess: (data) => {
            console.log(chalk.bold('\n税务计算'));
            console.log(chalk.gray('─'.repeat(80)));
            console.log(JSON.stringify(data, null, 2));
          },
        }
      );
    });

  // Tax Compliance
  taxCmd
    .command('compliance')
    .description('Check tax compliance')
    .option('-w, --workspace <id>', 'Workspace ID (required)')
    .option('--year <year>', 'Year')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      if (!options.workspace) {
        console.error(chalk.red('Error: --workspace is required'));
        process.exit(1);
      }

      const params: Record<string, string> = { workspace_id: options.workspace };
      if (options.year) params.year = options.year;

      await apiGet(
        '/api/tax-compliance',
        params,
        'Checking tax compliance...',
        {
          json: options.json,
          onSuccess: (data) => {
            console.log(chalk.bold('\n税务合规检查'));
            console.log(chalk.gray('─'.repeat(80)));
            console.log(JSON.stringify(data, null, 2));
          },
        }
      );
    });

  // Tax Filings
  taxCmd
    .command('filings')
    .description('Get tax filing forms')
    .option('-w, --workspace <id>', 'Workspace ID (required)')
    .option('--form-type <type>', 'Form type')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      if (!options.workspace) {
        console.error(chalk.red('Error: --workspace is required'));
        process.exit(1);
      }

      const params: Record<string, string> = { workspace_id: options.workspace };
      if (options.formType) params.form_type = options.formType;

      await apiGet(
        '/api/tax-filing-forms',
        params,
        'Fetching tax filings...',
        {
          json: options.json,
          onSuccess: (data) => {
            console.log(chalk.bold('\n税务申报表'));
            console.log(chalk.gray('─'.repeat(80)));
            console.log(JSON.stringify(data, null, 2));
          },
        }
      );
    });

  // Tax Loss Carryforward
  taxCmd
    .command('loss-carryforward')
    .description('Get tax loss carryforward')
    .option('-w, --workspace <id>', 'Workspace ID (required)')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      if (!options.workspace) {
        console.error(chalk.red('Error: --workspace is required'));
        process.exit(1);
      }

      await apiGet(
        '/api/tax-loss-carryforward',
        { workspace_id: options.workspace },
        'Fetching loss carryforward...',
        {
          json: options.json,
          onSuccess: (data) => {
            console.log(chalk.bold('\n亏损弥补'));
            console.log(chalk.gray('─'.repeat(80)));
            console.log(JSON.stringify(data, null, 2));
          },
        }
      );
    });

  return taxCmd;
}
