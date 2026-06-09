---
name: ssos-cli
description: SSOS CLI v2.0 — Three-tier architecture (CRUD / Business / AI) for SSOS financial management. Unified CRUD interface for 127 resources, specialized commands for reports and calculations, AI-powered bookkeeping.
author: Claude
version: 2.0.0
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
  - ai
---

# SSOS CLI v2.0 Skill

Server-side CLI tool for SSOS (Startup OS) — AI-powered financial management for Chinese SMEs.

## 🎯 v2.0 Three-Tier Architecture

```
┌─────────────────────────────────────────────┐
│         SSOS CLI v2.0 (51 commands)         │
├─────────────┬─────────────┬─────────────────┤
│  CRUD 层    │  业务层      │  AI 层          │
│  90% 场景   │  8% 场景     │  2% 场景        │
├─────────────┼─────────────┼─────────────────┤
│  crud       │  accounting │  ai-bookkeeping │
│  127 资源   │  tax        │  • book         │
│  7 actions  │  invoice    │  • ocr          │
│             │  workspace  │  • compliance   │
└─────────────┴─────────────┴─────────────────┘
```

## Quick Start

```bash
# Install globally
npm install -g @xaiverdeng/ssos

# Authenticate
export SSOS_API_KEY="sk_live_xxx"
export SSOS_WORKSPACE_ID="workspace-xxx"

# Verify
ssos auth whoami

# Check available resources
ssos crud list-types

# Start using
ssos crud list journal-entries --workspace-id=xxx
```

## Authentication

### Login Methods

```bash
# API Key (recommended)
ssos auth api-key sk_live_xxxxxxxxxxxxxx

# Email + Password
ssos auth login

# Check status
ssos auth whoami
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `SSOS_API_KEY` | API Key for workspace access |
| `SSOS_WORKSPACE_ID` | Default workspace ID |
| `API_URL` | API base URL (default: https://api.finlaw.cloud) |

---

## 🔧 Tier 1: CRUD Layer (统一数据操作)

**Universal interface for 127 resource types**

### Commands

```bash
ssos crud list <resource> [--workspace-id=<id>] [--limit=N]
ssos crud get <resource> <id>
ssos crud create <resource> <json-data>
ssos crud update <resource> <id> <json-data>
ssos crud delete <resource> <id>
ssos crud action <resource> <id> <action>
ssos crud list-types
```

### 127 Resource Types

**Financial Accounting** (20):
- `accounts` - 会计科目
- `journal-entries` - 记账凭证
- `journal-entry-templates` - 凭证模板
- `account-balances` - 科目余额
- `closing-entries` - 期末结转
- `ledger` - 总账
- `subsidiary-ledger` - 明细账

**Invoices** (15):
- `business-vat-invoices` - 增值税发票
- `vat-invoice-requests` - 开票申请
- `invoice-items` - 发票明细
- `invoice-payments` - 发票付款

**Tax** (15):
- `tax-calculations` - 税务计算
- `tax-returns` - 税务申报表
- `vat-returns` - 增值税申报
- `income-tax-returns` - 所得税申报
- `tax-calendars` - 税务日历

**Banking** (10):
- `bank-accounts` - 银行账户
- `bank-transactions` - 银行流水
- `bank-reconciliations` - 银行对账

**HR** (12):
- `employees` - 员工
- `payroll-runs` - 薪资计算
- `payroll-items` - 薪资明细
- `labor-contracts` - 劳动合同
- `attendance-records` - 考勤记录

**Legal** (15):
- `legal-contracts` - 合同
- `contract-reviews` - 合同审查
- `demand-letters` - 催款函
- `legal-reminders` - 法务提醒

**AI** (8):
- `ai-conversations` - AI 对话
- `ai-bookkeeping-records` - AI 记账记录
- `ai-learning-feedback` - AI 学习反馈
- `prompt-templates` - 提示词模板

**System** (20):
- `workspaces` - 工作空间
- `users` - 用户
- `api-keys` - API 密钥
- `notifications` - 通知
- `audit-logs` - 审计日志

... 等 127 种资源类型

### Examples

```bash
# 员工管理
ssos crud list employees --workspace-id=abc123
ssos crud get employees emp_001
ssos crud create employees '{"name":"张三","email":"zhang@example.com"}'
ssos crud update employees emp_001 '{"position":"经理"}'
ssos crud delete employees emp_001

# 凭证管理
ssos crud list journal-entries --workspace-id=abc123 --month=2024-06
ssos crud get journal-entries je_001
ssos crud action journal-entries je_001 post      # 过账
ssos crud action journal-entries je_001 approve   # 审批
ssos crud action journal-entries je_001 reverse   # 冲红

# 发票管理
ssos crud list business-vat-invoices --type=input
ssos crud get business-vat-invoices inv_001
ssos crud action business-vat-invoices inv_001 reverse  # 冲红

# 合同管理
ssos crud list legal-contracts
ssos crud create legal-contracts '{"title":"服务合同","party_a":"公司A"}'
```

---

## 💼 Tier 2: Business Layer (复杂计算和报表)

### Accounting Reports (7 commands)

**Generate financial reports with complex calculations**

```bash
# 试算平衡表
ssos accounting trial-balance -w <workspace-id> [--start <date>] [--end <date>]

# 资产负债表
ssos accounting balance-sheet -w <workspace-id> --date <YYYY-MM-DD>

# 利润表
ssos accounting income-statement -w <workspace-id> --start <date> --end <date>

# 现金流量表
ssos accounting cash-flow -w <workspace-id> --start <date> --end <date>

# 总账
ssos accounting general-ledger -w <workspace-id> --account <id>

# 银行日记账
ssos accounting bank-journal -w <workspace-id> [--account <id>]

