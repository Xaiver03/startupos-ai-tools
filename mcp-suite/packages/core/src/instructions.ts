export const SSOS_CORE_INSTRUCTIONS = `SSOS Core MCP 服务器 - 认证、工作空间管理、API 密钥、通用 CRUD

**SSOS** (Startup OS) 是面向中国中小企业的 AI 驱动财务管理平台。

## 认证方式

1. **API Key 认证（推荐）** - 在环境变量中设置 SSOS_API_KEY
2. **用户名密码认证** - 使用 authenticate 工具登录

## 工具列表 (13 个)

### 认证管理 (3 个)

**authenticate** - 用户登录认证
参数: email (string, 必填), password (string, 必填)
返回: accessToken, refreshToken, user 信息

**refreshToken** - 刷新访问令牌
参数: refreshToken (string, 必填)
返回: 新的 accessToken

**logout** - 退出登录
参数: 无

### 工作空间管理 (3 个)

**getCurrentWorkspace** - 获取当前工作空间信息
参数: 无
返回: workspace 详细信息（公司名称、纳税人类型、会计准则等）

**listWorkspaces** - 列出用户所有工作空间
参数: 无
返回: workspace 数组

**switchWorkspace** - 切换到指定工作空间
参数: workspaceId (string, 必填)

### API 密钥管理 (3 个)

**createApiKey** - 创建新的 API 密钥
参数: name (string, 必填), expiresAt (string, 可选, ISO 8601 格式)
返回: apiKey (含密钥值，仅此一次显示)

**listApiKeys** - 列出所有 API 密钥
参数: 无
返回: apiKey 数组（不含密钥值）

**revokeApiKey** - 撤销指定 API 密钥
参数: apiKeyId (string, 必填)

### 通用 CRUD (4 个)

**universal_list** - 列出指定资源的所有记录
参数: resource (string, 必填, 127 种资源之一), filters (object, 可选)
支持的资源: accounts, journal_entries, employees, contracts, invoices, tax_returns, etc.

**universal_get** - 获取指定资源的单条记录
参数: resource (string, 必填), id (string, 必填)

**universal_create** - 创建新记录
参数: resource (string, 必填), data (object, 必填)

**universal_update** - 更新记录
参数: resource (string, 必填), id (string, 必填), data (object, 必填)

**universal_delete** - 删除记录
参数: resource (string, 必填), id (string, 必填)

**universal_batch** - 批量操作（创建/更新/删除）
参数: resource (string, 必填), operations (array, 必填)

**universal_search** - 全文搜索
参数: resource (string, 必填), query (string, 必填), filters (object, 可选)

## 支持的 127 种资源

**财务会计**: accounts, journal_entries, journal_entry_templates, account_balances, closing_entries, reports_balance_sheet, reports_income_statement, reports_cash_flow, reports_equity_changes

**发票管理**: invoices, invoice_items, invoice_payments, vat_invoice_requests, vat_invoice_ocr_results

**税务**: tax_returns, tax_calendars, tax_optimizations, vat_returns, income_tax_returns

**银行**: bank_accounts, bank_transactions, bank_reconciliations

**人力资源**: employees, payroll_runs, payroll_items, labor_contracts, attendance_records, reimbursements

**合同法务**: contracts, contract_reviews, demand_letters, legal_reminders

**AI 服务**: ai_bookkeeping_requests, ai_compliance_questions, ai_ocr_results, ai_learning_items

**系统**: workspaces, users, api_keys, notifications, subscriptions, audit_logs

... 等 127 种资源（完整列表见 API 文档）

## 使用场景

1. **初始化会话** - 先调用 authenticate 或使用 API Key 认证
2. **切换工作空间** - 使用 switchWorkspace 切换到目标公司
3. **通用操作** - 使用 universal_* 工具进行 CRUD 操作
4. **API 密钥管理** - 为集成应用创建和管理 API Key

## 典型工作流

\`\`\`
1. authenticate(email, password)  // 登录
2. listWorkspaces()               // 查看可用工作空间
3. switchWorkspace(workspaceId)   // 切换到目标工作空间
4. universal_list("accounts")     // 列出会计科目
5. universal_create("journal_entries", data)  // 创建凭证
\`\`\`

## 注意事项

- **认证优先级**: API Key > 用户名密码
- **工作空间隔离**: 所有数据按 workspace_id 隔离，切换工作空间后自动切换数据范围
- **限流**: API 调用限制 100 次/分钟
- **资源命名**: 使用 snake_case（如 journal_entries），不是 camelCase
- **ID 格式**: 所有 ID 为 UUID v4 格式
- **时间格式**: 使用 ISO 8601 格式（如 2026-06-08T12:00:00Z）

## API 端点

- 生产环境: https://api.finlaw.cloud
- 开发环境: http://localhost:4000
`;
