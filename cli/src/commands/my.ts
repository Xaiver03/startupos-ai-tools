import { Command } from 'commander';
import { table } from 'table';
import chalk from 'chalk';
import ora from 'ora';
import { apiFetch } from '../lib/api-client.js';

export function createMyCommand() {
  const myCmd = new Command('my')
    .description('Employee self-service (员工自助服务)');

  // List payslips
  myCmd
    .command('payslips')
    .description('List my payslips (last 24 months, posted only)')
    .option('-w, --workspace <id>', 'Workspace ID (required)')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      if (!options.workspace) { console.error(chalk.red('Error: --workspace is required')); process.exit(1); }
      const spinner = ora('Fetching payslips...').start();
      try {
        const params = new URLSearchParams();
        params.append('workspace_id', options.workspace);
        const data = await apiFetch(`/api/my/payslips?${params.toString()}`);
        spinner.stop();
        if (options.json) { console.log(JSON.stringify(data, null, 2)); return; }
        const items = ((data.payslips || data.data) as Array<Record<string, unknown>>) || [];
        if (items.length === 0) { console.log(chalk.yellow('No payslips found')); return; }
        const rows = [
          ['Period', 'Gross Salary', 'Social Ins.', 'Housing Fund', 'Other Ded.', 'Special Ded.', 'Taxable', 'Tax', 'Net Salary'],
          ...items.map((p: Record<string, unknown>) => [
            p.period, p.gross_salary, p.social_insurance, p.housing_fund, p.other_deduction,
            p.special_deduction, p.taxable_income, p.income_tax, chalk.green(String(p.net_salary || 0)),
          ]),
        ];
        console.log(chalk.bold('\nMy Payslips'));
        console.log(table(rows));
        console.log(chalk.gray(`\nTotal: ${items.length} payslips`));
      } catch (error) { spinner.fail('Failed'); console.error(chalk.red(error instanceof Error ? error.message : String(error))); process.exit(1); }
    });

  // Get single payslip
  myCmd
    .command('payslip')
    .description('Get payslip for a specific period')
    .argument('<period>', 'Period in YYYY-MM format')
    .option('-w, --workspace <id>', 'Workspace ID (required)')
    .option('--json', 'Output as JSON')
    .action(async (period: string, options) => {
      if (!options.workspace) { console.error(chalk.red('Error: --workspace is required')); process.exit(1); }
      const spinner = ora(`Fetching payslip for ${period}...`).start();
      try {
        const data = await apiFetch(`/api/my/payslips/${period}`);
        spinner.stop();
        if (options.json) { console.log(JSON.stringify(data, null, 2)); return; }
        const p = (data.data || data.payslip || data) as Record<string, unknown>;
        console.log(chalk.bold(`\nPayslip — ${period}`));
        console.log(chalk.gray('─'.repeat(40)));
        console.log(`${chalk.bold('Gross Salary:')} ${p.gross_salary || 0}`);
        console.log(`${chalk.bold('Social Insurance:')} -${p.social_insurance || 0}`);
        console.log(`${chalk.bold('Housing Fund:')} -${p.housing_fund || 0}`);
        console.log(`${chalk.bold('Other Deduction:')} -${p.other_deduction || 0}`);
        console.log(`${chalk.bold('Special Deduction:')} -${p.special_deduction || 0}`);
        console.log(`${chalk.bold('Taxable Income:')} ${p.taxable_income || 0}`);
        console.log(`${chalk.bold('Income Tax:')} -${p.income_tax || 0}`);
        console.log(chalk.green(`${chalk.bold('Net Salary:')} ¥${Number(p.net_salary || 0).toLocaleString()}`));
        if (p.remark) console.log(`${chalk.bold('Remark:')} ${p.remark}`);
      } catch (error) { spinner.fail('Failed'); console.error(chalk.red(error instanceof Error ? error.message : String(error))); process.exit(1); }
    });

  // List expense claims
  myCmd
    .command('expense-list')
    .description('List my expense claims')
    .option('-w, --workspace <id>', 'Workspace ID (required)')
    .option('--status <status>', 'Filter: draft|submitted|under_review|approved|rejected|reimbursed|cancelled')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      if (!options.workspace) { console.error(chalk.red('Error: --workspace is required')); process.exit(1); }
      const spinner = ora('Fetching expense claims...').start();
      try {
        const params = new URLSearchParams();
        params.append('workspace_id', options.workspace);
        if (options.status) params.append('status', options.status);
        const data = await apiFetch(`/api/my/expense-claims?${params.toString()}`);
        spinner.stop();
        if (options.json) { console.log(JSON.stringify(data, null, 2)); return; }
        const items = ((data.claims || data.data) as Array<Record<string, unknown>>) || [];
        if (items.length === 0) { console.log(chalk.yellow('No expense claims found')); return; }
        const rows = [
          ['ID', 'Claim #', 'Title', 'Amount', 'Status', 'Submitted'],
          ...items.map((c: Record<string, unknown>) => [
            (c.id as string)?.substring(0, 8) + '...', c.claim_number || '-',
            (c.title as string)?.substring(0, 25), `¥${Number(c.total_amount || 0).toLocaleString()}`,
            c.status, c.submitted_at ? new Date(c.submitted_at as string).toLocaleDateString() : '-',
          ]),
        ];
        console.log(chalk.bold('\nMy Expense Claims'));
        console.log(table(rows));
        console.log(chalk.gray(`\nTotal: ${items.length} claims`));
      } catch (error) { spinner.fail('Failed'); console.error(chalk.red(error instanceof Error ? error.message : String(error))); process.exit(1); }
    });

  // Get expense claim detail
  myCmd
    .command('expense-get')
    .description('Get expense claim details')
    .argument('<id>', 'Claim ID')
    .option('--json', 'Output as JSON')
    .action(async (id: string, options) => {
      const spinner = ora('Fetching expense claim...').start();
      try {
        const data = await apiFetch(`/api/my/expense-claims/${id}`);
        spinner.stop();
        if (options.json) { console.log(JSON.stringify(data, null, 2)); return; }
        const c = (data.data || data.claim || data) as Record<string, unknown>;
        console.log(chalk.bold('\nExpense Claim Details:'));
        console.log(chalk.gray('─'.repeat(40)));
        console.log(`${chalk.bold('ID:')} ${c.id}`);
        console.log(`${chalk.bold('Claim #:')} ${c.claim_number || '-'}`);
        console.log(`${chalk.bold('Title:')} ${c.title || '-'}`);
        console.log(`${chalk.bold('Description:')} ${c.description || '-'}`);
        console.log(`${chalk.bold('Amount:')} ¥${Number(c.total_amount || 0).toLocaleString()}`);
        console.log(`${chalk.bold('Status:')} ${c.status}`);
        if (c.reject_reason) console.log(`${chalk.bold('Reject Reason:')} ${chalk.red(String(c.reject_reason))}`);
        const items = (c.items as Array<Record<string, unknown>>) || [];
        if (items.length > 0) {
          console.log(`\n${chalk.bold('Items:')}`);
          items.forEach((item: Record<string, unknown>) => {
            console.log(`  ${item.expense_date} | ¥${Number(item.amount || 0).toLocaleString()} | ${item.description || '-'}`);
          });
        }
      } catch (error) { spinner.fail('Failed'); console.error(chalk.red(error instanceof Error ? error.message : String(error))); process.exit(1); }
    });

  // Create expense claim
  myCmd
    .command('expense-create')
    .description('Create a new expense claim')
    .requiredOption('-w, --workspace <id>', 'Workspace ID')
    .requiredOption('--title <title>', 'Claim title')
    .requiredOption('--items <json>', 'Items as JSON array [{expense_date, amount, description, category_id}]')
    .option('--description <text>', 'Description')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const spinner = ora('Creating expense claim...').start();
      try {
        const body: Record<string, unknown> = {
          title: options.title,
          items: JSON.parse(options.items),
        };
        if (options.description) body.description = options.description;
        const data = await apiFetch('/api/my/expense-claims', { method: 'POST', body: JSON.stringify(body) });
        spinner.succeed('Expense claim created');
        if (options.json) { console.log(JSON.stringify(data, null, 2)); return; }
        const c = (data.data || data) as Record<string, unknown>;
        console.log(`${chalk.bold('ID:')} ${c.id}`);
        console.log(`${chalk.bold('Claim #:')} ${c.claim_number || '-'}`);
        console.log(`${chalk.bold('Status:')} ${c.status}`);
      } catch (error) { spinner.fail('Failed'); console.error(chalk.red(error instanceof Error ? error.message : String(error))); process.exit(1); }
    });

  // Submit expense claim
  myCmd
    .command('expense-submit')
    .description('Submit a draft expense claim for review')
    .argument('<id>', 'Claim ID')
    .option('--json', 'Output as JSON')
    .action(async (id: string, options) => {
      const spinner = ora('Submitting expense claim...').start();
      try {
        const data = await apiFetch(`/api/my/expense-claims/${id}/submit`, { method: 'POST' });
        spinner.succeed('Expense claim submitted');
        if (options.json) { console.log(JSON.stringify(data, null, 2)); return; }
        console.log(`${chalk.bold('Status:')} submitted`);
      } catch (error) { spinner.fail('Failed'); console.error(chalk.red(error instanceof Error ? error.message : String(error))); process.exit(1); }
    });

  // List expense categories
  myCmd
    .command('expense-categories')
    .description('List available expense categories')
    .option('-w, --workspace <id>', 'Workspace ID (required)')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      if (!options.workspace) { console.error(chalk.red('Error: --workspace is required')); process.exit(1); }
      const spinner = ora('Fetching expense categories...').start();
      try {
        const data = await apiFetch('/api/my/expense-categories');
        spinner.stop();
        if (options.json) { console.log(JSON.stringify(data, null, 2)); return; }
        const items = ((data.categories || data.data) as Array<Record<string, unknown>>) || [];
        if (items.length === 0) { console.log(chalk.yellow('No categories found')); return; }
        const rows = [
          ['ID', 'Name', 'Display Name', 'Daily Limit'],
          ...items.map((c: Record<string, unknown>) => [
            c.id, c.name, c.display_name || c.name,
            c.daily_limit ? `¥${Number(c.daily_limit).toLocaleString()}` : '-',
          ]),
        ];
        console.log(chalk.bold('\nExpense Categories'));
        console.log(table(rows));
      } catch (error) { spinner.fail('Failed'); console.error(chalk.red(error instanceof Error ? error.message : String(error))); process.exit(1); }
    });

  return myCmd;
}
