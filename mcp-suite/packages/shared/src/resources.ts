/**
 * Shared resource registry for SSOS
 * Used by both CLI (crud.ts) and MCP (core package)
 */

export interface ResourceConfig {
  apiPath: string;
  label?: string;
  actions?: string[];         // known special actions for --help
  noCrud?: boolean;           // true = no standard list/get/create/update/delete
  workspaceOptional?: boolean; // true = workspace header not required
  admin?: boolean;            // true = needs JWT superadmin auth
  method?: 'PUT' | 'PATCH';  // update method override (default PATCH)
}

/**
 * Resource Registry — maps resource names to API paths
 * 127 resources registered
 */
export const RESOURCES: Record<string, ResourceConfig> = {
  // === Accounting Core ===
  'accounts': { apiPath: '/api/accounts', label: '会计科目' },
  'journal-entries': { apiPath: '/api/journal-entries', label: '记账凭证', actions: ['submit-review', 'approve', 'reject', 'post', 'unpost', 'reverse'] },
  'accounting-periods': { apiPath: '/api/accounting-periods', label: '会计期间', actions: ['batch'] },
  'opening-balances': { apiPath: '/api/opening-balances', label: '期初余额', actions: ['batch', 'initialize-zero'] },
  'departments': { apiPath: '/api/departments', label: '部门' },
  'projects': { apiPath: '/api/projects', label: '项目' },
  'partners': { apiPath: '/api/partners', label: '往来单位' },
  'locks': { apiPath: '/api/locks', label: '乐观锁', actions: ['refresh'] },

  // === Reports (action-only) ===
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
  'auth-profile': { apiPath: '/api/auth/profile', label: '个人资料', noCrud: true, workspaceOptional: true, actions: ['sessions', 'security-log', 'settings', 'change-password', 'set-password', 'bind-email', 'bind-phone', 'bind-existing-account', 'upload-avatar', 'data-export', 'send-email-code', 'verify-email-code'] },
  'auth-mfa': { apiPath: '/api/auth/mfa', label: 'MFA多因素认证', noCrud: true, workspaceOptional: true, actions: ['status', 'setup', 'verify-setup', 'verify', 'disable', 'backup-codes'] },
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

/**
 * Get resource config by name
 * @throws Error if resource not found
 */
export function getResource(name: string): ResourceConfig {
  const cfg = RESOURCES[name];
  if (!cfg) {
    const names = Object.keys(RESOURCES).sort();
    const similar = names.filter(n => n.includes(name) || name.includes(n));
    const hint = similar.length > 0
      ? `\n\nDid you mean one of these?\n  ${similar.slice(0, 8).join('\n  ')}`
      : `\n\nAvailable resources:\n  ${names.slice(0, 20).join('\n  ')}\n  ... and ${names.length - 20} more`;
    throw new Error(`Unknown resource: "${name}".${hint}`);
  }
  return cfg;
}

/**
 * Check if resource supports CRUD operations
 * @throws Error if resource is action-only
 */
export function assertCrud(cfg: ResourceConfig, resource: string, operation: string): void {
  if (!cfg.noCrud) return;
  const actionsHint = cfg.actions?.length
    ? `\nAvailable actions: ${cfg.actions.join(', ')}`
    : '';
  throw new Error(
    `"${resource}" does not support ${operation} — it is an action-only resource. ` +
    `Use resource_action instead.${actionsHint}`
  );
}

/**
 * Get all CRUD-enabled resources
 */
export function getCrudResources(): string[] {
  return Object.entries(RESOURCES)
    .filter(([_, cfg]) => !cfg.noCrud)
    .map(([name, _]) => name);
}

/**
 * Get all action-only resources
 */
export function getActionOnlyResources(): string[] {
  return Object.entries(RESOURCES)
    .filter(([_, cfg]) => cfg.noCrud === true)
    .map(([name, _]) => name);
}
