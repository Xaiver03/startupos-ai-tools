import { Command } from 'commander';
import { table } from 'table';
import chalk from 'chalk';
import ora from 'ora';
import { apiFetch } from '../lib/api-client.js';

// ============================================================
// Resource Registry — maps CLI resource names to API paths
// Every backend API endpoint group is registered here.
// ============================================================

interface ResourceConfig {
  apiPath: string;
  label?: string;
  actions?: string[];         // known special actions for --help
  noCrud?: boolean;           // true = no standard list/get/create/update/delete
  workspaceOptional?: boolean; // true = workspace header not required
  admin?: boolean;            // true = needs JWT superadmin auth
  method?: 'PUT' | 'PATCH';  // update method override (default PATCH)
}

const RESOURCES: Record<string, ResourceConfig> = {
  // === Accounting Core ===
  'accounts': { apiPath: '/api/accounts', label: '会计科目' },
  'journal-entries': { apiPath: '/api/journal-entries', label: '记账凭证', actions: ['submit-review', 'approve', 'reject', 'post', 'unpost', 'reverse'] },
  'accounting-periods': { apiPath: '/api/accounting-periods', label: '会计期间', actions: ['batch'] },
  'opening-balances': { apiPath: '/api/opening-balances', label: '期初余额', actions: ['batch', 'initialize-zero'] },
  'departments': { apiPath: '/api/departments', label: '部门' },
  'projects': { apiPath: '/api/projects', label: '项目' },
  'partners': { apiPath: '/api/partners', label: '往来单位' },
  'locks': { apiPath: '/api/locks', label: '乐观锁', actions: ['refresh'] },

  // === Reports ===
  'period-end': { apiPath: '/api/period-end', label: '期末处理', noCrud: true, actions: ['status', 'check-trial-balance', 'transfer-income', 'close'] },
  'general-ledger': { apiPath: '/api/general-ledger', label: '总账', noCrud: true, actions: ['trial-balance', 'account-balances', 'accounts'] },
  'reports': { apiPath: '/api/reports', label: '财务报表', noCrud: true, actions: ['cash-journal', 'bank-journal', 'trial-balance', 'general-ledger', 'account-balances', 'income-statement', 'trial-balance-diagnose', 'trial-balance-ai-explain'] },

  // === Tax Modules ===
  'annual-bonus': { apiPath: '/api/annual-bonus', label: '年终奖', actions: ['post'] },
  'severance-payments': { apiPath: '/api/severance-payments', label: '离职补偿金', actions: ['post'] },
  'labor-fee-payments': { apiPath: '/api/labor-fee-payments', label: '劳务费', actions: ['void'] },
  'dividend-payments': { apiPath: '/api/dividend-payments', label: '股息分红', actions: ['post'] },
  'pension-deductions': { apiPath: '/api/pension-deductions', label: '养老金扣除', actions: ['post'] },
  'pension-payments': { apiPath: '/api/pension-payments', label: '养老金缴纳', actions: ['post'] },
  'property-rental': { apiPath: '/api/property-rental', label: '财产租赁' },
  'property-transfer': { apiPath: '/api/property-transfer', label: '财产转让', actions: ['post'] },
  'royalty-income': { apiPath: '/api/royalty-income', label: '特许权使用费' },
  'incidental-income': { apiPath: '/api/incidental-income', label: '偶然所得', actions: ['post'] },
  'overseas-dispatch': { apiPath: '/api/overseas-dispatch', label: '海外派遣', workspaceOptional: true },
  'tech-achievements': { apiPath: '/api/tech-achievements', label: '科技成果转化', workspaceOptional: true },
  'discount-housing-sale': { apiPath: '/api/discount-housing-sale', label: '折扣售房', actions: ['post'] },
  'rd-expense-deductions': { apiPath: '/api/rd-expense-deductions', label: '研发费用加计扣除', actions: ['confirm', 'summary'], method: 'PUT' },
  'equity-incentive': { apiPath: '/api/equity-incentive', label: '股权激励', workspaceOptional: true },
  'employee-tax-deductions': { apiPath: '/api/employee-tax-deductions', label: '员工个税扣除' },
  'special-deductions': { apiPath: '/api/special-deductions', label: '专项附加扣除', actions: ['summary', 'export'] },
  'iit-filings': { apiPath: '/api/iit-filings', label: '个税申报', actions: ['mark-filed', 'pay', 'export-payroll', 'export-summary'] },
  'tax-loss-carryforward': { apiPath: '/api/tax-loss-carryforward', label: '亏损弥补', method: 'PUT' },
  'tax-calculations': { apiPath: '/api/tax-calculations', label: '税务计算' },
  'tax-filing-forms': { apiPath: '/api/tax-filing-forms', label: '税务申报表', actions: ['generate', 'confirm'], method: 'PUT' },
  'tax-compliance': { apiPath: '/api/tax-compliance', label: '税务合规' },
  'tax-calendar': { apiPath: '/api/tax-calendar', label: '税务日历', noCrud: true, actions: ['rules', 'configs', 'tasks', 'calendar'] },
  'tax': { apiPath: '/api/tax', label: '税务计算接口', noCrud: true, actions: ['vat', 'income-tax'] },

  // === HR & Payroll ===
  'employees': { apiPath: '/api/employees', label: '员工', actions: ['export'] },
  'payroll-records': { apiPath: '/api/payroll-records', label: '工资记录', actions: ['post', 'void', 'batch'] },
  'labor-contracts': { apiPath: '/api/labor-contracts', label: '劳动合同', actions: ['min-wage'], method: 'PUT' },

  // === Banking ===
  'bank-accounts': { apiPath: '/api/bank-accounts', label: '银行账户', actions: ['ai-parse'] },
  'bank-transactions': { apiPath: '/api/bank-transactions', label: '银行交易', actions: ['import'], method: 'PUT' },
  'reconciliation-records': { apiPath: '/api/reconciliation-records', label: '对账记录', actions: ['generate'] },
  'reconciliation-matches': { apiPath: '/api/reconciliation-matches', label: '对账匹配', actions: ['auto-match'] },
  'reconciliation-reports': { apiPath: '/api/reconciliation-reports', label: '对账报告', noCrud: true, actions: ['generate'] },
  'invoice-smart-reconciliation': { apiPath: '/api/invoice-smart-reconciliation', label: '发票智能对账', noCrud: true },

  // === VAT & Invoice ===
  'business-vat-invoices': { apiPath: '/api/business-vat-invoices', label: '增值税发票', actions: ['reverse', 'create-entry', 'batch-create-entries', 'batch-import', 'statistics'], method: 'PUT' },

  // === Expense ===
  'expense-claims': { apiPath: '/api/expense-claims', label: '报销申请', actions: ['suggest-category', 'scan-receipt', 'submit', 'approve', 'reject', 'reimburse'], method: 'PUT' },
  'expense-categories': { apiPath: '/api/expense-categories', label: '费用类别', actions: ['initialize'], method: 'PUT' },

  // === Contracts & Legal ===
  'contracts': { apiPath: '/api/contracts', label: '合同', actions: ['generate', 'validate', 'expiring'], method: 'PUT' },
  'contract-reviews': { apiPath: '/api/contract-reviews', label: '合同审查', actions: ['playbooks'] },
  'contract-risk': { apiPath: '/api/contract-risk', label: '合同风险' },
  'contract-comparisons': { apiPath: '/api/contract-comparisons', label: '合同对比' },
  'contract-templates': { apiPath: '/api/contract-templates', label: '合同模板' },
  'contract-clauses': { apiPath: '/api/contract-clauses', label: '合同条款' },
  'contract-reminders': { apiPath: '/api/contract-reminders', label: '合同提醒', actions: ['auto-generate', 'renew', 'batch-renew'], method: 'PUT' },
  'demand-letters': { apiPath: '/api/demand-letters', label: '催款函', actions: ['legal-path'] },
  'legal-reminders': { apiPath: '/api/legal-reminders', label: '法律提醒' },
  'compliance-qa': { apiPath: '/api/compliance-qa', label: '合规问答' },
  'algorithm-appeals': { apiPath: '/api/algorithm-appeals', label: '算法申诉' },

  // === AI ===
  'ai-configurations': { apiPath: '/api/ai-configurations', label: 'AI配置', actions: ['allowed-models', 'active', 'set-default'] },
  'prompt-modules': { apiPath: '/api/prompt-modules', label: 'Prompt模块', actions: ['vectorize', 'vectorize-all'], method: 'PUT' },
  'ai-prompt-templates': { apiPath: '/api/ai-prompt-templates', label: 'AI Prompt模板', noCrud: true },
  'ai-conversations': { apiPath: '/api/ai/conversations', label: 'AI对话' },
  'ai-analytics': { apiPath: '/api/ai/analytics', label: 'AI分析', noCrud: true },
  'ai-bookkeeping': { apiPath: '/api/ai/bookkeeping', label: 'AI记账', noCrud: true, actions: ['generate', 'vectorize-learning-case'] },

  // === Workspace ===
  'workspaces': { apiPath: '/api/workspaces', label: '工作区', actions: ['smart-fill', 'revenue-status', 'dismiss-alert', 'my-role'] },
  'workspace-members': { apiPath: '/api/workspace-members', label: '工作区成员', actions: ['invite', 'me'] },

  // === Platform Features ===
  'notifications': { apiPath: '/api/notifications', label: '通知', actions: ['unread-count', 'read-all'] },
  'invitations': { apiPath: '/api/invitations', label: '邀请', noCrud: true, actions: ['validate', 'send', 'accept', 'pending', 'bulk'] },
  'api-keys': { apiPath: '/api/api-keys', label: 'API密钥', actions: ['toggle'] },
  'documents': { apiPath: '/api/documents', label: '文档' },
  'announcements': { apiPath: '/api/announcements', label: '公告', noCrud: true },
  'push-tokens': { apiPath: '/api/push-tokens', label: '推送令牌' },
  'user-custom-tasks': { apiPath: '/api/user-custom-tasks', label: '自定义任务', actions: ['toggle'] },
  'audit-logs': { apiPath: '/api/audit-logs', label: '审计日志', noCrud: true },

  // === Orders & Billing ===
  'orders': { apiPath: '/api/orders', label: '订单', actions: ['cancel', 'refund', 'vat-invoice'] },
  'subscription': { apiPath: '/api/subscription', label: '订阅', noCrud: true },
  'plans': { apiPath: '/api/plans', label: '套餐', noCrud: true },
  'payment': { apiPath: '/api/payment', label: '支付', noCrud: true, actions: ['create-order', 'notify', 'refund-notify'] },
  'coupons': { apiPath: '/api/coupons', label: '优惠券', noCrud: true, actions: ['my', 'available', 'redeem', 'count'] },
  'referrals': { apiPath: '/api/referrals', label: '推荐', noCrud: true, actions: ['my-code', 'stats', 'apply'] },

  // === Other ===
  'ocr': { apiPath: '/api/ocr', label: 'OCR识别', noCrud: true, actions: ['process'] },
  'batch-processing': { apiPath: '/api/batch', label: '批处理', noCrud: true, actions: ['ocr'] },
  'storage': { apiPath: '/api/storage', label: '文件存储', noCrud: true, actions: ['upload'] },
  'prefetch': { apiPath: '/api/prefetch', label: '预加载', noCrud: true, actions: ['dashboard'] },
  'analytics': { apiPath: '/api/analytics', label: '数据分析', noCrud: true },
  'dashboard-layout': { apiPath: '/api/dashboard', label: '仪表盘布局', actions: ['templates'], method: 'PUT' },
  'chat': { apiPath: '/api/chat', label: '聊天机器人', noCrud: true, actions: ['message', 'history', 'health'] },
  'rpc': { apiPath: '/api/rpc', label: 'RPC调用', noCrud: true },
  'wx': { apiPath: '/api/wx', label: '微信服务', noCrud: true, actions: ['verify', 'event'] },

  // === Auth ===
  'auth': { apiPath: '/api/auth', label: '认证', noCrud: true, workspaceOptional: true, actions: ['login', 'register', 'refresh', 'logout', 'send-register-code', 'verify-email', 'forgot-password', 'reset-password', 'wx-login'] },

  // === Auth Profile ===
  'auth-profile': { apiPath: '/api/auth/profile', label: '个人资料', noCrud: true, workspaceOptional: true, actions: ['sessions', 'security-log', 'settings', 'change-password', 'set-password', 'bind-email', 'bind-phone', 'bind-existing-account', 'upload-avatar', 'data-export', 'send-email-code', 'verify-email-code'] },

  // === Auth MFA ===
  'auth-mfa': { apiPath: '/api/auth/mfa', label: 'MFA多因素认证', noCrud: true, workspaceOptional: true, actions: ['status', 'setup', 'verify-setup', 'verify', 'disable', 'backup-codes'] },

  // === Auth QR Login ===
  'auth-qr': { apiPath: '/api/auth/qr', label: '扫码登录', noCrud: true, workspaceOptional: true, actions: ['initiate', 'confirm'] },

  // === Help (public) ===
  'help': { apiPath: '/api/help', label: '帮助中心', noCrud: true, workspaceOptional: true, actions: ['faqs', 'guides', 'feedback', 'tickets', 'search-log'] },

  // === Public ===
  'public-doc-articles': { apiPath: '/api/docs', label: '公开文档', noCrud: true, workspaceOptional: true },
  'public-landing-page': { apiPath: '/api/public/landing-page', label: '落地页', noCrud: true, workspaceOptional: true },

  // === My (employee self-service) ===
  'my-payslips': { apiPath: '/api/my/payslips', label: '我的工资条' },
  'my-expense-claims': { apiPath: '/api/my/expense-claims', label: '我的报销', actions: ['submit'] },
  'my-expense-categories': { apiPath: '/api/my/expense-categories', label: '费用类别(员工)', noCrud: true },

  // === Admin ===
  'admin-users': { apiPath: '/api/admin/users', label: '管理-用户', admin: true, actions: ['ban', 'unban', 'reset-password', 'toggle-admin'] },
  'admin-roles': { apiPath: '/api/admin/roles', label: '管理-角色', admin: true, actions: ['permissions', 'users'], method: 'PUT' },
  'admin-me': { apiPath: '/api/admin/me', label: '管理-我的权限', admin: true, noCrud: true, actions: ['permissions'] },
  'admin-tenants': { apiPath: '/api/admin/tenants', label: '管理-租户', admin: true, actions: ['suspend', 'activate'] },
  'admin-plans': { apiPath: '/api/admin/plans', label: '管理-套餐', admin: true },
  'admin-subscriptions': { apiPath: '/api/admin/subscriptions', label: '管理-订阅', admin: true, actions: ['usage'] },
  'admin-invoices': { apiPath: '/api/admin/invoices', label: '管理-发票', admin: true, noCrud: true },
  'admin-revenue': { apiPath: '/api/admin/revenue', label: '管理-收入', admin: true, noCrud: true, actions: ['metrics', 'usage'] },
  'admin-monitoring': { apiPath: '/api/admin/monitoring', label: '管理-监控', admin: true, noCrud: true, actions: ['overview', 'growth', 'top-tenants', 'email-otp-stats'] },
  'admin-announcements': { apiPath: '/api/admin/announcements', label: '管理-公告', admin: true },
  'admin-ai-config': { apiPath: '/api/admin/ai-config', label: '管理-AI配置', admin: true, actions: ['global', 'test', 'models', 'balance', 'failover-chain', 'allowed-models'] },
  'admin-orders': { apiPath: '/api/admin/orders', label: '管理-订单', admin: true, actions: ['refund', 'force-cancel'] },
  'admin-coupons': { apiPath: '/api/admin/coupons', label: '管理-优惠券', admin: true, actions: ['distribute'] },
  'admin-promotions': { apiPath: '/api/admin/promotions', label: '管理-促销', admin: true },
  'admin-tax-rules': { apiPath: '/api/admin/tax-rules', label: '管理-税务规则', admin: true, actions: ['versions'], method: 'PUT' },
  'admin-tax-rate-config': { apiPath: '/api/admin/tax-rate-config', label: '管理-税率配置', admin: true, method: 'PUT' },
  'admin-tax-calendar': { apiPath: '/api/admin/tax-calendar', label: '管理-税务日历', admin: true, noCrud: true, actions: ['periods', 'events', 'bulk-import', 'regenerate-all'] },
  'admin-compliance-kb': { apiPath: '/api/admin/compliance-kb', label: '管理-合规知识库', admin: true, actions: ['vectorize-all'], method: 'PUT' },
  'admin-vat-invoices': { apiPath: '/api/admin/vat-invoices', label: '管理-增值税发票', admin: true, method: 'PUT' },
  'admin-invoice-audit-logs': { apiPath: '/api/admin/invoice-audit-logs', label: '管理-发票审计日志', admin: true, noCrud: true, actions: ['stats'] },
  'admin-workspaces': { apiPath: '/api/admin/workspaces', label: '管理-工作区', admin: true, noCrud: true },
  'admin-settings': { apiPath: '/api/admin/settings', label: '管理-系统设置', admin: true, method: 'PUT' },
  'admin-landing-page': { apiPath: '/api/admin/landing-page', label: '管理-落地页', admin: true, noCrud: true, method: 'PUT' },
  'admin-algorithm-audit': { apiPath: '/api/admin/algorithm-audit', label: '管理-算法审计', admin: true, noCrud: true, actions: ['logs', 'stats', 'refresh'] },
  'admin-doc-articles': { apiPath: '/api/admin/doc-articles', label: '管理-文档文章', admin: true, method: 'PUT' },
  'admin-help': { apiPath: '/api/admin/help', label: '管理-帮助中心', admin: true, noCrud: true, actions: ['faqs', 'guides', 'feedback', 'tickets', 'search-analytics'], method: 'PUT' },

  // === OAuth ===
  'oauth': { apiPath: '/oauth', label: 'OAuth', noCrud: true, workspaceOptional: true, actions: ['authorize', 'token'] },
};

