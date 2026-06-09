---
name: ssos-cli
description: SSOS CLI tool usage guide — server-side command line interface for SSOS financial management system. Covers all 20+ command groups across accounting, tax, banking, invoice, HR, expense, legal, AI bookkeeping, period management, auth, workspace, and API key operations.
author: Claude
version: 1.0.0
model: sonnet
tags:
  - ssos
  - cli
  - finance
  - accounting
  - tax
  - hr
  - legal
  - api
---

# SSOS CLI Skill

Server-side CLI tool for SSOS (Startup OS) — AI-powered financial management for Chinese SMEs.

## Quick Start

```bash
# Install dependencies
cd ai-tools/cli && npm install && npm run build

# Authenticate via environment variables (recommended)
export SSOS_API_KEY="sk_live_xxx"
export SSOS_WORKSPACE_ID="workspace-xxx"
export API_URL="https://api.finlaw.cloud"

# Or interactive login
ssos-cli auth login --api-key sk_live_xxx

# Verify
ssos-cli auth status
ssos-cli workspace-api current
```

### 双认证模式

| 认证方式 | Token | Env Var | 中间件 | 适用命令 |
|---------|-------|---------|--------|---------|
| API Key | `Bearer sk_live_...` | `SSOS_API_KEY` | apiKeyMiddleware → roleGuard | accounting, banking, expense, hr, invoice, period, tax, legal, ai-bookkeeping |
| JWT (用户) | `Bearer <jwt>` | `SSOS_ACCESS_TOKEN` | authMiddleware → roleGuard | 同上 + auth login |
| JWT (超管) | `Bearer <jwt>` | `SSOS_ACCESS_TOKEN` | superAdminMiddleware | admin * (管理后台) |

### 两种 Workspace 选项模式

| 模式 | 命令 | 行为 |
|------|------|------|
| `-w, --workspace <id>` 必填 | accounting, banking, invoice, period, tax calendar/calculations/filings, ai-bookkeeping, expense list | 需显式传递 |
| 无 `-w` 选项，使用 `SSOS_WORKSPACE_ID` 环境变量 | expense get, hr get 系列, period get, legal 全部, workspace-api 全部, api-key 全部, auth | 从 env 自动获取 |

### 两种数据访问架构

| 架构 | 命令 | 认证 |
|------|------|------|
| API 命令 | accounting, tax, banking, invoice, hr, expense, legal, ai-bookkeeping, period, workspace-api, api-key | Bearer Token |
| DB 直连 | db, users, workspace, files | PostgreSQL 直连 (需 SSH tunnel 或本地数据库) |

## Authentication

### Login
```bash
# API Key (recommended)
ssos-cli auth login --api-key sk_live_xxxxxxxxxxxxxx

# Email + Password
ssos-cli auth login --email user@example.com --password xxx

# JWT Token (admin access)
ssos-cli auth login --token <jwt>

# Check status
ssos-cli auth status

# Logout
ssos-cli auth logout
```

