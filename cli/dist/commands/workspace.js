import { Command } from 'commander';
import { query } from '../db.js';
import { table } from 'table';
import chalk from 'chalk';
import ora from 'ora';
export function createWorkspaceCommand() {
    const workspaceCmd = new Command('workspace')
        .description('Workspace management');
    // List workspaces
    workspaceCmd
        .command('list')
        .description('List all workspaces')
        .option('-l, --limit <number>', 'Limit results', '50')
        .action(async (options) => {
        try {
            const result = await query(`
          SELECT
            w.id,
            w.name,
            w.legal_name,
            w.accounting_standard,
            w.created_at,
            COUNT(wm.user_id) as member_count
          FROM workspaces w
          LEFT JOIN workspace_members wm ON w.id = wm.workspace_id
          GROUP BY w.id
          ORDER BY w.created_at DESC
          LIMIT $1
        `, [parseInt(options.limit)]);
            const data = [
                ['ID', 'Name', 'Legal Name', 'Standard', 'Members', 'Created'],
                ...result.rows.map(row => [
                    row.id,
                    row.name,
                    row.legal_name || '-',
                    row.accounting_standard,
                    String(row.member_count),
                    new Date(row.created_at).toLocaleDateString()
                ])
            ];
            console.log(table(data));
            console.log(chalk.gray(`\nTotal workspaces: ${result.rows.length}`));
        }
        catch (error) {
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Get workspace stats
    workspaceCmd
        .command('stats')
        .description('Get workspace statistics')
        .argument('<workspace-id>', 'Workspace ID')
        .action(async (workspaceId) => {
        const spinner = ora('Fetching stats...').start();
        try {
            const stats = await query(`
          SELECT
            (SELECT COUNT(*) FROM journal_entries WHERE workspace_id = $1) as journal_entries,
            (SELECT COUNT(*) FROM accounts WHERE workspace_id = $1) as accounts,
            (SELECT COUNT(*) FROM workspace_members WHERE workspace_id = $1) as members,
            (SELECT COUNT(*) FROM ai_conversations WHERE workspace_id = $1) as ai_conversations,
            (SELECT COUNT(*) FROM employees WHERE workspace_id = $1) as employees,
            (SELECT COUNT(*) FROM contracts WHERE workspace_id = $1) as contracts
        `, [workspaceId]);
            spinner.succeed('Workspace statistics');
            const s = stats.rows[0];
            console.log(chalk.bold('\nWorkspace Stats:'));
            console.log(chalk.gray('─'.repeat(50)));
            console.log(`${chalk.bold('Journal Entries:')} ${s.journal_entries}`);
            console.log(`${chalk.bold('Accounts:')} ${s.accounts}`);
            console.log(`${chalk.bold('Members:')} ${s.members}`);
            console.log(`${chalk.bold('AI Conversations:')} ${s.ai_conversations}`);
            console.log(`${chalk.bold('Employees:')} ${s.employees}`);
            console.log(`${chalk.bold('Contracts:')} ${s.contracts}`);
        }
        catch (error) {
            spinner.fail('Failed to fetch stats');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    return workspaceCmd;
}