// ============================================================
// Helpers
// ============================================================

function getResource(name: string): ResourceConfig {
  const cfg = RESOURCES[name];
  if (!cfg) {
    const names = Object.keys(RESOURCES).sort();
    const similar = names.filter(n => n.includes(name) || name.includes(n));
    const hint = similar.length > 0
      ? `\n\nDid you mean one of these?\n  ${similar.slice(0, 8).join('\n  ')}`
      : `\n\nAvailable resources:\n  ${names.join('\n  ')}`;
    throw new Error(`Unknown resource: "${name}".${hint}`);
  }
  return cfg;
}

function assertCrud(cfg: ResourceConfig, resource: string, operation: string): void {
  if (!cfg.noCrud) return;
  const actionsHint = cfg.actions?.length
    ? `\nAvailable actions: ${cfg.actions.join(', ')}`
    : '';
  throw new Error(
    `"${resource}" does not support ${operation} — it is an action-only resource. ` +
    `Use "crud action ${resource} <action>" instead.${actionsHint}`
  );
}

function extractItems(data: Record<string, unknown>): Array<Record<string, unknown>> {
  // Try common array keys
  for (const key of ['data', 'items', 'records', 'results', 'list', 'entries']) {
    const val = data[key];
    if (Array.isArray(val)) return val as Array<Record<string, unknown>>;
  }
  // If the top-level is an array
  if (Array.isArray(data)) return data as unknown as Array<Record<string, unknown>>;
  // If any value is an array, return it
  for (const val of Object.values(data)) {
    if (Array.isArray(val)) return val as Array<Record<string, unknown>>;
  }
  // Single object — wrap in array
  if (Object.keys(data).length > 0) return [data];
  return [];
}

