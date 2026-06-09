import { Command } from 'commander';
import { table } from 'table';
import chalk from 'chalk';
import ora from 'ora';
import { apiFetch, loadWorkspace, saveWorkspace } from '../lib/api-client.js';
export function createWorkspaceApiCommand() {
    const workspaceCmd = new Command('workspace-api')
        .description('Workspace API operations (list, switch, settings)');
    // List workspaces
    workspaceCmd
        .command('list')
        .description('List all accessible workspaces')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        const spinner = ora('Fetching workspaces...').start();
        try {
            const data = await apiFetch('/api/workspaces');
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
                return;
            }
            const workspaces = (data.data || data.workspaces) || [];
            if (workspaces.length === 0) {
                console.log(chalk.yellow('No workspaces found'));
                return;
            }
            const rows = [
                ['ID', 'Name', 'Company', 'Taxpayer Type', 'Accounting Standard'],
                ...workspaces.map((w) => [
                    w.id,
                    w.name?.substring(0, 20) || '-',
                    w.legal_name?.substring(0, 20) || '-',
                    w.taxpayer_type || '-',
                    w.accounting_standard || '-',
                ]),
            ];
            console.log(chalk.bold('\nWorkspaces'));
            console.log(table(rows));
            console.log(chalk.gray(`\nTotal: ${workspaces.length} workspaces`));
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Switch workspace
    workspaceCmd
        .command('switch')
        .description('Switch to a different workspace')
        .argument('<id>', 'Workspace ID')
        .option('--json', 'Output as JSON')
        .action(async (id, options) => {
        const spinner = ora('Switching workspace...').start();
        try {
            const data = await apiFetch(`/api/workspaces/${id}`);
            const workspace = (data.data || data);
            await saveWorkspace({ id: workspace.id, name: workspace.name });
            spinner.succeed(`Switched to workspace: ${workspace.name}`);
            if (options.json) {
                console.log(JSON.stringify(workspace, null, 2));
            }
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Current workspace
    workspaceCmd
        .command('current')
        .description('Show current workspace')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const workspace = await loadWorkspace();
            if (!workspace) {
                console.log(chalk.yellow('No workspace selected'));
                console.log(chalk.gray('Run "ssos-cli workspace-api switch <id>"'));
                return;
            }
            // Fetch real name from API if loaded from env
            let displayName = workspace.name;
            if (displayName === 'env') {
                try {
                    const data = await apiFetch(`/api/workspaces/${workspace.id}`);
                    const ws = (data.data || data);
                    displayName = ws.name || displayName;
                }
                catch {
                    // keep "env" if API call fails
                }
            }
            if (options.json) {
                console.log(JSON.stringify({ id: workspace.id, name: displayName }, null, 2));
                return;
            }
            console.log(chalk.bold('\nCurrent Workspace:'));
            console.log(chalk.gray('─'.repeat(50)));
            console.log(`${chalk.bold('ID:')} ${workspace.id}`);
            console.log(`${chalk.bold('Name:')} ${displayName}`);
        }
        catch (error) {
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Workspace settings
    workspaceCmd
        .command('settings')
        .description('Get workspace settings')
        .option('-w, --workspace <id>', 'Workspace ID')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        const spinner = ora('Fetching settings...').start();
        try {
            const workspaceId = options.workspace || (await loadWorkspace())?.id;
            if (!workspaceId) {
                spinner.fail('No workspace specified');
                console.error(chalk.red('Use --workspace or switch to a workspace first'));
                process.exit(1);
            }
            const data = await apiFetch(`/api/workspaces/${workspaceId}`);
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
                return;
            }
            const settings = data.data || data;
            console.log(chalk.bold('\nWorkspace Settings:'));
            console.log(chalk.gray('─'.repeat(50)));
            Object.entries(settings).forEach(([key, value]) => {
                console.log(`${chalk.bold(key)}: ${value}`);
            });
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Workspace members
    workspaceCmd
        .command('members')
        .description('List workspace members')
        .option('-w, --workspace <id>', 'Workspace ID')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        const spinner = ora('Fetching members...').start();
        try {
            const workspaceId = options.workspace || (await loadWorkspace())?.id;
            if (!workspaceId) {
                spinner.fail('No workspace specified');
                console.error(chalk.red('Use --workspace or switch to a workspace first'));
                process.exit(1);
            }
            const data = await apiFetch(`/api/workspace-members?workspace_id=${workspaceId}`);
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
                return;
            }
            const members = (Array.isArray(data) ? data : data.data || []);
            if (members.length === 0) {
                console.log(chalk.yellow('No members found'));
                return;
            }
            const rows = [
                ['User', 'Email', 'Role', 'Joined At'],
                ...members.map((m) => [
                    m.user_name?.substring(0, 15) || '-',
                    m.email?.substring(0, 25) || '-',
                    m.role || '-',
                    m.joined_at ? new Date(m.joined_at).toLocaleDateString() : '-',
                ]),
            ];
            console.log(chalk.bold('\nWorkspace Members'));
            console.log(table(rows));
            console.log(chalk.gray(`\nTotal: ${members.length} members`));
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    return workspaceCmd;
}
