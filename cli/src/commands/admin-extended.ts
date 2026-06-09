import { Command } from 'commander';
import { table } from 'table';
import chalk from 'chalk';
import ora from 'ora';
import { apiFetch } from '../lib/api-client.js';

export function registerAdminExtended(adminCmd: Command) {

  // ═══ Roles (角色权限管理) ═══
  const rolesCmd = adminCmd.command('roles').description('Role & permission management (角色权限管理)');

  rolesCmd.command('list')
    .description('List admin roles')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const spinner = ora('Fetching roles...').start();
      try {
        const data = await apiFetch('/api/admin/roles');
        spinner.stop();
        if (options.json) { console.log(JSON.stringify(data, null, 2)); return; }
        const items = ((data.data || data.roles) as Array<Record<string, unknown>>) || [];
        if (items.length === 0) { console.log(chalk.yellow('No roles found')); return; }
        const rows = [['ID', 'Name', 'Display Name', 'Permissions'], ...items.map((r: Record<string, unknown>) => [
          (r.id as string)?.substring(0, 8) + '...', r.name, r.display_name || r.name,
          Array.isArray(r.permissions) ? (r.permissions as string[]).join(', ') : String(r.permissions || '-'),
        ])];
        console.log(chalk.bold('\nAdmin Roles'));
        console.log(table(rows));
      } catch (error) { spinner.fail('Failed'); console.error(chalk.red(error instanceof Error ? error.message : String(error))); process.exit(1); }
    });

  rolesCmd.command('permissions')
    .description('List available permission codes')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const spinner = ora('Fetching permissions...').start();
      try {
        const data = await apiFetch('/api/admin/roles/permissions');
        spinner.stop();
        if (options.json) { console.log(JSON.stringify(data, null, 2)); return; }
        const perms = ((data.data || data.permissions) as string[]) || [];
        console.log(chalk.bold('\nAvailable Permission Codes:'));
        perms.forEach(p => console.log(`  ${chalk.cyan(p)}`));
        console.log(chalk.gray(`\nTotal: ${perms.length} permissions`));
      } catch (error) { spinner.fail('Failed'); console.error(chalk.red(error instanceof Error ? error.message : String(error))); process.exit(1); }
    });

  rolesCmd.command('users')
    .description('List users with admin roles')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const spinner = ora('Fetching role users...').start();
      try {
        const data = await apiFetch('/api/admin/roles/users');
        spinner.stop();
        if (options.json) { console.log(JSON.stringify(data, null, 2)); return; }
        const items = ((data.data || data.users) as Array<Record<string, unknown>>) || [];
        if (items.length === 0) { console.log(chalk.yellow('No users with admin roles')); return; }
        const rows = [['User ID', 'Email', 'Roles'], ...items.map((u: Record<string, unknown>) => [
          String(u.user_id || u.id || '').substring(0, 12) + '...', u.email || u.user_email,
          Array.isArray(u.roles) ? (u.roles as Array<Record<string, unknown>>).map(r => r.name || r.display_name).join(', ') : '-',
        ])];
        console.log(chalk.bold('\nUsers with Admin Roles'));
        console.log(table(rows));
      } catch (error) { spinner.fail('Failed'); console.error(chalk.red(error instanceof Error ? error.message : String(error))); process.exit(1); }
    });

  rolesCmd.command('create')
    .description('Create an admin role')
    .requiredOption('--name <name>', 'Role name')
    .option('--display <name>', 'Display name')
    .option('--permissions <json>', 'JSON array of permission codes')
    .option('--desc <text>', 'Description')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const spinner = ora('Creating role...').start();
      try {
        const body: Record<string, unknown> = { name: options.name };
        if (options.display) body.display_name = options.display;
        if (options.permissions) body.permissions = JSON.parse(options.permissions);
        if (options.desc) body.description = options.desc;
        const data = await apiFetch('/api/admin/roles', { method: 'POST', body: JSON.stringify(body) });
        spinner.succeed('Role created');
        if (options.json) console.log(JSON.stringify(data, null, 2));
        else console.log(`${chalk.bold('Role:')} ${options.name}`);
      } catch (error) { spinner.fail('Failed'); console.error(chalk.red(error instanceof Error ? error.message : String(error))); process.exit(1); }
    });

  rolesCmd.command('delete')
    .description('Delete an admin role')
    .argument('<id>', 'Role ID')
    .action(async (id: string) => {
      const spinner = ora('Deleting role...').start();
      try { await apiFetch(`/api/admin/roles/${id}`, { method: 'DELETE' }); spinner.succeed('Role deleted'); }
      catch (error) { spinner.fail('Failed'); console.error(chalk.red(error instanceof Error ? error.message : String(error))); process.exit(1); }
    });

  // ═══ Plans (订阅计划管理) ═══
  const plansCmd = adminCmd.command('plans').description('Subscription plan management (订阅计划管理)');

  plansCmd.command('list')
    .description('List subscription plans')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const spinner = ora('Fetching plans...').start();
      try {
        const data = await apiFetch('/api/admin/plans');
        spinner.stop();
        if (options.json) { console.log(JSON.stringify(data, null, 2)); return; }
        const items = ((data.data || data.plans) as Array<Record<string, unknown>>) || [];
        if (items.length === 0) { console.log(chalk.yellow('No plans found')); return; }
        const rows = [['ID', 'Name', 'Slug', 'Monthly', 'Annual', 'Max Users', 'Active'], ...items.map((p: Record<string, unknown>) => [
          (p.id as string)?.substring(0, 8) + '...', p.name, p.slug,
          p.price_monthly_cents ? `¥${(Number(p.price_monthly_cents) / 100).toFixed(2)}` : '-',
          p.price_annual_cents ? `¥${(Number(p.price_annual_cents) / 100).toFixed(2)}` : '-',
          p.max_users, p.is_active ? chalk.green('Yes') : 'No',
        ])];
        console.log(chalk.bold('\nSubscription Plans'));
        console.log(table(rows));
      } catch (error) { spinner.fail('Failed'); console.error(chalk.red(error instanceof Error ? error.message : String(error))); process.exit(1); }
    });

  plansCmd.command('get')
    .description('Get plan details')
    .argument('<id>', 'Plan ID')
    .option('--json', 'Output as JSON')
    .action(async (id: string, options) => {
      const spinner = ora('Fetching plan...').start();
      try {
        const data = await apiFetch(`/api/admin/plans/${id}`);
        spinner.stop();
        if (options.json) { console.log(JSON.stringify(data, null, 2)); return; }
        const plan = (data.data || data) as Record<string, unknown>;
        console.log(chalk.bold(`\nPlan: ${plan.name}`));
        console.log(chalk.gray('─'.repeat(40)));
        console.log(`${chalk.bold('Slug:')} ${plan.slug}`);
        console.log(`${chalk.bold('Monthly:')} ¥${(Number(plan.price_monthly_cents) / 100).toFixed(2)}`);
        console.log(`${chalk.bold('Annual:')} ¥${(Number(plan.price_annual_cents) / 100).toFixed(2)}`);
        console.log(`${chalk.bold('Trial Days:')} ${plan.trial_days || 0}`);
        console.log(`${chalk.bold('Max Users:')} ${plan.max_users}`);
        console.log(`${chalk.bold('Max Workspaces:')} ${plan.max_workspaces}`);
        console.log(`${chalk.bold('Active:')} ${plan.is_active}`);
      } catch (error) { spinner.fail('Failed'); console.error(chalk.red(error instanceof Error ? error.message : String(error))); process.exit(1); }
    });

  // ═══ Subscriptions (工作区订阅管理) ═══
  const subsCmd = adminCmd.command('subscriptions').description('Workspace subscription management (工作区订阅管理)');

  subsCmd.command('list')
    .description('List workspace subscriptions')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const spinner = ora('Fetching subscriptions...').start();
      try {
        const data = await apiFetch('/api/admin/subscriptions');
        spinner.stop();
        if (options.json) { console.log(JSON.stringify(data, null, 2)); return; }
        const items = ((data.data || data.subscriptions) as Array<Record<string, unknown>>) || [];
        if (items.length === 0) { console.log(chalk.yellow('No subscriptions found')); return; }
        const rows = [['ID', 'Workspace ID', 'Plan', 'Status', 'Period Start', 'Period End'], ...items.map((s: Record<string, unknown>) => [
          (s.id as string)?.substring(0, 8) + '...', (s.workspace_id as string)?.substring(0, 8) + '...',
          s.plan_name || s.plan_id, s.status,
          s.current_period_start ? new Date(s.current_period_start as string).toLocaleDateString() : '-',
          s.current_period_end ? new Date(s.current_period_end as string).toLocaleDateString() : '-',
        ])];
        console.log(chalk.bold('\nWorkspace Subscriptions'));
        console.log(table(rows));
      } catch (error) { spinner.fail('Failed'); console.error(chalk.red(error instanceof Error ? error.message : String(error))); process.exit(1); }
    });

  subsCmd.command('usage')
    .description('Get workspace usage stats')
    .argument('<workspace-id>', 'Workspace ID')
    .option('--json', 'Output as JSON')
    .action(async (id: string, options) => {
      const spinner = ora('Fetching usage...').start();
      try {
        const data = await apiFetch(`/api/admin/subscriptions/usage/${id}`);
        spinner.stop();
        if (options.json) { console.log(JSON.stringify(data, null, 2)); return; }
        const u = (data.data || data) as Record<string, unknown>;
        console.log(chalk.bold(`\nUsage for Workspace: ${id.substring(0, 8)}...`));
        console.log(chalk.gray('─'.repeat(40)));
        Object.entries(u).forEach(([k, v]) => {
          if (k !== 'workspace_id') console.log(`${chalk.bold(k + ':')} ${typeof v === 'object' ? JSON.stringify(v) : v}`);
        });
      } catch (error) { spinner.fail('Failed'); console.error(chalk.red(error instanceof Error ? error.message : String(error))); process.exit(1); }
    });

  // ═══ Coupons (优惠券管理) ═══
  const couponsCmd = adminCmd.command('coupons').description('Coupon management (优惠券管理)');

  couponsCmd.command('list')
    .description('List coupons')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const spinner = ora('Fetching coupons...').start();
      try {
        const data = await apiFetch('/api/admin/coupons');
        spinner.stop();
        if (options.json) { console.log(JSON.stringify(data, null, 2)); return; }
        const items = ((data.data || data.coupons) as Array<Record<string, unknown>>) || [];
        if (items.length === 0) { console.log(chalk.yellow('No coupons found')); return; }
        const rows = [['ID', 'Name', 'Code', 'Type', 'Value', 'Used/Total', 'Active'], ...items.map((c: Record<string, unknown>) => [
          (c.id as string)?.substring(0, 8) + '...', c.name, c.code, c.type,
          c.type === 'percentage' ? `${c.value}%` : `¥${c.value}`, `${c.used_count || 0}/${c.total_count || '-'}`,
          c.is_active ? chalk.green('Yes') : 'No',
        ])];
        console.log(chalk.bold('\nCoupons'));
        console.log(table(rows));
      } catch (error) { spinner.fail('Failed'); console.error(chalk.red(error instanceof Error ? error.message : String(error))); process.exit(1); }
    });

  couponsCmd.command('create')
    .description('Create a coupon')
    .requiredOption('--name <name>', 'Coupon name')
    .requiredOption('--code <code>', 'Coupon code')
    .requiredOption('--type <type>', 'Type: percentage | fixed')
    .requiredOption('--value <value>', 'Discount value')
    .option('--min-amount <cents>', 'Minimum order amount (cents)')
    .option('--total-count <count>', 'Total available count')
    .option('--starts-at <datetime>', 'Start time (ISO)')
    .option('--expires-at <datetime>', 'Expiry time (ISO)')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const spinner = ora('Creating coupon...').start();
      try {
        const body: Record<string, unknown> = { name: options.name, code: options.code, type: options.type, value: Number(options.value) };
        if (options.minAmount) body.min_amount_cents = Number(options.minAmount);
        if (options.totalCount) body.total_count = Number(options.totalCount);
        if (options.startsAt) body.starts_at = options.startsAt;
        if (options.expiresAt) body.expires_at = options.expiresAt;
        const data = await apiFetch('/api/admin/coupons', { method: 'POST', body: JSON.stringify(body) });
        spinner.succeed('Coupon created');
        if (options.json) console.log(JSON.stringify(data, null, 2));
        else console.log(`${chalk.bold('Code:')} ${options.code}`);
      } catch (error) { spinner.fail('Failed'); console.error(chalk.red(error instanceof Error ? error.message : String(error))); process.exit(1); }
    });

  couponsCmd.command('delete')
    .description('Delete a coupon')
    .argument('<id>', 'Coupon ID')
    .action(async (id: string) => {
      const spinner = ora('Deleting coupon...').start();
      try { await apiFetch(`/api/admin/coupons/${id}`, { method: 'DELETE' }); spinner.succeed('Coupon deleted'); }
      catch (error) { spinner.fail('Failed'); console.error(chalk.red(error instanceof Error ? error.message : String(error))); process.exit(1); }
    });

  couponsCmd.command('distribute')
    .description('Distribute coupon to all users')
    .argument('<id>', 'Coupon ID')
    .option('--json', 'Output as JSON')
    .action(async (id: string, options) => {
      const spinner = ora('Distributing coupon...').start();
      try {
        const data = await apiFetch(`/api/admin/coupons/${id}/distribute`, { method: 'POST' });
        spinner.succeed('Coupon distributed');
        if (options.json) console.log(JSON.stringify(data, null, 2));
      } catch (error) { spinner.fail('Failed'); console.error(chalk.red(error instanceof Error ? error.message : String(error))); process.exit(1); }
    });

  // ═══ Announcements (系统公告) ═══
  const annCmd = adminCmd.command('announcements').description('System announcement management (系统公告)');

  annCmd.command('list')
    .description('List announcements')
    .option('--status <status>', 'Filter: active | expired')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const spinner = ora('Fetching announcements...').start();
      try {
        const params = new URLSearchParams();
        if (options.status) params.append('status', options.status);
        const data = await apiFetch(`/api/admin/announcements?${params.toString()}`);
        spinner.stop();
        if (options.json) { console.log(JSON.stringify(data, null, 2)); return; }
        const items = ((data.data || data.announcements) as Array<Record<string, unknown>>) || [];
        if (items.length === 0) { console.log(chalk.yellow('No announcements found')); return; }
        const rows = [['ID', 'Title', 'Type', 'Pinned', 'Status', 'Starts', 'Expires'], ...items.map((a: Record<string, unknown>) => [
          (a.id as string)?.substring(0, 8) + '...', (a.title as string)?.substring(0, 30), a.type || 'info',
          a.is_pinned ? '📌' : '-', a.is_active ? chalk.green('active') : 'expired',
          a.starts_at ? new Date(a.starts_at as string).toLocaleDateString() : '-',
          a.expires_at ? new Date(a.expires_at as string).toLocaleDateString() : '-',
        ])];
        console.log(chalk.bold('\nAnnouncements'));
        console.log(table(rows));
      } catch (error) { spinner.fail('Failed'); console.error(chalk.red(error instanceof Error ? error.message : String(error))); process.exit(1); }
    });

  annCmd.command('create')
    .description('Create an announcement')
    .requiredOption('--title <title>', 'Title')
    .requiredOption('--content <content>', 'Content')
    .option('--type <type>', 'Type: info | warning | success | error', 'info')
    .option('--target <target>', 'Target: all | workspace | user', 'all')
    .option('--pinned', 'Is pinned')
    .option('--starts-at <datetime>', 'Start time (ISO)')
    .option('--expires-at <datetime>', 'Expiry time (ISO)')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const spinner = ora('Creating announcement...').start();
      try {
        const body: Record<string, unknown> = { title: options.title, content: options.content, type: options.type, target: options.target, is_pinned: !!options.pinned };
        if (options.startsAt) body.starts_at = options.startsAt;
        if (options.expiresAt) body.expires_at = options.expiresAt;
        const data = await apiFetch('/api/admin/announcements', { method: 'POST', body: JSON.stringify(body) });
        spinner.succeed('Announcement created');
        if (options.json) console.log(JSON.stringify(data, null, 2));
        else console.log(`${chalk.bold('Title:')} ${options.title}`);
      } catch (error) { spinner.fail('Failed'); console.error(chalk.red(error instanceof Error ? error.message : String(error))); process.exit(1); }
    });

  annCmd.command('delete')
    .description('Delete an announcement')
    .argument('<id>', 'Announcement ID')
    .action(async (id: string) => {
      const spinner = ora('Deleting announcement...').start();
      try { await apiFetch(`/api/admin/announcements/${id}`, { method: 'DELETE' }); spinner.succeed('Announcement deleted'); }
      catch (error) { spinner.fail('Failed'); console.error(chalk.red(error instanceof Error ? error.message : String(error))); process.exit(1); }
    });

  // ═══ Orders (订单管理) ═══
  const ordersCmd = adminCmd.command('orders').description('Order management (订单管理)');

  ordersCmd.command('list')
    .description('List orders')
    .option('--status <status>', 'Filter by status')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const spinner = ora('Fetching orders...').start();
      try {
        const params = new URLSearchParams();
        if (options.status) params.append('status', options.status);
        const data = await apiFetch(`/api/admin/orders?${params.toString()}`);
        spinner.stop();
        if (options.json) { console.log(JSON.stringify(data, null, 2)); return; }
        const items = ((data.data || data.orders) as Array<Record<string, unknown>>) || [];
        if (items.length === 0) { console.log(chalk.yellow('No orders found')); return; }
        const rows = [['ID', 'Workspace', 'Amount', 'Status', 'Plan', 'Created'], ...items.map((o: Record<string, unknown>) => [
          (o.id as string)?.substring(0, 8) + '...', String(o.workspace_name || o.workspace_id || '').substring(0, 12), `¥${(Number(o.amount_cents || o.total_cents) / 100).toFixed(2)}`,
          o.status, o.plan_name || o.plan_id,
          o.created_at ? new Date(o.created_at as string).toLocaleDateString() : '-',
        ])];
        console.log(chalk.bold('\nOrders'));
        console.log(table(rows));
      } catch (error) { spinner.fail('Failed'); console.error(chalk.red(error instanceof Error ? error.message : String(error))); process.exit(1); }
    });

  ordersCmd.command('get')
    .description('Get order details')
    .argument('<id>', 'Order ID')
    .option('--json', 'Output as JSON')
    .action(async (id: string, options) => {
      const spinner = ora('Fetching order...').start();
      try {
        const data = await apiFetch(`/api/admin/orders/${id}`);
        spinner.stop();
        if (options.json) { console.log(JSON.stringify(data, null, 2)); return; }
        const o = (data.data || data) as Record<string, unknown>;
        console.log(chalk.bold('\nOrder Details:'));
        console.log(chalk.gray('─'.repeat(40)));
        console.log(`${chalk.bold('ID:')} ${o.id}`);
        console.log(`${chalk.bold('Status:')} ${o.status}`);
        console.log(`${chalk.bold('Amount:')} ¥${(Number(o.amount_cents || o.total_cents) / 100).toFixed(2)}`);
        console.log(`${chalk.bold('Created:')} ${o.created_at ? new Date(o.created_at as string).toLocaleString() : '-'}`);
      } catch (error) { spinner.fail('Failed'); console.error(chalk.red(error instanceof Error ? error.message : String(error))); process.exit(1); }
    });

  ordersCmd.command('refund')
    .description('Refund an order')
    .argument('<id>', 'Order ID')
    .option('--json', 'Output as JSON')
    .action(async (id: string, options) => {
      const spinner = ora('Processing refund...').start();
      try {
        const data = await apiFetch(`/api/admin/orders/${id}/refund`, { method: 'POST' });
        spinner.succeed('Refund processed');
        if (options.json) console.log(JSON.stringify(data, null, 2));
      } catch (error) { spinner.fail('Failed'); console.error(chalk.red(error instanceof Error ? error.message : String(error))); process.exit(1); }
    });

  ordersCmd.command('force-cancel')
    .description('Force cancel an order')
    .argument('<id>', 'Order ID')
    .option('--json', 'Output as JSON')
    .action(async (id: string, options) => {
      const spinner = ora('Force cancelling order...').start();
      try {
        const data = await apiFetch(`/api/admin/orders/${id}/force-cancel`, { method: 'POST' });
        spinner.succeed('Order force-cancelled');
        if (options.json) console.log(JSON.stringify(data, null, 2));
      } catch (error) { spinner.fail('Failed'); console.error(chalk.red(error instanceof Error ? error.message : String(error))); process.exit(1); }
    });

  // ═══ Compliance KB (合规知识库) ═══
  const kbCmd = adminCmd.command('compliance-kb').description('Compliance knowledge base (合规知识库)');

  kbCmd.command('list')
    .description('List compliance KB entries')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const spinner = ora('Fetching KB entries...').start();
      try {
        const data = await apiFetch('/api/admin/compliance-kb');
        spinner.stop();
        if (options.json) { console.log(JSON.stringify(data, null, 2)); return; }
        const items = ((data.data || data.entries) as Array<Record<string, unknown>>) || [];
        if (items.length === 0) { console.log(chalk.yellow('No KB entries found')); return; }
        const rows = [['ID', 'Category', 'Question', 'Published', 'Sort'], ...items.map((e: Record<string, unknown>) => [
          (e.id as string)?.substring(0, 8) + '...', e.category, (e.question as string)?.substring(0, 40),
          e.is_published ? chalk.green('Yes') : 'No', e.sort_order || 0,
        ])];
        console.log(chalk.bold('\nCompliance KB'));
        console.log(table(rows));
      } catch (error) { spinner.fail('Failed'); console.error(chalk.red(error instanceof Error ? error.message : String(error))); process.exit(1); }
    });

  kbCmd.command('create')
    .description('Create a compliance KB entry')
    .requiredOption('--category <cat>', 'Category: labor | tax | license | corporate | other')
    .requiredOption('--question <q>', 'Question')
    .requiredOption('--answer <a>', 'Answer')
    .option('--legal-basis <text>', 'Legal basis reference')
    .option('--tags <json>', 'JSON array of tags')
    .option('--published', 'Publish immediately')
    .option('--sort <order>', 'Sort order', '0')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const spinner = ora('Creating KB entry...').start();
      try {
        const body: Record<string, unknown> = { category: options.category, question: options.question, answer: options.answer, sort_order: Number(options.sort), is_published: !!options.published };
        if (options.legalBasis) body.legal_basis = options.legalBasis;
        if (options.tags) body.tags = JSON.parse(options.tags);
        const data = await apiFetch('/api/admin/compliance-kb', { method: 'POST', body: JSON.stringify(body) });
        spinner.succeed('KB entry created');
        if (options.json) console.log(JSON.stringify(data, null, 2));
        else console.log(`${chalk.bold('Question:')} ${options.question}`);
      } catch (error) { spinner.fail('Failed'); console.error(chalk.red(error instanceof Error ? error.message : String(error))); process.exit(1); }
    });

  kbCmd.command('delete')
    .description('Delete a compliance KB entry')
    .argument('<id>', 'Entry ID')
    .action(async (id: string) => {
      const spinner = ora('Deleting KB entry...').start();
      try { await apiFetch(`/api/admin/compliance-kb/${id}`, { method: 'DELETE' }); spinner.succeed('KB entry deleted'); }
      catch (error) { spinner.fail('Failed'); console.error(chalk.red(error instanceof Error ? error.message : String(error))); process.exit(1); }
    });

  // ═══ Tax Rules (税务规则管理) ═══
  const trCmd = adminCmd.command('tax-rules').description('Tax rule management (税务规则管理)');

  trCmd.command('list')
    .description('List tax rules')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const spinner = ora('Fetching tax rules...').start();
      try {
        const data = await apiFetch('/api/admin/tax-rules');
        spinner.stop();
        if (options.json) { console.log(JSON.stringify(data, null, 2)); return; }
        const items = ((data.data || data.rules) as Array<Record<string, unknown>>) || [];
        if (items.length === 0) { console.log(chalk.yellow('No tax rules found')); return; }
        const rows = [['ID', 'Name', 'Type', 'Priority', 'Active', 'Effective From'], ...items.map((r: Record<string, unknown>) => [
          (r.id as string)?.substring(0, 8) + '...', r.name, r.rule_type, r.priority || 0,
          r.is_active ? chalk.green('Yes') : 'No',
          r.effective_from ? new Date(r.effective_from as string).toLocaleDateString() : '-',
        ])];
        console.log(chalk.bold('\nTax Rules'));
        console.log(table(rows));
      } catch (error) { spinner.fail('Failed'); console.error(chalk.red(error instanceof Error ? error.message : String(error))); process.exit(1); }
    });

  // ═══ Revenue (营收分析) ═══
  const revCmd = adminCmd.command('revenue').description('Revenue analytics (营收分析)');

  revCmd.command('metrics')
    .description('Get revenue metrics (MRR/ARR/churn)')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const spinner = ora('Fetching revenue metrics...').start();
      try {
        const data = await apiFetch('/api/admin/revenue/metrics');
        spinner.stop();
        if (options.json) { console.log(JSON.stringify(data, null, 2)); return; }
        const m = (data.data || data.metrics || data) as Record<string, unknown>;
        console.log(chalk.bold('\nRevenue Metrics'));
        console.log(chalk.gray('─'.repeat(40)));
        if (m.mrr) console.log(`${chalk.bold('MRR:')} ¥${Number(m.mrr).toLocaleString()}`);
        if (m.arr) console.log(`${chalk.bold('ARR:')} ¥${Number(m.arr).toLocaleString()}`);
        if (m.churn_rate) console.log(`${chalk.bold('Churn Rate:')} ${m.churn_rate}`);
        if (m.total_revenue) console.log(`${chalk.bold('Total Revenue:')} ¥${Number(m.total_revenue).toLocaleString()}`);
        Object.entries(m).forEach(([k, v]) => {
          if (!['mrr', 'arr', 'churn_rate', 'total_revenue'].includes(k)) {
            console.log(`${chalk.bold(k + ':')} ${typeof v === 'object' ? JSON.stringify(v) : v}`);
          }
        });
      } catch (error) { spinner.fail('Failed'); console.error(chalk.red(error instanceof Error ? error.message : String(error))); process.exit(1); }
    });

  revCmd.command('usage')
    .description('Get platform usage stats')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const spinner = ora('Fetching usage stats...').start();
      try {
        const data = await apiFetch('/api/admin/revenue/usage');
        spinner.stop();
        if (options.json) { console.log(JSON.stringify(data, null, 2)); return; }
        const u = (data.data || data.usage || data) as Record<string, unknown>;
        console.log(chalk.bold('\nPlatform Usage'));
        console.log(chalk.gray('─'.repeat(40)));
        Object.entries(u).forEach(([k, v]) => console.log(`${chalk.bold(k + ':')} ${typeof v === 'object' ? JSON.stringify(v) : v}`));
      } catch (error) { spinner.fail('Failed'); console.error(chalk.red(error instanceof Error ? error.message : String(error))); process.exit(1); }
    });

}
