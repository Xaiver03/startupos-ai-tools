import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
export function createUsersCommand() {
    const usersCmd = new Command('users')
        .description('User management - Use "ssos crud list/get users" for data operations');
    // Reset password
    usersCmd
        .command('reset-password')
        .description('Reset user password')
        .argument('<email>', 'User email')
        .argument('<new-password>', 'New password')
        .action(async (email, newPassword) => {
        const spinner = ora('Resetting password...').start();
        try {
            // This requires bcrypt implementation in the database or backend
            spinner.warn('Password reset not implemented yet - requires bcrypt hashing');
            console.log(chalk.yellow('\nTo reset password manually:'));
            console.log(chalk.gray(`1. Generate bcrypt hash for password: ${newPassword}`));
            console.log(chalk.gray(`2. UPDATE users SET password_hash = '<hash>' WHERE email = '${email}'`));
        }
        catch (error) {
            spinner.fail('Reset failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    return usersCmd;
}
