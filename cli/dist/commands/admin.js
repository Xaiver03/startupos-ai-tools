import { Command } from 'commander';
import { table } from 'table';
import chalk from 'chalk';
import ora from 'ora';
import { apiFetch, getAuthMethod } from '../lib/api-client.js';
import { registerAdminExtended } from './admin-extended.js';
/** Check admin auth — must be JWT-based, exit if not */
async function requireAdminAuth() {
    const method = getAuthMethod();
    if (method !== 'jwt' && method !== 'password') {
        console.error(chalk.red('Error: Admin commands require JWT authentication.'));
        console.error(chalk.gray('Run: ssos-cli auth login --token <jwt>'));
        console.error(chalk.gray(' Or: export SSOS_ACCESS_TOKEN=<jwt>'));
        process.exit(1);
    }
}
/** Parse 403 response for permission details */
function formatPermissionError(body) {
    const required = body.required_permission;
    const msg = [chalk.red(`Permission denied`)];
    if (required)
        msg.push(chalk.yellow(`  Required: ${required}`));
    return msg.join('\n');
}
export function createAdminCommand() {
    const adminCmd = new Command('admin')
        .description('System administration (requires JWT admin token)');
    // ═══════════════════════════════════════════════════════════════════════
    // whoami — show current admin permissions
    // ═══════════════════════════════════════════════════════════════════════
    adminCmd
        .command('whoami')
        .description('Show current admin role and permissions')
        .action(async () => {
        await requireAdminAuth();
        const spinner = ora('Fetching permissions...').start();
        try {
            const data = await apiFetch('/api/admin/me/permissions');
            spinner.stop();
            console.log(chalk.bold('\nAdmin Identity:'));
            console.log(chalk.gray('─'.repeat(50)));
            if (data.is_super_admin) {
                console.log(`${chalk.bold('Role:')} ${chalk.green('Super Admin')}`);
                console.log(chalk.gray('  All permissions granted (bypasses all checks)'));
            }
            else {
                const roles = data.roles || [];
                const permissions = data.permissions || [];
                console.log(`${chalk.bold('Type:')} Sub-admin`);
                console.log(`${chalk.bold('Roles:')} ${roles.length > 0 ? chalk.blue(roles.join(', ')) : chalk.yellow('none')}`);
                console.log(`${chalk.bold('Permissions:')} ${permissions.length} granted`);
                if (permissions.length > 0) {
                    console.log(chalk.gray('─'.repeat(50)));
                    // Group by prefix
                    const grouped = {};
                    for (const p of permissions) {
                        const prefix = p.split(':')[0];
                        if (!grouped[prefix])
                            grouped[prefix] = [];
                        grouped[prefix].push(p);
                    }
                    for (const [prefix, perms] of Object.entries(grouped)) {
                        console.log(chalk.bold(`  ${prefix}:`));
                        perms.forEach(p => console.log(chalk.gray(`    ${p}`)));
                    }
                }
            }
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // ═══════════════════════════════════════════════════════════════════════
    // users — user management
    // ═══════════════════════════════════════════════════════════════════════
    const usersCmd = adminCmd
        .command('users')
        .description('User management');
    usersCmd
        .command('list')
        .description('List all users')
        .option('--page <n>', 'Page number', '1')
        .option('--limit <n>', 'Results per page', '20')
        .option('--search <term>', 'Search by email or name')
        .option('--status <status>', 'Filter: active | banned')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        await requireAdminAuth();
        const spinner = ora('Fetching users...').start();
        try {
            const params = new URLSearchParams();
            params.append('page', options.page);
            params.append('limit', options.limit);
            if (options.search)
                params.append('search', options.search);
            if (options.status)
                params.append('status', options.status);
            const data = await apiFetch(`/api/admin/users?${params.toString()}`);
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(data, null, 2));
                return;
            }
            const users = data.users || [];
            if (users.length === 0) {
                console.log(chalk.yellow('No users found'));
                return;
            }
            const rows = [
                ['ID', 'Email', 'Name', 'SuperAdmin', 'Banned', 'Workspaces', 'Sessions', 'Created'],
                ...users.map((u) => [
                    u.id?.substring(0, 8) + '...',
                    u.email,
                    u.name || '-',
                    u.is_super_admin ? chalk.green('Yes') : '-',
                    u.is_banned ? chalk.red('Yes') : '-',
                    u.workspace_count,
                    u.active_sessions,
                    u.created_at ? new Date(u.created_at).toLocaleDateString() : '-',
                ]),
            ];
            console.log(chalk.bold('\nUsers'));
            console.log(table(rows));
            console.log(chalk.gray(`\nPage ${options.page} | Total: ${data.total} users`));
        }
        catch (error) {
            spinner.fail('Failed');
            const msg = error instanceof Error ? error.message : String(error);
            if (msg.includes('403')) {
                try {
                    const body = JSON.parse(msg.replace('API error (403): ', ''));
                    console.error(formatPermissionError(body));
                }
                catch {
                    console.error(chalk.red(msg));
                }
            }
            else {
                console.error(chalk.red(msg));
            }
            process.exit(1);
        }
    });
    usersCmd
        .command('get')
        .description('Get user details')
        .argument('<id>', 'User ID')
        .option('--json', 'Output as JSON')
        .action(async (id, options) => {
        await requireAdminAuth();
        const spinner = ora('Fetching user...').start();
        try {
            const data = await apiFetch(`/api/admin/users/${id}`);
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(data, null, 2));
                return;
            }
            const u = data;
            console.log(chalk.bold('\nUser Details:'));
            console.log(chalk.gray('─'.repeat(50)));
            console.log(`${chalk.bold('ID:')} ${u.id}`);
            console.log(`${chalk.bold('Email:')} ${u.email}`);
            console.log(`${chalk.bold('Name:')} ${u.name || '-'}`);
            console.log(`${chalk.bold('Super Admin:')} ${u.is_super_admin ? chalk.green('Yes') : 'No'}`);
            console.log(`${chalk.bold('Banned:')} ${u.is_banned ? chalk.red('Yes') : 'No'}`);
            console.log(`${chalk.bold('WeChat:')} ${u.has_wechat ? 'Yes' : 'No'}`);
            console.log(`${chalk.bold('Created:')} ${u.created_at ? new Date(u.created_at).toLocaleString() : '-'}`);
            const workspaces = u.workspaces;
            if (workspaces?.length) {
                console.log(chalk.bold('\nWorkspaces:'));
                workspaces.forEach((ws) => {
                    console.log(`  - ${ws.name || ws.id} (${ws.role || 'member'})`);
                });
            }
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    usersCmd
        .command('ban')
        .description('Ban a user')
        .argument('<id>', 'User ID')
        .action(async (id) => {
        await requireAdminAuth();
        const spinner = ora('Banning user...').start();
        try {
            await apiFetch(`/api/admin/users/${id}/ban`, { method: 'POST' });
            spinner.succeed(`User ${id.substring(0, 8)}... banned`);
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    usersCmd
        .command('unban')
        .description('Unban a user')
        .argument('<id>', 'User ID')
        .action(async (id) => {
        await requireAdminAuth();
        const spinner = ora('Unbanning user...').start();
        try {
            await apiFetch(`/api/admin/users/${id}/unban`, { method: 'POST' });
            spinner.succeed(`User ${id.substring(0, 8)}... unbanned`);
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    usersCmd
        .command('reset-password')
        .description('Reset a user password')
        .argument('<id>', 'User ID')
        .requiredOption('--password <pw>', 'New password (min 8 chars, must contain letter + number)')
        .action(async (id, options) => {
        await requireAdminAuth();
        const spinner = ora('Resetting password...').start();
        try {
            await apiFetch(`/api/admin/users/${id}/reset-password`, {
                method: 'POST',
                body: JSON.stringify({ password: options.password }),
            });
            spinner.succeed(`Password reset for user ${id.substring(0, 8)}...`);
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // ═══════════════════════════════════════════════════════════════════════
    // tenants — workspace/tenant management
    // ═══════════════════════════════════════════════════════════════════════
    const tenantsCmd = adminCmd
        .command('tenants')
        .description('Tenant (workspace) management');
    tenantsCmd
        .command('list')
        .description('List all tenants')
        .option('--page <n>', 'Page number', '1')
        .option('--limit <n>', 'Results per page', '20')
        .option('--search <term>', 'Search by name')
        .option('--status <status>', 'Filter: active | suspended')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        await requireAdminAuth();
        const spinner = ora('Fetching tenants...').start();
        try {
            const params = new URLSearchParams();
            params.append('page', options.page);
            params.append('limit', options.limit);
            if (options.search)
                params.append('search', options.search);
            if (options.status)
                params.append('status', options.status);
            const data = await apiFetch(`/api/admin/tenants?${params.toString()}`);
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(data, null, 2));
                return;
            }
            const tenants = data.tenants || [];
            if (tenants.length === 0) {
                console.log(chalk.yellow('No tenants found'));
                return;
            }
            const rows = [
                ['ID', 'Name', 'Legal Name', 'Status', 'Members', 'Entries', 'Created'],
                ...tenants.map((t) => [
                    t.id?.substring(0, 8) + '...',
                    t.name || '-',
                    t.legal_name || '-',
                    t.status === 'suspended' ? chalk.red('Suspended') : chalk.green('Active'),
                    t.member_count || 0,
                    t.journal_count || 0,
                    t.created_at ? new Date(t.created_at).toLocaleDateString() : '-',
                ]),
            ];
            console.log(chalk.bold('\nTenants'));
            console.log(table(rows));
            console.log(chalk.gray(`\nPage ${options.page} | Total: ${data.total} tenants`));
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    tenantsCmd
        .command('get')
        .description('Get tenant details')
        .argument('<id>', 'Tenant ID')
        .option('--json', 'Output as JSON')
        .action(async (id, options) => {
        await requireAdminAuth();
        const spinner = ora('Fetching tenant...').start();
        try {
            const data = await apiFetch(`/api/admin/tenants/${id}`);
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(data, null, 2));
                return;
            }
            const t = data;
            console.log(chalk.bold('\nTenant Details:'));
            console.log(chalk.gray('─'.repeat(50)));
            console.log(`${chalk.bold('ID:')} ${t.id}`);
            console.log(`${chalk.bold('Name:')} ${t.name}`);
            console.log(`${chalk.bold('Legal Name:')} ${t.legal_name || '-'}`);
            console.log(`${chalk.bold('Status:')} ${t.status === 'suspended' ? chalk.red(t.status) : chalk.green(t.status)}`);
            console.log(`${chalk.bold('Members:')} ${t.member_count || 0}`);
            console.log(`${chalk.bold('Accounts:')} ${t.account_count || 0}`);
            console.log(`${chalk.bold('Journal Entries:')} ${t.journal_count || 0}`);
            console.log(`${chalk.bold('Created:')} ${t.created_at ? new Date(t.created_at).toLocaleString() : '-'}`);
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    tenantsCmd
        .command('suspend')
        .description('Suspend a tenant')
        .argument('<id>', 'Tenant ID')
        .action(async (id) => {
        await requireAdminAuth();
        const spinner = ora('Suspending tenant...').start();
        try {
            await apiFetch(`/api/admin/tenants/${id}/suspend`, { method: 'POST' });
            spinner.succeed(`Tenant ${id.substring(0, 8)}... suspended`);
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    tenantsCmd
        .command('activate')
        .description('Activate a suspended tenant')
        .argument('<id>', 'Tenant ID')
        .action(async (id) => {
        await requireAdminAuth();
        const spinner = ora('Activating tenant...').start();
        try {
            await apiFetch(`/api/admin/tenants/${id}/activate`, { method: 'POST' });
            spinner.succeed(`Tenant ${id.substring(0, 8)}... activated`);
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // ═══════════════════════════════════════════════════════════════════════
    // monitoring — system monitoring & stats
    // ═══════════════════════════════════════════════════════════════════════
    const monitoringCmd = adminCmd
        .command('monitoring')
        .description('System monitoring and statistics');
    monitoringCmd
        .command('overview')
        .description('System-wide overview statistics')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        await requireAdminAuth();
        const spinner = ora('Fetching overview...').start();
        try {
            const data = await apiFetch('/api/admin/monitoring/overview');
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(data, null, 2));
                return;
            }
            const s = data;
            console.log(chalk.bold('\nSystem Overview:'));
            console.log(chalk.gray('─'.repeat(50)));
            console.log(`${chalk.bold('Total Users:')} ${s.total_users}`);
            console.log(`${chalk.bold('New Users (7d):')} ${s.new_users_7d}`);
            console.log(`${chalk.bold('New Users (30d):')} ${s.new_users_30d}`);
            console.log(`${chalk.bold('Total Workspaces:')} ${s.total_workspaces}`);
            console.log(`${chalk.bold('Total Journal Entries:')} ${s.total_journal_entries}`);
            console.log(`${chalk.bold('Active Sessions:')} ${s.active_sessions}`);
            console.log(`${chalk.bold('Banned Users:')} ${chalk.red(String(s.banned_users || 0))}`);
            console.log(`${chalk.bold('Suspended Tenants:')} ${chalk.yellow(String(s.suspended_tenants || 0))}`);
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    monitoringCmd
        .command('growth')
        .description('Growth trends over time')
        .option('--days <n>', 'Number of days to analyze', '30')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        await requireAdminAuth();
        const spinner = ora('Fetching growth data...').start();
        try {
            const params = new URLSearchParams();
            params.append('days', options.days);
            const data = await apiFetch(`/api/admin/monitoring/growth?${params.toString()}`);
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(data, null, 2));
                return;
            }
            const days = data.days || [];
            if (days.length === 0) {
                console.log(chalk.yellow('No growth data available'));
                return;
            }
            const rows = [
                ['Date', 'New Users', 'New Workspaces', 'New Entries'],
                ...days.map((d) => [
                    d.date,
                    d.new_users || 0,
                    d.new_workspaces || 0,
                    d.new_entries || 0,
                ]),
            ];
            console.log(chalk.bold(`\nGrowth Trends (Last ${options.days} days)`));
            console.log(table(rows));
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    monitoringCmd
        .command('top-tenants')
        .description('Most active tenants by journal entries')
        .option('--limit <n>', 'Number of top tenants', '10')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        await requireAdminAuth();
        const spinner = ora('Fetching top tenants...').start();
        try {
            const params = new URLSearchParams();
            params.append('limit', options.limit);
            const data = await apiFetch(`/api/admin/monitoring/top-tenants?${params.toString()}`);
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(data, null, 2));
                return;
            }
            const tenants = data.tenants || [];
            if (tenants.length === 0) {
                console.log(chalk.yellow('No tenant data available'));
                return;
            }
            const rows = [
                ['#', 'Name', 'Journal Entries'],
                ...tenants.map((t, i) => [
                    i + 1,
                    t.name || t.workspace_name || '-',
                    t.journal_count || t.entry_count || 0,
                ]),
            ];
            console.log(chalk.bold(`\nTop ${options.limit} Tenants by Activity`));
            console.log(table(rows));
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // ═══════════════════════════════════════════════════════════════════════
    // settings — system settings
    // ═══════════════════════════════════════════════════════════════════════
    const settingsCmd = adminCmd
        .command('settings')
        .description('System settings management');
    settingsCmd
        .command('list')
        .description('List all system settings')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        await requireAdminAuth();
        const spinner = ora('Fetching settings...').start();
        try {
            const data = await apiFetch('/api/admin/settings');
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(data, null, 2));
                return;
            }
            const settings = data.settings || [];
            if (settings.length === 0) {
                console.log(chalk.yellow('No settings found'));
                return;
            }
            const rows = [
                ['Key', 'Description', 'Value'],
                ...settings.map((s) => [
                    s.key || s.setting_key,
                    s.description || '-',
                    typeof s.value === 'object' ? JSON.stringify(s.value).substring(0, 60) : String(s.value || '-').substring(0, 60),
                ]),
            ];
            console.log(chalk.bold('\nSystem Settings'));
            console.log(table(rows));
            console.log(chalk.gray(`\nTotal: ${settings.length} settings`));
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    settingsCmd
        .command('get')
        .description('Get a single setting')
        .argument('<key>', 'Setting key')
        .option('--json', 'Output as JSON')
        .action(async (key, options) => {
        await requireAdminAuth();
        const spinner = ora('Fetching setting...').start();
        try {
            const data = await apiFetch(`/api/admin/settings/${encodeURIComponent(key)}`);
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(data, null, 2));
                return;
            }
            const s = data;
            console.log(chalk.bold(`\nSetting: ${key}`));
            console.log(chalk.gray('─'.repeat(50)));
            console.log(`${chalk.bold('Description:')} ${s.description || '-'}`);
            console.log(`${chalk.bold('Value:')} ${typeof s.value === 'object' ? JSON.stringify(s.value, null, 2) : String(s.value || '-')}`);
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    settingsCmd
        .command('set')
        .description('Create or update a system setting')
        .argument('<key>', 'Setting key')
        .requiredOption('--value <json>', 'Setting value (JSON format)')
        .option('--description <text>', 'Setting description')
        .action(async (key, options) => {
        await requireAdminAuth();
        const spinner = ora('Saving setting...').start();
        try {
            let parsedValue;
            try {
                parsedValue = JSON.parse(options.value);
            }
            catch {
                parsedValue = options.value; // Use as-is if not valid JSON
            }
            const body = { value: parsedValue };
            if (options.description)
                body.description = options.description;
            await apiFetch(`/api/admin/settings/${encodeURIComponent(key)}`, {
                method: 'PUT',
                body: JSON.stringify(body),
            });
            spinner.succeed(`Setting "${key}" saved`);
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    settingsCmd
        .command('batch')
        .description('Batch update multiple settings')
        .requiredOption('--items <json>', 'JSON array of {key, value, description?} objects')
        .action(async (options) => {
        await requireAdminAuth();
        const spinner = ora('Saving settings...').start();
        try {
            const items = JSON.parse(options.items);
            const body = { settings: items };
            await apiFetch('/api/admin/settings', {
                method: 'PATCH',
                body: JSON.stringify(body),
            });
            spinner.succeed(`${items.length} settings saved`);
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    registerAdminExtended(adminCmd);
    return adminCmd;
}
