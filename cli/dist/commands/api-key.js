import { Command } from 'commander';
import { table } from 'table';
import chalk from 'chalk';
import ora from 'ora';
import { apiFetch } from '../lib/api-client.js';
export function createApiKeyCommand() {
    const apiKeyCmd = new Command('api-key')
        .description('API Key management');
    // List API keys
    apiKeyCmd
        .command('list')
        .description('List all API keys')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        const spinner = ora('Fetching API keys...').start();
        try {
            const data = await apiFetch('/api/api-keys');
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
                return;
            }
            const keys = (Array.isArray(data) ? data : data.data || []);
            if (keys.length === 0) {
                console.log(chalk.yellow('No API keys found'));
                return;
            }
            const rows = [
                ['ID', 'Name', 'Prefix', 'Scopes', 'Expires', 'Active'],
                ...keys.map((k) => [
                    k.id,
                    k.name,
                    k.keyPrefix || '-',
                    k.scopes?.join(', ') || '-',
                    k.expiresAt ? new Date(k.expiresAt).toLocaleDateString() : 'Never',
                    k.isActive ? chalk.green('Yes') : chalk.red('No'),
                ]),
            ];
            console.log(chalk.bold('\nAPI Keys'));
            console.log(table(rows));
            console.log(chalk.gray(`\nTotal: ${keys.length} keys`));
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Create API key
    apiKeyCmd
        .command('create')
        .description('Create a new API key')
        .requiredOption('-n, --name <name>', 'Name for the API key')
        .option('-w, --workspace <id>', 'Scope to specific workspace')
        .option('--scopes <scopes>', 'Permission scopes (comma-separated)', 'read:accounting,write:accounting')
        .option('--expires <date>', 'Expiration date (ISO format)')
        .option('--days <n>', 'Expire after N days')
        .action(async (options) => {
        const spinner = ora('Creating API key...').start();
        try {
            const body = {
                name: options.name,
            };
            if (options.workspace)
                body.workspaceId = options.workspace;
            if (options.scopes)
                body.scopes = options.scopes.split(',').map((s) => s.trim());
            if (options.expires)
                body.expiresAt = options.expires;
            if (options.days) {
                const date = new Date();
                date.setDate(date.getDate() + parseInt(options.days));
                body.expiresAt = date.toISOString();
            }
            const data = await apiFetch('/api/api-keys', {
                method: 'POST',
                body: JSON.stringify(body),
            });
            spinner.succeed('API Key created');
            console.log(chalk.bold('\nAPI Key Created:'));
            console.log(chalk.yellow('⚠️  Copy this key now, it will not be shown again!'));
            const created = (data.data || data);
            console.log(chalk.cyan(`\n  ${created.key}\n`));
            console.log(`${chalk.bold('ID:')} ${created.id}`);
            console.log(`${chalk.bold('Name:')} ${created.name}`);
            console.log(`${chalk.bold('Prefix:')} ${created.keyPrefix}`);
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Revoke API key
    apiKeyCmd
        .command('revoke')
        .description('Revoke (delete) an API key')
        .argument('<id>', 'API key ID')
        .action(async (id) => {
        const spinner = ora('Revoking API key...').start();
        try {
            await apiFetch(`/api/api-keys/${id}`, { method: 'DELETE' });
            spinner.succeed('API Key revoked');
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Toggle API key
    apiKeyCmd
        .command('toggle')
        .description('Enable or disable an API key')
        .argument('<id>', 'API key ID')
        .argument('<enabled>', 'true to enable, false to disable')
        .action(async (id, enabled) => {
        const spinner = ora('Updating API key...').start();
        try {
            const isActive = enabled.toLowerCase() === 'true';
            await apiFetch(`/api/api-keys/${id}/toggle`, {
                method: 'PATCH',
                body: JSON.stringify({ isActive }),
            });
            spinner.succeed(`API Key ${isActive ? 'enabled' : 'disabled'}`);
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    return apiKeyCmd;
}
