import { Command } from 'commander';
import { query } from '../db.js';
import { table } from 'table';
import chalk from 'chalk';
import ora from 'ora';

export function createUsersCommand() {
  const usersCmd = new Command('users')
    .description('User management');

  // List users
  usersCmd
    .command('list')
    .description('List all users')
    .option('-l, --limit <number>', 'Limit results', '50')
    .action(async (options) => {
      try {
        const result = await query(`
          SELECT
            u.id,
            u.email,
            u.name,
            u.is_super_admin,
            u.created_at,
            COUNT(w.id) as workspace_count
          FROM users u
          LEFT JOIN workspace_members wm ON u.id = wm.user_id
          LEFT JOIN workspaces w ON wm.workspace_id = w.id
          GROUP BY u.id
          ORDER BY u.created_at DESC
          LIMIT $1
        `, [parseInt(options.limit)]);

        const data = [
          ['ID', 'Email', 'Name', 'Super Admin', 'Workspaces', 'Created'],
          ...result.rows.map(row => [
            row.id,
            row.email,
            row.name || '-',
            row.is_super_admin ? 'Yes' : 'No',
            String(row.workspace_count),
            new Date(row.created_at).toLocaleDateString()
          ])
        ];

        console.log(table(data));
        console.log(chalk.gray(`\nTotal users: ${result.rows.length}`));
      } catch (error) {
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  // Get user details
  usersCmd
    .command('get')
    .description('Get user details by email or ID')
    .argument('<identifier>', 'User email or ID')
    .action(async (identifier: string) => {
      try {
        const result = await query(`
          SELECT
            u.*,
            json_agg(
              json_build_object(
                'workspace_id', w.id,
                'workspace_name', w.name,
                'role', wm.role
              )
            ) as workspaces
          FROM users u
          LEFT JOIN workspace_members wm ON u.id = wm.user_id
          LEFT JOIN workspaces w ON wm.workspace_id = w.id
          WHERE u.id = $1 OR u.email = $1
          GROUP BY u.id
        `, [identifier]);

        if (result.rows.length === 0) {
          console.log(chalk.yellow('User not found'));
          return;
        }

        const user = result.rows[0];
        console.log(chalk.bold('\nUser Details:'));
        console.log(chalk.gray('─'.repeat(50)));
        console.log(`${chalk.bold('ID:')} ${user.id}`);
        console.log(`${chalk.bold('Email:')} ${user.email}`);
        console.log(`${chalk.bold('Name:')} ${user.name || '-'}`);
        console.log(`${chalk.bold('Super Admin:')} ${user.is_super_admin ? 'Yes' : 'No'}`);
        console.log(`${chalk.bold('Created:')} ${new Date(user.created_at).toLocaleString()}`);
        console.log(`\n${chalk.bold('Workspaces:')}`);

        if (user.workspaces && user.workspaces[0]?.workspace_id) {
          (user.workspaces as Array<Record<string, unknown>>).forEach((ws: Record<string, unknown>) => {
            console.log(`  • ${ws.workspace_name as string} (${ws.role as string})`);
          });
        } else {
          console.log(chalk.gray('  No workspaces'));
        }
      } catch (error) {
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  // Reset password
  usersCmd
    .command('reset-password')
    .description('Reset user password')
    .argument('<email>', 'User email')
    .argument('<new-password>', 'New password')
    .action(async (email: string, newPassword: string) => {
      const spinner = ora('Resetting password...').start();
      try {
        // This requires bcrypt implementation in the database or backend
        spinner.warn('Password reset not implemented yet - requires bcrypt hashing');
        console.log(chalk.yellow('\nTo reset password manually:'));
        console.log(chalk.gray(`1. Generate bcrypt hash for password: ${newPassword}`));
        console.log(chalk.gray(`2. UPDATE users SET password_hash = '<hash>' WHERE email = '${email}'`));
      } catch (error) {
        spinner.fail('Reset failed');
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  return usersCmd;
}