### Environment Variables
| Variable | Description |
|----------|-------------|
| `SSOS_API_KEY` | API Key for workspace-scoped access |
| `SSOS_ACCESS_TOKEN` | JWT token for admin access |
| `SSOS_WORKSPACE_ID` | Default workspace ID |
| `API_URL` | API base URL (default: https://api.finlaw.cloud) |

## Admin (管理后台)

**权限**: 需要 JWT 认证（`SSOS_ACCESS_TOKEN` 或 `auth login --token <jwt>`）
**文件**: `ai-tools/cli/src/commands/admin.ts` (~400 行)

### 权限与身份
```bash
# 显示当前管理员权限和角色
ssos-cli admin whoami
```

### 用户管理
```bash
# 列出所有用户
ssos-cli admin users list
ssos-cli admin users list --page 1 --limit 20 --search "email" --status active

# 获取用户详情
ssos-cli admin users get <user-id>

# 封禁/解封用户
ssos-cli admin users ban <user-id>
ssos-cli admin users unban <user-id>

# 重置用户密码
ssos-cli admin users reset-password <user-id> --password "newpassword"
```

### 租户管理
```bash
# 列出所有工作区
ssos-cli admin tenants list
ssos-cli admin tenants list --page 1 --limit 20 --status active

# 获取租户详情
ssos-cli admin tenants get <tenant-id>

# 暂停/激活工作区
ssos-cli admin tenants suspend <tenant-id>
ssos-cli admin tenants activate <tenant-id>
```

### 系统监控
```bash
# 系统概览
ssos-cli admin monitoring overview

# 增长数据
ssos-cli admin monitoring growth --days 30

# 活跃租户排行
ssos-cli admin monitoring top-tenants --limit 10
```

### 系统设置
```bash
# 列出所有设置
ssos-cli admin settings list

# 获取单个设置
ssos-cli admin settings get <key>

# 设置值
ssos-cli admin settings set <key> --value '{"enabled":true}'

# 批量设置
ssos-cli admin settings batch --items '[{"key":"a","value":1}]'
```

## Workspace Management

```bash
# List workspaces
ssos-cli workspace-api list

# Switch workspace
ssos-cli workspace-api switch <workspace-id>

# Current workspace
ssos-cli workspace-api current

# Workspace settings
ssos-cli workspace-api settings

# Workspace members
ssos-cli workspace-api members -w <workspace-id>
```

## Accounting (会计)

### Journal Entries (凭证)
```bash
# List journal entries
ssos-cli accounting journal-list -w <workspace-id> --json
ssos-cli accounting journal-list -w <id> -s 2026-01-01 -e 2026-12-31 --status posted

# Get journal entry details
ssos-cli accounting journal-get <entry-id>

# Create journal entry
ssos-cli accounting journal-create \
  -w <workspace-id> \
  -d 2026-06-15 \
  --desc "收到客户货款" \
  --lines '[{"account_code":"1002","debit_amount":50000,"description":"银行存款"},{"account_code":"1122","credit_amount":50000,"description":"应收账款"}]'

# Update journal entry
ssos-cli accounting journal-update <entry-id> -d 2026-06-16 --desc "更新描述"

# Delete journal entry
ssos-cli accounting journal-delete <entry-id>

# Reverse journal entry (冲红)
ssos-cli accounting journal-reverse <entry-id> -d 2026-06-16
```

### Accounts (科目)
```bash
# List chart of accounts
ssos-cli accounting account-list -w <workspace-id>
ssos-cli accounting account-list -w <id> --account_type asset

# Get account details
ssos-cli accounting account-get <account-id>

# Create account
ssos-cli accounting account-create \
  -w <workspace-id> \
  --code 1001 \
  --name "库存现金" \
  --account_type asset \
  --balance_direction debit

# Get account balance (account_code is positional argument)
ssos-cli accounting account-balance 1001 -w <workspace-id>
ssos-cli accounting account-balance 1002 -w <workspace-id> -s 2026-01-01 -e 2026-06-30

# Update account
ssos-cli accounting account-update <account-id> --name "银行存款-工行"

# Delete account
ssos-cli accounting account-delete <account-id>
```

### Reports (报表)
```bash
# Trial balance (试算平衡表)
ssos-cli accounting trial-balance -w <workspace-id>

# Income statement (利润表)
ssos-cli accounting income-statement -w <workspace-id> -s 2026-01-01 -e 2026-06-30

# General ledger (总账)
ssos-cli accounting general-ledger -w <workspace-id> -a <account-id>
ssos-cli accounting general-ledger -w <workspace-id> -a <account-id> -s 2026-01-01 -e 2026-06-30

# Cash journal (现金日记账)
ssos-cli accounting cash-journal -w <workspace-id> -s 2026-01-01 -e 2026-06-30

# Bank journal (银行日记账)
ssos-cli accounting bank-journal -w <workspace-id> --account 1002

# Account balances (科目余额表)
ssos-cli accounting account-balances -w <workspace-id> -p <period-id>
```

## Tax (税务)

### Tax Calendar
```bash
# Tax calendar tasks
ssos-cli tax calendar -w <workspace-id>
ssos-cli tax calendar -w <id> -f 2026-06-01 -t 2026-06-30 --status pending

# Tax rules (no -w option, uses SSOS_WORKSPACE_ID env var)
ssos-cli tax rules

# Tax calculations
ssos-cli tax calculations -w <workspace-id> --type vat

# Tax filing forms
ssos-cli tax filings -w <workspace-id> --form-type vat_return

# Tax compliance check
ssos-cli tax compliance -w <workspace-id> --year 2026

# Tax loss carryforward
ssos-cli tax loss-carryforward -w <workspace-id>
```

### Annual Bonus (年终奖)
```bash
ssos-cli tax bonus-list -w <workspace-id>
ssos-cli tax bonus-list -w <id> --year 2026 --json
ssos-cli tax bonus-get <bonus-id>
```

### Severance Payments (补偿金)
```bash
ssos-cli tax severance-list -w <workspace-id>
ssos-cli tax severance-list -w <id> --type termination --json
ssos-cli tax severance-get <payment-id>
```

### Labor Fee Payments (劳务费)
```bash
ssos-cli tax labor-fee-list -w <workspace-id>
ssos-cli tax labor-fee-list -w <id> --period 2026-06 --json
ssos-cli tax labor-fee-get <payment-id>
```

### Dividend Payments (股息分红)
```bash
ssos-cli tax dividend-list -w <workspace-id>
ssos-cli tax dividend-list -w <id> --year 2026 --json
ssos-cli tax dividend-get <dividend-id>
```

### Special Deductions (专项附加扣除)
```bash
ssos-cli tax deduction-list -w <workspace-id>
ssos-cli tax deduction-list -w <id> --employee-id <id> --json
ssos-cli tax deduction-summary --employee-id <id> --period 2026-06
```

### IIT Filings (个税申报)
```bash
ssos-cli tax iit-list -w <workspace-id>
ssos-cli tax iit-list -w <id> --period 2026-06 --json
ssos-cli tax iit-get <filing-id>
```

## Banking (银行)

```bash
# List bank accounts
ssos-cli banking account-list -w <workspace-id>

# Create bank account
ssos-cli banking account-create \
  -w <workspace-id> \
  -n "基本户" \
  -b "工商银行" \
  --number 622202xxxxxxxx

# Get bank account
ssos-cli banking account-get <account-id>

# Update bank account
ssos-cli banking account-update <account-id> -n "一般户"

# Delete bank account
ssos-cli banking account-delete <account-id>

# List transactions
ssos-cli banking transaction-list -w <workspace-id> --account <account-id>

# Get transaction
ssos-cli banking transaction-get <transaction-id>

# Import transactions
ssos-cli banking transaction-import \
  -w <workspace-id> \
  --account <account-id> \
  --file ./transactions.json

# Reconciliation records
ssos-cli banking reconciliation-list -w <workspace-id>

# Get reconciliation
ssos-cli banking reconciliation-get <reconciliation-id>

# Create reconciliation
ssos-cli banking reconciliation-create \
  -w <workspace-id> \
  --bank-transaction <id> \
  --journal-entry <id>

# Update reconciliation
ssos-cli banking reconciliation-update <reconciliation-id> --status reconciled

# Delete reconciliation
ssos-cli banking reconciliation-delete <reconciliation-id>
```

## Invoice (发票)

```bash
# List VAT invoices
ssos-cli invoice list -w <workspace-id> --type output

# Create VAT invoice
ssos-cli invoice create \
  -w <workspace-id> \
  -t output \
  --number 24112000000135114086 \
  --date 2026-06-15 \
  --seller "A公司" \
  --buyer "B公司" \
  --amount 495.05 \
  --tax 4.95 \
  --total 500.00

# Get VAT invoice
ssos-cli invoice get <invoice-id>

# Update VAT invoice
ssos-cli invoice update <invoice-id> --amount 600 --tax 60 --total 660

# Delete VAT invoice
ssos-cli invoice delete <invoice-id>

# List partners
ssos-cli invoice partner-list -w <workspace-id>

# Create partner
ssos-cli invoice partner-create -w <workspace-id> -n "客户A" -t customer

# Get partner
ssos-cli invoice partner-get <partner-id>

# Update partner
ssos-cli invoice partner-update <partner-id> --phone 13800138000

# Delete partner
ssos-cli invoice partner-delete <partner-id>
```

## HR (人力资源)

### Employees
```bash
# List employees
ssos-cli hr employee-list -w <workspace-id>

# Get employee
ssos-cli hr employee-get <employee-id>

# Create employee
ssos-cli hr employee-create \
  -w <workspace-id> \
  -n "张三" \
  --hire-date 2026-06-01 \
  --department "技术部" \
  --position "工程师"

# Update employee
ssos-cli hr employee-update <id> --department "销售部"

# Delete employee
ssos-cli hr employee-delete <id>
```

### Payroll (薪酬)
```bash
# List payroll records
ssos-cli hr payroll-list -w <workspace-id> --period 2026-06

# Create payroll record
ssos-cli hr payroll-create \
  -w <workspace-id> \
  --employee <id> \
  --period 2026-06 \
  --gross 10000

# Post payroll to journal entries
ssos-cli hr payroll-post -w <workspace-id> --period 2026-06 --date 2026-06-30
```

### Labor Contracts (劳动合同)
```bash
# List contracts
ssos-cli hr contract-list -w <workspace-id>

# Create contract
ssos-cli hr contract-create \
  -w <workspace-id> \
  --employee <id> \
  --type fixed_term \
  --start 2026-06-01 \
  --end 2027-06-01 \
  --salary 10000

# Get contract
ssos-cli hr contract-get <contract-id>

# Update contract
ssos-cli hr contract-update <contract-id> --salary 12000

# Delete contract
ssos-cli hr contract-delete <contract-id>
```

## Expense (报销)

```bash
# List expense claims
ssos-cli expense list -w <workspace-id>

# Create expense claim
ssos-cli expense create \
  -w <workspace-id> \
  --employee <id> \
  --date 2026-06-15 \
  --amount 500 \
  --description "差旅费"

# Get expense claim
ssos-cli expense get <claim-id>

# Update expense claim
ssos-cli expense update <claim-id> --amount 600

# Delete expense claim
ssos-cli expense delete <claim-id>

# Approve claim
ssos-cli expense approve <claim-id>

# Reject claim
ssos-cli expense reject <claim-id> --reason "发票不符"

# List departments
ssos-cli expense department-list -w <workspace-id>

# Create department
ssos-cli expense department-create -w <workspace-id> -n "技术部"

# Update department
ssos-cli expense department-update <department-id> -n "研发部"

# Delete department
ssos-cli expense department-delete <department-id>

# List projects
ssos-cli expense project-list -w <workspace-id>

# Create project
ssos-cli expense project-create \
  -w <workspace-id> \
  --name "ERP系统开发" \
  --budget 500000 \
  --start 2026-06-01 \
  --end 2026-12-31

# Update project
ssos-cli expense project-update <project-id> --status completed

# Delete project
ssos-cli expense project-delete <project-id>
```

## Legal (法务)

### Contracts (workspace from SSOS_WORKSPACE_ID env)
```bash
# List contracts
ssos-cli legal contract-list

# Get contract
ssos-cli legal contract-get <contract-id>

# Create contract
ssos-cli legal contract-create \
  --title "采购合同" \
  --party-a "A公司" \
  --party-b "B公司" \
  --type purchase \
  --amount 100000

# Update contract
ssos-cli legal contract-update <id> --status terminated

# AI generate contract
ssos-cli legal contract-generate \
  --type sales \
  --party-a "卖方" \
  --party-b "买方" \
  --amount 50000 \
  --term 12
```

### Contract Review
```bash
# AI review contract
ssos-cli legal contract-review \
  --text "合同文本内容..." \
  --perspective neutral

# Get review result
ssos-cli legal review-get <review-id>

# Ask follow-up question
ssos-cli legal review-ask --review <id> -q "违约金条款是否合理？"
```

### Demand Letters (催款函)
```bash
# List demand letters
ssos-cli legal demand-list

# Get demand letter
ssos-cli legal demand-get <letter-id>

# Generate demand letter
ssos-cli legal demand-generate \
  --debtor "欠款公司" \
  --creditor "债权公司" \
  --amount 100000 \
  --due-date 2026-05-31

# Update demand letter
ssos-cli legal demand-update <letter-id> --amount 120000

# Delete demand letter
ssos-cli legal demand-delete <letter-id>

# Save demand letter
ssos-cli legal demand-save \
  --debtor "欠款公司" \
  --creditor "债权公司" \
  --amount 100000 \
  --content "催款函内容..."

# Legal path recommendation (amount is positional argument)
ssos-cli legal legal-path 50000
```

## AI Bookkeeping (AI记账)

```bash
# AI bookkeeping from text
ssos-cli ai-bookkeeping book \
  -w <workspace-id> \
  -t "收到客户A货款50000元，银行转账"

# List AI conversations
ssos-cli ai-bookkeeping conversations -w <workspace-id>

# Upload file for OCR/bookkeeping
ssos-cli ai-bookkeeping file-upload --file ./invoice.pdf -w <workspace-id>

# OCR invoice
ssos-cli ai-bookkeeping ocr \
  -w <workspace-id> \
  --doc-type invoice \
  --file-url https://.../invoice.pdf

# Compliance Q&A
ssos-cli ai-bookkeeping compliance \
  -w <workspace-id> \
  -q "小规模纳税人可以抵扣进项税吗？"
```

## Period (会计期间)

```bash
# List periods
ssos-cli period list -w <workspace-id>

# Create period
ssos-cli period create \
  -w <workspace-id> \
  -s 2026-01-01 \
  -e 2026-12-31 \
  -n "2026年度"

# Get period
ssos-cli period get <period-id>

# Update period
ssos-cli period update <period-id> -n "2026财年"

# Delete period
ssos-cli period delete <period-id>

# Close period
ssos-cli period close -w <workspace-id> --period <period-id>

# Opening balances
ssos-cli period opening-balances -w <workspace-id>

# Set opening balance
ssos-cli period set-opening-balance \
  -w <workspace-id> \
  --account <account-id> \
  --start-date 2026-01-01 \
  --debit 10000
```

## API Key Management

```bash
# List API keys
ssos-cli api-key list

# Create API key
ssos-cli api-key create \
  -n "自动化脚本" \
  --scopes "read:accounting,write:accounting" \
  --days 90

# Revoke API key
ssos-cli api-key revoke <key-id>

# Enable/disable API key
ssos-cli api-key toggle <key-id> false
```

## Import & Export

### Export Financial Reports
```bash
# Export balance sheet
ssos-cli export balance-sheet <workspace-id> -y 2026 -f json
ssos-cli export balance-sheet <workspace-id> -y 2026 -m 6 -f json -o report.json

# Export income statement
ssos-cli export income-statement <workspace-id> -y 2026

# Export cash flow statement
ssos-cli export cash-flow <workspace-id> -y 2026 -f json
```

### Import Data
```bash
# Import journal entries from CSV
ssos-cli import journal-entries journal-import.csv -w <id>

# CSV columns: date, description, account_code, debit, credit
```

## Database Operations (Server-side only)

```bash
# Execute SQL query
ssos-cli db query "SELECT * FROM users LIMIT 5"

# Database backup
ssos-cli db backup

# Database stats
ssos-cli db stats
```

## System Operations (Server-side only)

```bash
# Health check
ssos-cli health

# System info
ssos-cli info

# View logs
ssos-cli logs -s pm2 -n 100

# PM2 management
ssos-cli pm2 status
ssos-cli pm2 restart ssos-backend
```

## Output Formats

All commands support `--json` for scripting:

```bash
# Table output (default)
ssos-cli accounting journal-list -w <id>

# JSON output
ssos-cli accounting journal-list -w <id> --json

# Pipe to jq
ssos-cli accounting journal-list -w <id> --json | jq '.[].entry_date'
```

## Common Workflows

### Monthly Closing (月末结账)
```bash
# 1. Check pending tasks
ssos-cli tax calendar -w <id> --status pending

# 2. Review journal entries
ssos-cli accounting journal-list -w <id> -s 2026-06-01 -e 2026-06-30

# 3. Generate trial balance
ssos-cli accounting trial-balance -w <id>

# 4. Generate income statement
ssos-cli accounting income-statement -w <id> -s 2026-06-01 -e 2026-06-30

# 5. Close period
ssos-cli period close -w <id> --period <period-id>
```

### Payroll Processing (工资处理)
```bash
# 1. List employees
ssos-cli hr employee-list -w <id>

# 2. Create payroll records
ssos-cli hr payroll-create -w <id> --employee <id> --period 2026-06 --gross 10000

# 3. Post payroll
ssos-cli hr payroll-post -w <id> --period 2026-06 --date 2026-06-30
```

### Invoice Reconciliation (发票对账)
```bash
# 1. List unpaid invoices
ssos-cli invoice list -w <id> --type output

# 2. Check bank transactions
ssos-cli banking transaction-list -w <id> -s 2026-06-01 -e 2026-06-30

# 3. Reconcile
ssos-cli banking reconciliation-list -w <id>
```

## Known Limitations

### 数据库命令限制

`db`, `users`, `workspace`, `files` 命令需要直接访问 PostgreSQL，必须在服务器上运行或通过 SSH tunnel：

```bash
# 通过 SSH tunnel 使用
ssh -f -N -L 5433:localhost:5432 sanjiaozhou
DB_HOST=localhost DB_PORT=5433 DB_USER=ssos_user DB_NAME=ssos \
  DB_PASSWORD='xxx' ssos-cli db stats
```

---

## Error Handling

```bash
# Common errors
"Not authenticated" → Run ssos-cli auth login --api-key xxx
"No workspace selected" → export SSOS_WORKSPACE_ID=<id>
"API error (401)" → Token expired, re-authenticate
"API error (403)" → Insufficient permissions
"API error (404)" → Resource not found, or missing backend endpoint
"Network error" → Check API_URL and connectivity
"unknown option '-w'" → This command reads workspace from SSOS_WORKSPACE_ID env var, not -w flag
```

## Testing

```bash
# Build CLI
cd ai-tools/cli && npm run build    # Must be 0 errors

# Test API command
ssos-cli accounting account-list -w <workspace-id>
ssos-cli expense list -w <workspace-id>

# Test DB command (requires PostgreSQL access)
DB_HOST=localhost DB_PORT=5433 DB_USER=ssos_user DB_NAME=ssos DB_PASSWORD='xxx' \
  ssos-cli db stats

# Test all commands with JSON output
ssos-cli accounting journal-list -w <id> --json | jq .
```

### 完整测试报告

见 `ai-tools/cli/TEST_REPORT.md` — 包含所有 50+ 命令的实时测试结果。
