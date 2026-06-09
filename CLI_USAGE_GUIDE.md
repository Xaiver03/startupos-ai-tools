# SSOS CLI v2.0 完整使用指南

**版本**: 2.0.0  
**包名**: @xaiverdeng/ssos  
**日期**: 2026-06-09

---

## 📖 目录

1. [安装和配置](#安装和配置)
2. [认证方式](#认证方式)
3. [CRUD 层命令详解](#crud-层命令详解)
4. [业务层命令详解](#业务层命令详解)
5. [AI 层命令详解](#ai-层命令详解)
6. [系统工具](#系统工具)
7. [常见工作流](#常见工作流)
8. [故障排查](#故障排查)

---

## 安装和配置

### 全局安装

```bash
npm install -g @xaiverdeng/ssos
```

### 验证安装

```bash
ssos --version
# 输出: 2.0.0

ssos --help
# 显示所有可用命令
```

### 环境变量配置

创建 `.env` 文件或在 shell 配置中设置:

```bash
# 必需
export SSOS_API_KEY="sk_live_xxxxxxxxxxxxxx"
export SSOS_WORKSPACE_ID="workspace-uuid-here"

# 可选
export API_URL="https://api.finlaw.cloud"  # 默认值
export SSOS_LOG_LEVEL="info"              # debug, info, warn, error
```

---

## 认证方式

### 1. API Key 认证（推荐）

**优势**: 简单、安全、适合自动化脚本

```bash
# 方式 1: 环境变量
export SSOS_API_KEY="sk_live_xxxxxxxxxxxxxx"
ssos auth whoami

# 方式 2: 命令行设置
ssos auth api-key sk_live_xxxxxxxxxxxxxx

# 方式 3: 每次命令传递（不推荐）
ssos crud list accounts --api-key sk_live_xxx
```

**创建 API Key**:

```bash
# 通过 Web 界面创建，或使用 CRUD 命令
ssos crud create api-keys '{
  "name": "CLI Tool",
  "expires_at": "2027-12-31T23:59:59Z"
}'
```

### 2. 邮箱密码登录

**适用场景**: 交互式使用、个人账户

```bash
# 交互式登录
ssos auth login

# 或指定参数
ssos auth login --email user@example.com --password xxxxxx
```

### 3. 查看认证状态

```bash
ssos auth whoami

# 输出示例:
# {
#   "user": {
#     "id": "user_123",
#     "email": "user@example.com",
#     "name": "张三"
#   },
#   "workspace": {
#     "id": "workspace_001",
#     "name": "示例公司",
#     "role": "admin"
#   },
#   "authenticated": true
# }
```

---

## CRUD 层命令详解

### 概述

CRUD 层提供统一的数据操作接口，支持 127 种资源类型。

**命令格式**:
```bash
ssos crud <action> <resource> [id] [options]
```

**7 个 Actions**:
- `list` - 列出资源
- `get` - 获取单个资源
- `create` - 创建资源
- `update` - 更新资源
- `delete` - 删除资源
- `action` - 执行特定操作
- `list-types` - 查看所有资源类型

### 1. crud list - 列出资源

**语法**:
```bash
ssos crud list <resource> [options]
```

**选项**:
- `--workspace-id=<id>` - 工作空间 ID（部分资源必需）
- `--limit=<n>` - 限制返回数量（默认: 50）
- `--offset=<n>` - 跳过前 N 条记录
- `--sort=<field>` - 排序字段
- `--order=<asc|desc>` - 排序顺序
- `--filter=<json>` - 过滤条件（JSON 格式）
- `--json` - JSON 格式输出

**示例**:

```bash
# 列出会计科目
ssos crud list accounts --workspace-id=abc123

# 列出本月凭证
ssos crud list journal-entries \
  --workspace-id=abc123 \
  --filter='{"entry_date":{"gte":"2026-06-01","lte":"2026-06-30"}}'

# 列出已过账的凭证
ssos crud list journal-entries \
  --workspace-id=abc123 \
  --filter='{"status":"posted"}' \
  --sort=entry_date \
  --order=desc

# 列出员工（分页）
ssos crud list employees \
  --workspace-id=abc123 \
  --limit=20 \
  --offset=0

# 列出增值税发票
ssos crud list business-vat-invoices \
  --workspace-id=abc123 \
  --filter='{"invoice_type":"input"}'
```

### 2. crud get - 获取单个资源

**语法**:
```bash
ssos crud get <resource> <id> [options]
```

**示例**:

```bash
# 获取科目详情
ssos crud get accounts acct_001

# 获取凭证详情
ssos crud get journal-entries je_001

# 获取员工信息
ssos crud get employees emp_001

# 获取发票详情
ssos crud get business-vat-invoices inv_001

# JSON 输出
ssos crud get accounts acct_001 --json
```

### 3. crud create - 创建资源

**语法**:
```bash
ssos crud create <resource> '<json-data>' [options]
```

**示例**:

```bash
# 创建员工
ssos crud create employees '{
  "workspace_id": "abc123",
  "name": "张三",
  "email": "zhangsan@example.com",
  "department": "财务部",
  "position": "会计",
  "join_date": "2026-06-01"
}'

# 创建会计科目
ssos crud create accounts '{
  "workspace_id": "abc123",
  "code": "1001",
  "name": "库存现金",
  "type": "asset",
  "debit_credit": "debit",
  "level": 1
}'

# 创建记账凭证
ssos crud create journal-entries '{
  "workspace_id": "abc123",
  "entry_date": "2026-06-09",
  "description": "购买办公用品",
  "items": [
    {
      "account_id": "acct_5001",
      "debit": 500,
      "credit": 0,
      "description": "办公费"
    },
    {
      "account_id": "acct_1001",
      "debit": 0,
      "credit": 500,
      "description": "库存现金"
    }
  ]
}'

# 从文件读取数据
ssos crud create journal-entries "$(cat voucher.json)"
```

### 4. crud update - 更新资源

**语法**:
```bash
ssos crud update <resource> <id> '<json-data>' [options]
```

**示例**:

```bash
# 更新员工信息
ssos crud update employees emp_001 '{
  "position": "财务经理",
  "department": "财务部"
}'

# 更新凭证（仅草稿状态）
ssos crud update journal-entries je_001 '{
  "description": "购买办公用品和耗材"
}'

# 更新科目名称
ssos crud update accounts acct_001 '{
  "name": "库存现金（人民币）"
}'
```

### 5. crud delete - 删除资源

**语法**:
```bash
ssos crud delete <resource> <id> [options]
```

**示例**:

```bash
# 删除员工
ssos crud delete employees emp_001

# 删除凭证（仅草稿状态）
ssos crud delete journal-entries je_001

# 删除科目（需无余额且无关联凭证）
ssos crud delete accounts acct_9999

# 确认删除
ssos crud delete employees emp_001 --confirm
```

### 6. crud action - 执行特定操作

**语法**:
```bash
ssos crud action <resource> <id> <action-name> [options]
```

**常见 Actions**:

| 资源类型 | Action | 说明 |
|---------|--------|------|
| journal-entries | post | 过账（草稿 → 已过账） |
| journal-entries | approve | 审批 |
| journal-entries | reverse | 冲红 |
| journal-entries | submit-review | 提交审核 |
| business-vat-invoices | reverse | 冲红发票 |
| business-vat-invoices | verify | 验证发票 |
| periods | close | 结账 |
| periods | open | 反结账 |
| tax-returns | submit | 提交申报 |

**示例**:

```bash
# 过账凭证
ssos crud action journal-entries je_001 post

# 审批凭证
ssos crud action journal-entries je_001 approve

# 冲红凭证
ssos crud action journal-entries je_001 reverse

# 冲红发票
ssos crud action business-vat-invoices inv_001 reverse \
  --data='{"reason":"销售退回"}'

# 结账
ssos crud action periods period_202406 close

# 提交税务申报
ssos crud action tax-returns tr_001 submit
```

### 7. crud list-types - 查看所有资源类型

**语法**:
```bash
ssos crud list-types [options]
```

**示例**:

```bash
# 列出所有资源类型
ssos crud list-types

# 搜索特定资源
ssos crud list-types | grep invoice

# 查看会计相关资源
ssos crud list-types | grep -E "(account|entry|ledger)"

# JSON 格式输出
ssos crud list-types --json
```


### 127 种资源类型完整列表

**财务会计** (20 种):
- accounts
- journal-entries
- journal-entry-templates
- account-balances
- closing-entries
- opening-balances
- ledger-entries
- subsidiary-ledger-entries
- trial-balance-reports
- fiscal-years
- accounting-periods
- dimension-values
- cost-centers
- profit-centers
- projects
- voucher-sequences
- account-groups
- account-reconciliations
- amortization-schedules
- depreciation-schedules

**发票管理** (15 种):
- business-vat-invoices
- vat-invoice-requests
- invoice-items
- invoice-payments
- invoice-ocr-results
- invoice-templates
- invoice-attachments
- invoice-verification-logs
- invoice-matching-rules
- invoice-approval-workflows
- red-invoice-applications
- invoice-collections
- invoice-write-offs
- invoice-aging-reports
- invoice-reconciliations

**税务** (15 种):
- tax-calculations
- tax-returns
- tax-calendars
- tax-filings
- tax-payments
- tax-preferences
- tax-adjustments
- tax-loss-carryforwards
- vat-returns
- income-tax-returns
- individual-income-tax
- withholding-tax
- tax-credits
- tax-compliance-checks
- tax-optimization-suggestions

**银行** (10 种):
- bank-accounts
- bank-transactions
- bank-reconciliations
- bank-statements
- bank-feeds
- payment-orders
- payment-batches
- check-registers
- cash-journals
- petty-cash-records

**人力资源** (12 种):
- employees
- payroll-runs
- payroll-items
- labor-contracts
- attendance-records
- reimbursements
- leave-requests
- performance-reviews
- salary-adjustments
- social-insurance
- housing-fund
- employee-benefits

**费用报销** (10 种):
- expense-reports
- expense-items
- expense-categories
- expense-policies
- expense-approvals
- travel-requests
- travel-expenses
- mileage-logs
- per-diem-rates
- expense-allocations

**合同法务** (15 种):
- legal-contracts
- contract-reviews
- contract-templates
- contract-clauses
- contract-parties
- contract-attachments
- contract-milestones
- contract-payments
- contract-amendments
- demand-letters
- legal-reminders
- legal-disputes
- legal-opinions
- compliance-checks
- legal-documents

**AI 服务** (8 种):
- ai-conversations
- ai-bookkeeping-records
- ai-compliance-questions
- ai-ocr-results
- ai-learning-feedback
- ai-suggestions
- prompt-templates
- ai-audit-logs

**系统管理** (20 种):
- workspaces
- users
- api-keys
- roles
- permissions
- notifications
- audit-logs
- subscriptions
- billing-records
- integrations
- webhooks
- file-uploads
- file-downloads
- system-settings
- workspace-settings
- user-preferences
- activity-logs
- error-logs
- backup-records
- data-exports

---

## 业务层命令详解

### 概述

业务层命令专注于复杂的业务逻辑，如报表生成、税务计算、银行对账等。

### Accounting 模块（7 个报表命令）

#### 1. trial-balance - 试算平衡表

**用途**: 检查借贷是否平衡，期末必做

**语法**:
```bash
ssos accounting trial-balance -w <workspace-id> [options]
```

**选项**:
- `-w, --workspace <id>` - 工作空间 ID（必需）
- `-s, --start <date>` - 开始日期（YYYY-MM-DD）
- `-e, --end <date>` - 结束日期（YYYY-MM-DD）
- `--json` - JSON 格式输出

**示例**:

```bash
# 本月试算平衡
ssos accounting trial-balance -w abc123 \
  --start 2026-06-01 \
  --end 2026-06-30

# 全年试算平衡
ssos accounting trial-balance -w abc123 \
  --start 2026-01-01 \
  --end 2026-12-31

# JSON 输出
ssos accounting trial-balance -w abc123 \
  --end 2026-06-30 \
  --json > trial-balance.json
```

**输出示例**:
```
试算平衡表
─────────────────────────────────────────────────
Account Code | Account Name | Debit      | Credit     | Balance
─────────────────────────────────────────────────
1001         | 库存现金      | 10000.00   | 8000.00    | 2000.00
1002         | 银行存款      | 50000.00   | 30000.00   | 20000.00
2001         | 应付账款      | 5000.00    | 15000.00   | -10000.00
...
─────────────────────────────────────────────────
Total                        | 150000.00  | 150000.00  | 0.00
```

#### 2. balance-sheet - 资产负债表

**用途**: 查看公司资产、负债、所有者权益

**语法**:
```bash
ssos accounting balance-sheet -w <workspace-id> [options]
```

**示例**:

```bash
# 生成资产负债表
ssos accounting balance-sheet -w abc123 \
  --date 2026-06-30

# 指定会计准则
ssos accounting balance-sheet -w abc123 \
  --date 2026-06-30 \
  --standard small_business  # 或 enterprise
```

#### 3. income-statement - 利润表

**用途**: 查看公司收入、成本、利润

**语法**:
```bash
ssos accounting income-statement -w <workspace-id> [options]
```

**示例**:

```bash
# 本月利润表
ssos accounting income-statement -w abc123 \
  --start 2026-06-01 \
  --end 2026-06-30

# 本年利润表
ssos accounting income-statement -w abc123 \
  --start 2026-01-01 \
  --end 2026-12-31
```

#### 4. cash-flow - 现金流量表

**用途**: 查看现金流入流出

**语法**:
```bash
ssos accounting cash-flow -w <workspace-id> [options]
```

**示例**:

```bash
# 现金流量表
ssos accounting cash-flow -w abc123 \
  --start 2026-01-01 \
  --end 2026-06-30
```

#### 5. general-ledger - 总账

**用途**: 查看某个科目的所有明细

**语法**:
```bash
ssos accounting general-ledger -w <workspace-id> -a <account-id> [options]
```

**示例**:

```bash
# 查看银行存款总账
ssos accounting general-ledger -w abc123 \
  --account acct_1002 \
  --start 2026-06-01 \
  --end 2026-06-30
```

#### 6. bank-journal - 银行日记账

**用途**: 银行存款的流水明细

**语法**:
```bash
ssos accounting bank-journal -w <workspace-id> [options]
```

**示例**:

```bash
# 所有银行账户日记账
ssos accounting bank-journal -w abc123 \
  --start 2026-06-01 \
  --end 2026-06-30

# 指定银行账户
ssos accounting bank-journal -w abc123 \
  --account bank_001 \
  --start 2026-06-01 \
  --end 2026-06-30
```

#### 7. account-balances - 科目余额表

**用途**: 查看所有科目的余额

**语法**:
```bash
ssos accounting account-balances -w <workspace-id> [options]
```

**示例**:

```bash
# 科目余额表
ssos accounting account-balances -w abc123 \
  --period period_202406

# 指定日期区间
ssos accounting account-balances -w abc123 \
  --start 2026-06-01 \
  --end 2026-06-30
```


---

## 💼 业务层命令

### 4.2 税务管理 (Tax Module)

税务计算和申报管理。

#### 4.2.1 税务日历

查看税务申报截止日期。

```bash
ssos tax calendar -w <workspace-id> [--from <date>] [--to <date>]
```

**参数**:
- `-w, --workspace-id` - 工作区 ID（必填）
- `--from` - 开始日期（可选，格式 YYYY-MM-DD）
- `--to` - 结束日期（可选，格式 YYYY-MM-DD）

**示例**:
```bash
# 查看 2026 年 6 月的税务日历
ssos tax calendar -w workspace_abc123 --from 2026-06-01 --to 2026-06-30

# 查看全年税务日历
ssos tax calendar -w workspace_abc123 --from 2026-01-01 --to 2026-12-31
```

**返回内容**:
- 增值税申报截止日期（每月 15 日前）
- 企业所得税预缴截止日期（季度后 15 日内）
- 年度所得税汇算清缴截止日期（次年 5 月 31 日前）
- 个人所得税代扣代缴截止日期（次月 15 日前）

---

#### 4.2.2 税务计算

执行税务计算（增值税、所得税等）。

```bash
ssos tax calculations -w <workspace-id> [--type <type>]
```

**参数**:
- `-w, --workspace-id` - 工作区 ID（必填）
- `--type` - 税种类型（可选：vat, income-tax, stamp-duty）

**示例**:
```bash
# 计算增值税
ssos tax calculations -w workspace_abc123 --type vat

# 计算企业所得税
ssos tax calculations -w workspace_abc123 --type income-tax

# 计算所有税种
ssos tax calculations -w workspace_abc123
```

**返回内容**:
- 销项税额、进项税额、应纳增值税额
- 应纳税所得额、应纳企业所得税额
- 计算依据和明细

---

#### 4.2.3 合规检查

检查税务合规性。

```bash
ssos tax compliance -w <workspace-id> [--year <year>]
```

**参数**:
- `-w, --workspace-id` - 工作区 ID（必填）
- `--year` - 检查年度（可选，默认当前年度）

**示例**:
```bash
# 检查 2026 年合规性
ssos tax compliance -w workspace_abc123 --year 2026

# 检查当前年度
ssos tax compliance -w workspace_abc123
```

**返回内容**:
- 是否按时申报
- 是否存在税务风险
- 合规建议

---

#### 4.2.4 申报表管理

查看税务申报表。

```bash
ssos tax filings -w <workspace-id> [--form-type <type>]
```

**参数**:
- `-w, --workspace-id` - 工作区 ID（必填）
- `--form-type` - 申报表类型（可选：vat, income-tax）

**示例**:
```bash
# 查看增值税申报表
ssos tax filings -w workspace_abc123 --form-type vat

# 查看所有申报表
ssos tax filings -w workspace_abc123
```

---

#### 4.2.5 税务规则

查看适用的税务规则和税率。

```bash
ssos tax rules
```

**返回内容**:
- 增值税税率（13%/9%/6%/3%/1%）
- 企业所得税税率（25%/20%/15%/5%）
- 小型微利企业判定标准
- 税收优惠政策

---

#### 4.2.6 亏损弥补

查看可弥补亏损。

```bash
ssos tax loss-carryforward -w <workspace-id>
```

**参数**:
- `-w, --workspace-id` - 工作区 ID（必填）

**返回内容**:
- 历年亏损金额
- 已弥补金额
- 可结转年限（最长 5 年）

---

### 4.3 发票操作 (Invoice Module)

发票到凭证的转换操作。

#### 4.3.1 从发票生成凭证

从单张增值税发票生成会计凭证。

```bash
ssos invoice to-journal-entry <invoice-id>
```

**参数**:
- `<invoice-id>` - 发票 ID（必填）

**示例**:
```bash
# 从进项发票生成凭证
ssos invoice to-journal-entry inv_input_001

# 从销项发票生成凭证
ssos invoice to-journal-entry inv_output_002
```

**生成规则**:
- **进项发票**（采购）:
  ```
  借: 原材料/库存商品/固定资产/费用类科目
      应交税费-应交增值税(进项税额)
  贷: 应付账款/银行存款
  ```

- **销项发票**（销售）:
  ```
  借: 应收账款/银行存款
  贷: 主营业务收入
      应交税费-应交增值税(销项税额)
  ```

---

#### 4.3.2 批量生成凭证

从多张发票批量生成会计凭证。

```bash
ssos invoice batch-to-entries --ids '["id1","id2","id3"]'
```

**参数**:
- `--ids` - 发票 ID 数组（JSON 格式，必填）

**示例**:
```bash
# 批量生成 3 张发票的凭证
ssos invoice batch-to-entries --ids '["inv_001","inv_002","inv_003"]'

# 批量生成本月所有进项发票的凭证
# 先获取发票列表
ssos crud list business-vat-invoices --type=input --month=2026-06 --json | jq -r '[.data[].id] | @json' | xargs -I {} ssos invoice batch-to-entries --ids '{}'
```

**返回内容**:
- 成功生成的凭证 ID 列表
- 失败的发票及原因

---

#### 4.3.3 冲红发票

对发票执行冲红操作。

```bash
ssos invoice reverse <invoice-id> --reason <reason>
```

**参数**:
- `<invoice-id>` - 发票 ID（必填）
- `--reason` - 冲红原因（必填）

**示例**:
```bash
# 冲红销项发票
ssos invoice reverse inv_output_001 --reason "客户退货"

# 冲红进项发票
ssos invoice reverse inv_input_002 --reason "供应商开票错误"
```

**操作结果**:
- 生成红字发票记录
- 自动生成冲红会计凭证
- 原发票状态更新为"已冲红"

---

### 4.4 工作区统计

查看工作区的统计数据（跨表聚合）。

```bash
ssos workspace stats <workspace-id>
```

**参数**:
- `<workspace-id>` - 工作区 ID（必填）

**示例**:
```bash
ssos workspace stats workspace_abc123
```

**返回内容**:
- 用户数量
- 凭证总数
- 本月凭证数
- 发票总数
- 本月发票数
- 员工数量
- 合同数量
- AI 对话数

---

## 🤖 AI 层命令

### 5. AI 智能记账 (AI Bookkeeping)

AI Ping 驱动的智能财务功能。

#### 5.1 AI 自动记账

根据业务描述自动生成会计凭证。

```bash
ssos ai-bookkeeping book -w <workspace-id> -t "<业务描述>"
```

**参数**:
- `-w, --workspace-id` - 工作区 ID（必填）
- `-t, --transaction` - 业务描述（必填）

**示例**:
```bash
# 简单业务
ssos ai-bookkeeping book -w workspace_abc123 -t "购买办公用品 500 元，现金支付"

# 复杂业务
ssos ai-bookkeeping book -w workspace_abc123 -t "收到客户 A 公司货款 10000 元，已开具增值税专用发票，税率 13%"

# 多笔业务
ssos ai-bookkeeping book -w workspace_abc123 -t "支付员工工资 50000 元，代扣个税 3000 元，实发 47000 元"
```

**AI 能力**:
- 自动识别业务类型（采购、销售、费用、工资等）
- 自动选择会计科目
- 自动计算借贷方金额
- 自动关联发票（如果提及）
- 学习用户记账习惯

---

#### 5.2 OCR 识别票据

通过 OCR 识别票据并提取信息。

```bash
ssos ai-bookkeeping ocr -w <workspace-id> --doc-type <type> --file-url <url>
```

**参数**:
- `-w, --workspace-id` - 工作区 ID（必填）
- `--doc-type` - 票据类型（必填：invoice, receipt, bank-statement）
- `--file-url` - 文件 URL（必填）

**示例**:
```bash
# 识别增值税发票
ssos ai-bookkeeping ocr -w workspace_abc123 \
  --doc-type invoice \
  --file-url "https://storage.finlaw.cloud/invoices/2026/06/inv_001.jpg"

# 识别银行回单
ssos ai-bookkeeping ocr -w workspace_abc123 \
  --doc-type bank-statement \
  --file-url "https://storage.finlaw.cloud/statements/2026/06/stmt_001.pdf"

# 识别收据
ssos ai-bookkeeping ocr -w workspace_abc123 \
  --doc-type receipt \
  --file-url "https://storage.finlaw.cloud/receipts/2026/06/rcpt_001.jpg"
```

**返回内容**:
- 发票号码、日期、金额、税额
- 购销方信息
- 商品明细
- 置信度评分

---

#### 5.3 合规问答

提问税务、会计、法律相关问题。

```bash
ssos ai-bookkeeping compliance -w <workspace-id> -q "<问题>"
```

**参数**:
- `-w, --workspace-id` - 工作区 ID（必填）
- `-q, --question` - 问题（必填）

**示例**:
```bash
# 税务问题
ssos ai-bookkeeping compliance -w workspace_abc123 \
  -q "小规模纳税人如何转为一般纳税人？"

# 会计问题
ssos ai-bookkeeping compliance -w workspace_abc123 \
  -q "固定资产折旧年限如何确定？"

# 法律问题
ssos ai-bookkeeping compliance -w workspace_abc123 \
  -q "劳动合同试用期最长可以约定多久？"

# 业务场景问题
ssos ai-bookkeeping compliance -w workspace_abc123 \
  -q "公司购买一台设备 10 万元，分期付款，如何记账？"
```

**AI 能力**:
- 引用最新法规政策
- 结合企业实际情况（纳税人类型、行业等）
- 提供实操建议
- 给出会计分录示例

---

#### 5.4 AI 对话历史

查看 AI 对话记录。

```bash
ssos ai-bookkeeping conversations -w <workspace-id> [--type <type>]
```

**参数**:
- `-w, --workspace-id` - 工作区 ID（必填）
- `--type` - 对话类型（可选：bookkeeping, compliance, ocr）

**示例**:
```bash
# 查看所有对话
ssos ai-bookkeeping conversations -w workspace_abc123

# 查看记账对话
ssos ai-bookkeeping conversations -w workspace_abc123 --type bookkeeping

# 查看合规问答对话
ssos ai-bookkeeping conversations -w workspace_abc123 --type compliance
```

---

#### 5.5 上传文件

上传文件到云存储，获取 URL 用于 OCR。

```bash
ssos ai-bookkeeping file-upload --file <path> [-w <workspace-id>]
```

**参数**:
- `--file` - 本地文件路径（必填）
- `-w, --workspace-id` - 工作区 ID（可选）

**示例**:
```bash
# 上传发票图片
ssos ai-bookkeeping file-upload --file ./invoice.jpg -w workspace_abc123

# 上传 PDF 文件
ssos ai-bookkeeping file-upload --file ./bank-statement.pdf -w workspace_abc123
```

**返回内容**:
- 文件 URL
- 文件大小
- 上传时间

**完整流程**:
```bash
# 1. 上传文件
FILE_URL=$(ssos ai-bookkeeping file-upload --file ./invoice.jpg -w workspace_abc123 --json | jq -r '.url')

# 2. OCR 识别
ssos ai-bookkeeping ocr -w workspace_abc123 --doc-type invoice --file-url "$FILE_URL"

# 3. 生成凭证（如果需要）
ssos ai-bookkeeping book -w workspace_abc123 -t "根据发票 $(echo $FILE_URL | grep -oP 'inv_\w+') 记账"
```

---

## 🛠️ 系统工具

### 6.1 一键安装

安装 MCP 服务器和 Skills 到 AI IDE。

```bash
ssos setup
```

**操作内容**:
1. 检测 AI IDE 配置目录（Claude Code、Cursor、Windsurf 等）
2. 安装 MCP 服务器配置
3. 安装 Skills 文件
4. 验证安装

**支持的 AI IDE**:
- Claude Code (官方)
- Cursor
- Windsurf
- VS Code with Continue
- 其他支持 MCP 的 IDE

---

### 6.2 健康检查

检查 CLI 和 API 连接状态。

```bash
ssos doctor
```

**检查项**:
- Node.js 版本（>= 18.0.0）
- API 连接状态
- 认证状态
- 环境变量配置
- 依赖包完整性

**示例输出**:
```
✓ Node.js version: v20.11.0
✓ API connectivity: OK (https://api.finlaw.cloud)
✓ Authentication: OK (API Key)
✓ Workspace ID: workspace_abc123
✓ Environment: Production
✓ Dependencies: OK
```

---

### 6.3 重置密码

重置用户密码（管理员操作）。

```bash
ssos users reset-password <email> <new-password>
```

**参数**:
- `<email>` - 用户邮箱（必填）
- `<new-password>` - 新密码（必填，至少 8 位）

**示例**:
```bash
ssos users reset-password user@example.com "NewPass123!"
```

**安全提示**:
- 此命令需要管理员权限
- 密码必须符合强度要求（至少 8 位，包含字母和数字）
- 重置后需要通知用户修改密码

---

## 📋 常见工作流

### 7.1 日常记账流程

```bash
# 1. 查看会计科目表
ssos crud list accounts --workspace-id=workspace_abc123

# 2. 创建会计凭证
ssos crud create journal-entries '{
  "workspace_id": "workspace_abc123",
  "entry_date": "2026-06-09",
  "description": "购买办公用品",
  "items": [
    {"account_id": "5001", "debit": 500, "description": "办公费"},
    {"account_id": "1001", "credit": 500, "description": "银行存款"}
  ]
}'

# 3. 过账凭证
ssos crud action journal-entries je_xxxxxx post

# 4. 查看凭证
ssos crud get journal-entries je_xxxxxx
```

---

### 7.2 月末结账流程

```bash
# 1. 生成试算平衡表（检查借贷是否平衡）
ssos accounting trial-balance -w workspace_abc123 --end 2026-06-30

# 2. 生成财务报表
ssos accounting balance-sheet -w workspace_abc123 --date 2026-06-30
ssos accounting income-statement -w workspace_abc123 --start 2026-06-01 --end 2026-06-30
ssos accounting cash-flow -w workspace_abc123 --start 2026-06-01 --end 2026-06-30

# 3. 生成期末结转凭证（可选，如需要）
ssos crud create closing-entries '{
  "workspace_id": "workspace_abc123",
  "period": "2026-06"
}'

# 4. 锁定期间（可选）
ssos crud action periods period_202406 close
```

---

### 7.3 税务申报流程

```bash
# 1. 查看税务日历
ssos tax calendar -w workspace_abc123 --from 2026-06-01 --to 2026-06-30

# 2. 运行税务计算
ssos tax calculations -w workspace_abc123 --type vat

# 3. 创建税务申报表
ssos crud create tax-returns '{
  "workspace_id": "workspace_abc123",
  "period": "2026-06",
  "tax_type": "vat",
  "data": {
    "sales_amount": 100000,
    "output_vat": 13000,
    "input_vat": 8000,
    "payable_vat": 5000
  }
}'

# 4. 查看申报表
ssos tax filings -w workspace_abc123 --form-type vat
```

---

### 7.4 AI 智能记账流程

```bash
# 1. 上传发票图片
FILE_URL=$(ssos ai-bookkeeping file-upload --file invoice.jpg -w workspace_abc123 --json | jq -r '.url')

# 2. OCR 识别发票
ssos ai-bookkeeping ocr -w workspace_abc123 --doc-type invoice --file-url "$FILE_URL"

# 3. AI 自动记账
ssos ai-bookkeeping book -w workspace_abc123 -t "收到客户 A 公司货款 10000 元，已开具增值税专用发票"

# 4. 查看生成的凭证
ssos crud list journal-entries --workspace-id=workspace_abc123 --limit=1

# 5. 查看 AI 对话历史
ssos ai-bookkeeping conversations -w workspace_abc123 --type bookkeeping
```

---

### 7.5 发票管理流程

```bash
# 1. 导入发票数据
ssos crud create business-vat-invoices '{
  "workspace_id": "workspace_abc123",
  "invoice_number": "12345678",
  "invoice_date": "2026-06-09",
  "amount": 10000,
  "tax_amount": 1300,
  "buyer_name": "客户 A 公司",
  "seller_name": "我公司"
}'

# 2. 查看发票列表
ssos crud list business-vat-invoices --type=output --month=2026-06

# 3. 从发票生成凭证
ssos invoice to-journal-entry inv_xxxxxx

# 4. 批量生成凭证（如果有多张发票）
ssos invoice batch-to-entries --ids '["inv_001","inv_002","inv_003"]'

# 5. 查看生成的凭证
ssos crud list journal-entries --workspace-id=workspace_abc123 --month=2026-06
```

---

## 🔧 故障排除

### 8.1 认证问题

**问题：401 Unauthorized**

```bash
# 检查认证状态
ssos auth whoami

# 如果未认证，重新登录
ssos auth api-key sk_live_xxxxxxxxxxxxxx

# 或使用邮箱密码
ssos auth login
```

**问题：API Key 无效**

```bash
# 验证 API Key 格式（应以 sk_live_ 或 sk_test_ 开头）
echo $SSOS_API_KEY

# 重新设置环境变量
export SSOS_API_KEY="sk_live_xxxxxxxxxxxxxx"

# 验证
ssos auth whoami
```

---

### 8.2 连接问题

**问题：Connection refused**

```bash
# 检查 API URL
echo $API_URL

# 如果未设置，使用默认值
export API_URL="https://api.finlaw.cloud"

# 运行健康检查
ssos doctor

# 测试 API 连接
curl https://api.finlaw.cloud/health
```

**问题：Timeout**

```bash
# 检查网络连接
ping api.finlaw.cloud

# 检查防火墙设置
# 确保允许 HTTPS (443) 出站连接

# 使用代理（如果需要）
export HTTPS_PROXY="http://proxy.example.com:8080"
```

---

### 8.3 数据问题

**问题：Resource not found**

```bash
# 检查资源是否存在
ssos crud list <resource> --workspace-id=<workspace-id>

# 检查资源 ID 是否正确
ssos crud get <resource> <id>

# 检查 workspace ID 是否正确
ssos crud list workspaces
```

**问题：Validation error**

```bash
# 检查 JSON 格式是否正确
echo '{"key":"value"}' | jq .

# 检查必填字段是否完整
ssos crud list-types | grep <resource>

# 查看 API 文档获取字段要求
# https://api.finlaw.cloud/docs
```

---

### 8.4 常见错误代码

| 错误代码 | 含义 | 解决方法 |
|---------|------|---------|
| 400 | 请求参数错误 | 检查 JSON 格式和必填字段 |
| 401 | 未认证 | 执行 `ssos auth login` 或设置 API Key |
| 403 | 无权限 | 检查用户角色和工作区权限 |
| 404 | 资源不存在 | 检查资源 ID 和 workspace ID |
| 409 | 冲突（如重复创建） | 检查是否已存在同名资源 |
| 422 | 业务逻辑错误 | 查看错误消息，检查业务规则 |
| 500 | 服务器错误 | 稍后重试，或联系技术支持 |

---

### 8.5 调试技巧

**启用详细输出**:

```bash
# 使用 --json 标志获取完整 JSON 响应
ssos crud list accounts --workspace-id=xxx --json

# 使用 jq 格式化输出
ssos crud list accounts --workspace-id=xxx --json | jq .

# 查看 HTTP 请求（需要设置环境变量）
export DEBUG=ssos:*
ssos crud list accounts --workspace-id=xxx
```

**检查版本**:

```bash
# 查看 CLI 版本
ssos --version

# 查看 Node.js 版本
node --version

# 更新 CLI
npm update -g @xaiverdeng/ssos
```

**清理缓存**:

```bash
# 清除认证缓存
rm ~/.ssos/credentials.json

# 重新登录
ssos auth login
```

---

## 📚 附录

### A. 127 种资源类型完整列表

参见第 3 节「CRUD 层命令」中的资源分类列表。

### B. 环境变量参考

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `SSOS_API_KEY` | API 密钥 | `sk_live_xxxxxxxxxxxxxx` |
| `SSOS_WORKSPACE_ID` | 默认工作区 ID | `workspace_abc123` |
| `API_URL` | API 基础 URL | `https://api.finlaw.cloud` |
| `HTTPS_PROXY` | HTTPS 代理 | `http://proxy.example.com:8080` |
| `DEBUG` | 调试输出 | `ssos:*` |

### C. 相关资源

- **NPM 包**: https://www.npmjs.com/package/@xaiverdeng/ssos
- **GitHub 仓库**: https://github.com/Xaiver03/startupos-ai-tools
- **API 文档**: https://api.finlaw.cloud/docs
- **MCP 服务器**: https://github.com/Xaiver03/startupos-ai-tools/tree/main/mcp-suite
- **问题反馈**: https://github.com/Xaiver03/startupos-ai-tools/issues

---

## 📝 版本历史

- **v2.0.0** (2026-06-09): 三层架构重构，命令减少 67%
- **v1.0.0** (2026-06-08): 首次发布

---

**最后更新**: 2026-06-09  
**CLI 版本**: 2.0.0  
**文档版本**: 1.0