function extractSingle(data: Record<string, unknown>): Record<string, unknown> {
  for (const key of ['data', 'item', 'record', 'result']) {
    const val = data[key];
    if (val && typeof val === 'object' && !Array.isArray(val)) return val as Record<string, unknown>;
  }
  return data;
}

function autoTable(items: Array<Record<string, unknown>>): string {
  if (items.length === 0) return chalk.yellow('(empty)');
  // Pick columns that appear in most items
  const allKeys = new Set<string>();
  for (const item of items) {
    for (const key of Object.keys(item)) {
      if (item[key] !== null && item[key] !== undefined && typeof item[key] !== 'object') {
        allKeys.add(key);
      }
    }
  }
  // Prioritize common columns
  const priority = ['id', 'name', 'title', 'display_name', 'email', 'status', 'type', 'amount', 'created_at', 'updated_at'];
  const columns = [...priority.filter(k => allKeys.has(k)), ...Array.from(allKeys).filter(k => !priority.includes(k))].slice(0, 8);

  const rows = [
    columns.map(c => chalk.bold(c)),
    ...items.map(item =>
      columns.map(c => {
        const v = item[c];
        if (v === null || v === undefined) return '-';
        if (typeof v === 'string' && v.length > 40) return v.substring(0, 37) + '...';
        return String(v);
      })
    ),
  ];
  return table(rows);
}