# 科目余额表
ssos accounting account-balances -w <workspace-id> [--period <id>]
```

**Note**: 凭证和科目的数据操作使用 `crud` 命令

### Tax Calculations (6 commands)

**Tax rules and complex calculations**

```bash
# 税务日历
ssos tax calendar -w <workspace-id> [--from <date>] [--to <date>]

# 税务计算
ssos tax calculations -w <workspace-id> [--type <type>]

# 合规检查
ssos tax compliance -w <workspace-id> [--year <year>]

# 申报表
ssos tax filings -w <workspace-id> [--form-type <type>]

# 税务规则
ssos tax rules

# 亏损弥补
ssos tax loss-carryforward -w <workspace-id>
```

### Invoice Operations (3 commands)

**Invoice-to-voucher conversion**

```bash
# 从发票生成会计凭证
ssos invoice to-journal-entry <invoice-id>

# 批量生成凭证
ssos invoice batch-to-entries --ids '["inv_001","inv_002"]'

# 冲红发票
ssos invoice reverse <invoice-id> --reason <reason>
```

**Note**: 发票数据操作使用 `crud list business-vat-invoices`

### Workspace Stats (1 command)

```bash
# 工作区统计（跨表聚合）
ssos workspace stats <workspace-id>
```

---

## 🤖 Tier 3: AI Layer (智能分析和生成)

### AI Bookkeeping (5 commands)

**LLM-powered intelligent bookkeeping**

```bash
# AI 自动记账
ssos ai-bookkeeping book \\
  -w <workspace-id> \\
  -t "购买办公用品500元"

# OCR 识别票据
ssos ai-bookkeeping ocr \\
  -w <workspace-id> \\
  --doc-type invoice \\
  --file-url <url>

# 合规问答
ssos ai-bookkeeping compliance \\
  -w <workspace-id> \\
  -q "小规模纳税人如何转一般纳税人？"

# AI 对话历史
ssos ai-bookkeeping conversations \\
  -w <workspace-id> \\
  [--type bookkeeping]

# 上传文件
ssos ai-bookkeeping file-upload \\
  --file <path> \\
  [-w <workspace-id>]
```

---

## 🛠️ System Tools

### Setup & Health

```bash
# 一键安装 MCP 服务器和 Skills
ssos setup

# 健康检查
ssos doctor
```

### User Management

```bash
# 重置密码（特殊操作）
ssos users reset-password <email> <new-password>
```

**Note**: 用户列表使用 `crud list users`

---

## Common Workflows

### Daily Bookkeeping

```bash
# 1. View account chart
ssos crud list accounts --workspace-id=xxx

# 2. Create voucher
ssos crud create journal-entries '{
  "workspace_id": "xxx",
  "entry_date": "2026-06-09",
  "description": "购买办公用品",
  "items": [
    {"account_id": "5001", "debit": 500, "description": "办公费"},
    {"account_id": "1001", "credit": 500, "description": "银行存款"}
  ]
}'

# 3. Post voucher
ssos crud action journal-entries je_001 post
```

### Month-end Closing

```bash
# 1. Trial balance
ssos accounting trial-balance -w xxx --end 2026-06-30

# 2. Generate reports
ssos accounting balance-sheet -w xxx --date 2026-06-30
ssos accounting income-statement -w xxx --start 2026-06-01 --end 2026-06-30

# 3. Close period (if needed)
ssos crud action periods period_202406 close
```

### Tax Filing

```bash
# 1. Check tax calendar
ssos tax calendar -w xxx --from 2026-06-01 --to 2026-06-30

# 2. Run tax calculations
ssos tax calculations -w xxx --type vat

# 3. Create tax return (via CRUD)
ssos crud create tax-returns '{
  "workspace_id": "xxx",
  "period": "2026-06",
  "tax_type": "vat",
  "data": {...}
}'
```

### AI Bookkeeping

```bash
# 1. Upload invoice image
ssos ai-bookkeeping file-upload --file invoice.jpg -w xxx

# 2. OCR recognition
ssos ai-bookkeeping ocr -w xxx --doc-type invoice --file-url <url>

# 3. AI auto-booking
ssos ai-bookkeeping book -w xxx -t "收到客户A货款10000元"

# 4. Review conversation
ssos ai-bookkeeping conversations -w xxx
```

---

## Migration from v1.0

### Users Module

```bash
# Before v1.0
ssos users list
ssos users get <id>

# v2.0
ssos crud list users
ssos crud get users <id>
```

### Workspace Module

```bash
# Before v1.0
ssos workspace list

# v2.0
ssos crud list workspaces
```

### Invoice Module

```bash
# Before v1.0
ssos invoice create-entry <id>
ssos invoice batch-create-entries --ids '[...]'

# v2.0
ssos invoice to-journal-entry <id>
ssos invoice batch-to-entries --ids '[...]'
```

### Voucher Operations

```bash
# Before v1.0
ssos accounting post-entry <id>
ssos accounting reverse-entry <id>

# v2.0
ssos crud action journal-entries <id> post
ssos crud action journal-entries <id> reverse
```

---

## Tips

1. **Use `crud list-types`** to discover all 127 resource types
2. **Use `--json` flag** for machine-readable output
3. **Set environment variables** to avoid repeating workspace ID
4. **Use `crud action`** for resource-specific operations (post, approve, reverse)
5. **Check `ssos <command> --help`** for detailed options

---

## Documentation

- **README**: https://github.com/Xaiver03/startupos-ai-tools
- **ARCHITECTURE**: Three-tier design (CRUD / Business / AI)
- **CHANGELOG**: v2.0.0 breaking changes
- **CLI Analysis**: Complete command analysis and migration guide

---

**Version**: 2.0.0  
**Last Updated**: 2026-06-09  
**Package**: @xaiverdeng/ssos