function displaySingle(rec: Record<string, unknown>): void {
  const maxKeyLen = Math.max(...Object.keys(rec).map(k => k.length));
  for (const [key, value] of Object.entries(rec)) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'object') {
      console.log(`${chalk.bold(key.padEnd(maxKeyLen))}  ${JSON.stringify(value)}`);
    } else {
      const numVal = Number(value);
      const isAmount = key.endsWith('net_salary') || key.endsWith('amount') || key.endsWith('total');
      const displayVal = isAmount && !isNaN(numVal)
        ? chalk.green(`¥${numVal.toLocaleString()}`)
        : String(value);
      console.log(`${chalk.bold(key.padEnd(maxKeyLen))}  ${displayVal}`);
    }
  }
}

// ============================================================
// Generic CRUD Commands
// ============================================================

export function createCrudCommand(): Command {
  const crudCmd = new Command('crud')
    .description('Universal CRUD operations (通用增删改查) — works on any registered resource');

  // ---- LIST ----
  crudCmd
    .command('list')
    .description('List resources (GET collection)')
    .argument('<resource>', 'Resource name (e.g., accounts, annual-bonus, employees)')
    .option('-w, --workspace <id>', 'Workspace ID')
    .option('--page <n>', 'Page number', '1')
    .option('--limit <n>', 'Items per page', '20')
    .option('--search <text>', 'Search query')
    .option('--status <status>', 'Filter by status')
    .option('--filters <json>', 'Additional query params as JSON')
    .option('--json', 'Output as raw JSON')
    .action(async (resource: string, options) => {
      const cfg = getResource(resource);
      assertCrud(cfg, resource, 'list');
      const spinner = ora(`Listing ${resource}...`).start();
      try {
        const params = new URLSearchParams();
        if (options.workspace) params.append('workspace_id', options.workspace);
        if (options.page !== '1') params.append('page', options.page);
        if (options.limit !== '20') params.append('limit', options.limit);
        if (options.search) params.append('search', options.search);
        if (options.status) params.append('status', options.status);
        if (options.filters) {
          const extra = JSON.parse(options.filters);
          for (const [k, v] of Object.entries(extra)) {
            params.append(k, String(v));
          }
        }
        const qs = params.toString();
        const data = await apiFetch(`${cfg.apiPath}${qs ? '?' + qs : ''}`);
        spinner.stop();
        if (options.json) { console.log(JSON.stringify(data, null, 2)); return; }
        const items = extractItems(data);
        console.log(chalk.bold(`\n${cfg.label || resource} — ${items.length} results`));
        console.log(autoTable(items));
      } catch (error) {
        spinner.fail('Failed');
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  // ---- GET ----
  crudCmd
    .command('get')
    .description('Get a single resource by ID')
    .argument('<resource>', 'Resource name')
    .argument('<id>', 'Resource ID')
    .option('-w, --workspace <id>', 'Workspace ID')
    .option('--json', 'Output as raw JSON')
    .action(async (resource: string, id: string, options) => {
      const cfg = getResource(resource);
      assertCrud(cfg, resource, 'get');
      const spinner = ora(`Getting ${resource} ${id}...`).start();
      try {
        const data = await apiFetch(`${cfg.apiPath}/${encodeURIComponent(id)}`);
        spinner.stop();
        if (options.json) { console.log(JSON.stringify(data, null, 2)); return; }
        const rec = extractSingle(data);
        console.log(chalk.bold(`\n${cfg.label || resource} — ${id}`));
        console.log(chalk.gray('─'.repeat(50)));
        displaySingle(rec);
      } catch (error) {
        spinner.fail('Failed');
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  // ---- CREATE ----
  crudCmd
    .command('create')
    .description('Create a new resource (POST)')
    .argument('<resource>', 'Resource name')
    .requiredOption('--data <json>', 'Resource data as JSON string')
    .option('-w, --workspace <id>', 'Workspace ID')
    .option('--json', 'Output as raw JSON')
    .action(async (resource: string, options) => {
      const cfg = getResource(resource);
      assertCrud(cfg, resource, 'create');
      const spinner = ora(`Creating ${resource}...`).start();
      try {
        const body = JSON.parse(options.data);
        if (options.workspace && !body.workspace_id) {
          body.workspace_id = options.workspace;
        }
        const data = await apiFetch(cfg.apiPath, {
          method: 'POST',
          body: JSON.stringify(body),
        });
        spinner.succeed(`${resource} created`);
        if (options.json) { console.log(JSON.stringify(data, null, 2)); return; }
        const rec = extractSingle(data);
        console.log(chalk.gray('─'.repeat(50)));
        displaySingle(rec);
      } catch (error) {
        spinner.fail('Failed');
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  // ---- UPDATE ----
  crudCmd
    .command('update')
    .description('Update a resource (PATCH/PUT)')
    .argument('<resource>', 'Resource name')
    .argument('<id>', 'Resource ID')
    .requiredOption('--data <json>', 'Fields to update as JSON')
    .option('-w, --workspace <id>', 'Workspace ID')
    .option('--json', 'Output as raw JSON')
    .action(async (resource: string, id: string, options) => {
      const cfg = getResource(resource);
      assertCrud(cfg, resource, 'update');
      const method = cfg.method === 'PUT' ? 'PUT' : 'PATCH';
      const spinner = ora(`Updating ${resource} ${id}...`).start();
      try {
        const body = JSON.parse(options.data);
        const data = await apiFetch(`${cfg.apiPath}/${encodeURIComponent(id)}`, {
          method,
          body: JSON.stringify(body),
        });
        spinner.succeed(`${resource} updated`);
        if (options.json) { console.log(JSON.stringify(data, null, 2)); return; }
        const rec = extractSingle(data);
        displaySingle(rec);
      } catch (error) {
        spinner.fail('Failed');
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  // ---- DELETE ----
  crudCmd
    .command('delete')
    .description('Delete a resource')
    .argument('<resource>', 'Resource name')
    .argument('<id>', 'Resource ID')
    .option('-w, --workspace <id>', 'Workspace ID')
    .option('--yes', 'Skip confirmation')
    .option('--json', 'Output as raw JSON')
    .action(async (resource: string, id: string, options) => {
      const cfg = getResource(resource);
      assertCrud(cfg, resource, 'delete');
      if (!options.yes) {
        console.log(chalk.yellow(`\n⚠ About to delete ${resource} (ID: ${id})`));
        console.log('Add --yes to skip confirmation.\n');
        process.exit(0);
      }
      const spinner = ora(`Deleting ${resource} ${id}...`).start();
      try {
        const data = await apiFetch(`${cfg.apiPath}/${encodeURIComponent(id)}`, { method: 'DELETE' });
        spinner.succeed(`${resource} ${id} deleted`);
        if (options.json) console.log(JSON.stringify(data, null, 2));
      } catch (error) {
        spinner.fail('Failed');
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  // ---- ACTION ----
  crudCmd
    .command('action')
    .description('Execute a special action on a resource (e.g., post, submit, approve, summary)')
    .argument('<resource>', 'Resource name')
    .argument('<action>', 'Action name (e.g., post, submit, summary, overview)')
    .option('--id <id>', 'Resource ID (if action targets a specific resource)')
    .option('--data <json>', 'Request body as JSON')
    .option('--method <method>', 'HTTP method (default: GET for action-only, POST for CRUD resources)')
    .option('--query <string>', 'Query string to append')
    .option('-w, --workspace <id>', 'Workspace ID')
    .option('--json', 'Output as raw JSON')
    .action(async (resource: string, action: string, options) => {
      const cfg = getResource(resource);
      const method = (options.method || (cfg.noCrud ? 'GET' : 'POST')).toUpperCase();
      const spinner = ora(`Executing ${action} on ${resource}...`).start();
      try {
        let url: string;
        if (options.id) {
          url = `${cfg.apiPath}/${encodeURIComponent(options.id)}/${action}`;
        } else {
          url = `${cfg.apiPath}/${action}`;
        }
        if (options.query) url += '?' + options.query;

        const fetchOpts: RequestInit = { method };
        if (options.data) {
          const body = JSON.parse(options.data);
          if (options.workspace && !body.workspace_id) {
            body.workspace_id = options.workspace;
          }
          fetchOpts.body = JSON.stringify(body);
        }

        const data = await apiFetch(url, fetchOpts);
        spinner.succeed(`${action} completed`);
        if (options.json) { console.log(JSON.stringify(data, null, 2)); return; }
        const items = extractItems(data);
        if (items.length > 0 && items[0] && Object.keys(items[0]).length > 1) {
          console.log(autoTable(items));
        } else {
          displaySingle(data as Record<string, unknown>);
        }
      } catch (error) {
        spinner.fail('Failed');
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  // ---- resources (list all registered resources) ----
  crudCmd
    .command('resources')
    .description('List all registered resources')
    .option('--search <text>', 'Filter by name')
    .action(async (options) => {
      let entries = Object.entries(RESOURCES);
      if (options.search) {
        const q = options.search.toLowerCase();
        entries = entries.filter(([name, cfg]) =>
          name.includes(q) || (cfg.label && cfg.label.includes(q))
        );
      }
      const rows = [
        [chalk.bold('Resource'), chalk.bold('API Path'), chalk.bold('Label'), chalk.bold('Features')],
        ...entries.map(([name, cfg]) => [
          chalk.green(name),
          cfg.apiPath,
          cfg.label || '-',
          [
            cfg.noCrud ? 'actions-only' : 'CRUD',
            cfg.admin ? 'admin' : '',
            cfg.actions?.length ? `actions:${cfg.actions.join(',')}` : '',
          ].filter(Boolean).join(' '),
        ]),
      ];
      console.log(chalk.bold(`\nRegistered Resources — ${entries.length} total\n`));
      console.log(table(rows));
      console.log(chalk.gray('\nUsage: ssos-cli crud list|get|create|update|delete|action <resource> [...]'));
    });

  return crudCmd;
}
