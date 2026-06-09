# CLI 命令合理性审计报告

生成时间：2026-06-08

## 核心发现

### 🔴 严重的过度设计问题

CLI 有 **279 个命令**，但其中 **大约 200 个（71.7%）是重复的 CRUD 语法糖**。

**原因**: CLI 同时实现了：
1. **通用 CRUD 模块** - `crud.ts` 注册了 127 个资源，提供标准 CRUD 操作
2. **专用模块** - accounting, banking, tax 等 24 个模块，为同样的资源提供"快捷命令"

### 重复示例

#### 会计科目（Accounts）

**CRUD 通用命令**:
```bash
crud list accounts              # 列出科目
crud get accounts <id>          # 获取科目
crud create accounts            # 创建科目
crud update accounts <id>       # 更新科目
crud delete accounts <id>       # 删除科目
```

**Accounting 专用命令**（完全重复）:
```bash
accounting account-list         # 列出科目
# (没有 get 命令)
accounting account-create       # 创建科目
accounting account-update       # 更新科目
accounting account-delete       # 删除科目
```

**结论**: 5 个专用命令只是 CRUD 的别名，无任何额外价值。

#### 银行账户（Bank Accounts）

**CRUD 通用命令**:
```bash
crud list bank-accounts
crud get bank-accounts <id>
crud create bank-accounts
crud update bank-accounts <id>
crud delete bank-accounts <id>
```

**Banking 专用命令**（完全重复）:
```bash
banking account-list
banking account-get
banking account-create
banking account-update
banking account-delete
```

**结论**: 5 个重复命令。

#### 税务模块（Tax）

**CRUD 已注册的资源**:
- annual-bonus (年终奖)
- severance-payments (离职补偿)
- labor-fee-payments (劳务费)
- dividend-payments (股息分红)
- pension-deductions (养老金扣除)
- pension-payments (养老金缴纳)
- property-rental (财产租赁)
- property-transfer (财产转让)
- royalty-income (特许权使用费)
- incidental-income (偶然所得)
- overseas-dispatch (海外派遣)
- tech-achievements (科技成果转化)
- discount-housing-sale (折扣售房)
- rd-expense-deductions (研发费用加计扣除)
- equity-incentive (股权激励)
- employee-tax-deductions (员工个税扣除)
- special-deductions (专项附加扣除)
- iit-filings (个税申报)
- tax-loss-carryforward (亏损弥补)

**Tax 专用命令**（39 个，其中 30+ 个重复）:
```bash
tax bonus-create    → crud create annual-bonus
tax bonus-list      → crud list annual-bonus
tax bonus-get       → crud get annual-bonus
tax bonus-update    → crud update annual-bonus
tax bonus-delete    → crud delete annual-bonus
tax bonus-post      → crud action annual-bonus post

# 同样的模式重复 6 次（bonus, dividend, labor-fee, severance, deduction, iit）
```

**结论**: 39 个税务命令中，30+ 个是纯 CRUD 重复。

## 重复度分析

### 按模块统计

| 模块 | 总命令数 | CRUD 重复 | 专用逻辑 | 重复率 |
|------|---------|----------|---------|--------|
| **accounting** | 22 | 15 | 7 | 68% |
| **tax** | 39 | 32 | 7 | 82% |
| **tax-modules** | 19 | 16 | 3 | 84% |
| **banking** | 13 | 10 | 3 | 77% |
| **invoice** | 13 | 8 | 5 | 62% |
| **hr** | 16 | 12 | 4 | 75% |
| **expense** | 17 | 12 | 5 | 71% |
| **legal** | 16 | 10 | 6 | 63% |
| **admin** | 21 | 18 | 3 | 86% |
| **admin-extended** | 35 | 30 | 5 | 86% |
| **my** | 7 | 5 | 2 | 71% |
| **users** | 3 | 3 | 0 | 100% |
| **files** | 5 | 5 | 0 | 100% |
| **import-export** | 4 | 0 | 4 | 0% |
| **period** | 8 | 5 | 3 | 63% |
| **ai-bookkeeping** | 5 | 2 | 3 | 40% |
| **auth** | 3 | 0 | 3 | 0% |
| **api-key** | 4 | 4 | 0 | 100% |
| **workspace** | 7 | 5 | 2 | 71% |

**总计**: 
- 总命令数: 279
- CRUD 重复: ~200 (71.7%)
- 真正的专用逻辑: ~79 (28.3%)

### 真正有价值的专用命令（79 个）

#### 1. Accounting 专用逻辑（7 个）
```bash
trial-balance           # 试算平衡表
income-statement        # 利润表
general-ledger          # 总账
bank-journal            # 银行日记账
cash-journal            # 现金日记账
account-balances        # 科目余额表
account-balance         # 单个科目余额
```

#### 2. Tax 专用逻辑（7 个）
```bash
calendar                # 税务日历
rules                   # 税务规则
calculations            # 税务计算
filings                 # 税务申报
compliance              # 合规检查
loss-carryforward       # 亏损弥补
# 注: bonus-post, dividend-post 等是 CRUD action 的别名
```

#### 3. Banking 专用逻辑（3 个）
```bash
transaction-import      # 批量导入交易（实际是 crud action）
reconciliation-*        # 对账相关（CRUD 已注册）
# 实际专用: 0，都可以用 CRUD
```

#### 4. Invoice 专用逻辑（5 个）
```bash
batch-create-entries    # 批量生成凭证
create-entry            # 生成单个凭证
reverse                 # 冲红
# partner-* 都是 CRUD
```

#### 5. Import-Export（4 个，真专用）
```bash
balance-sheet           # 资产负债表导出
cash-flow               # 现金流量表导出
income-statement        # 利润表导出
journal-entries         # 凭证导出
```

#### 6. AI-Bookkeeping（3 个，真专用）
```bash
book                    # AI 记账
compliance              # 合规问答
ocr                     # OCR 识别
# conversations, file-upload 是 CRUD
```

#### 7. Auth（3 个，真专用）
```bash
login                   # 登录
logout                  # 登出
status                  # 状态检查
```

#### 8. DB（5 个，服务端专属）
```bash
backup, restore, query, stats, connections
```

#### 9. Logs（4 个，服务端专属）
```bash
start, stop, restart, status
```

#### 10. API（3 个，调试工具）
```bash
call, get, post
```

## 问题根源

### 设计缺陷

1. **没有统一命令规范**
   - 开发者不知道 CRUD 模块的存在
   - 每个模块都自己实现 CRUD 命令
   - 导致大量重复代码

2. **语法糖过度**
   - `accounting account-list` vs `crud list accounts`
   - 前者只是后者的别名，无额外功能
   - 维护成本翻倍

3. **模块职责不清**
   - CRUD 应该是唯一的数据操作入口
   - 专用模块应该只提供业务逻辑命令（如报表生成）

## 精简方案

### 原则

1. **CRUD 是数据操作的唯一入口**
   - 所有 list/get/create/update/delete 都通过 `crud` 命令
   - 专用模块不再提供 CRUD 别名

2. **专用模块只提供业务逻辑**
   - 报表生成（trial-balance, income-statement）
   - 批量操作（batch-import, batch-export）
   - AI 功能（ai-bookkeeping, ocr）
   - 复杂计算（tax calculations, reconciliation）

3. **保留服务端专属工具**
   - db, logs 保留（MCP 不实现）
   - api 保留（调试工具）

### 精简后的模块结构（79 → 15 模块）

#### 保留的模块（15 个）

| 模块 | 命令数 | 说明 |
|------|--------|------|
| **crud** | 7 | 通用数据操作（list, get, create, update, delete, action, resources） |
| **reports** | 12 | 所有报表生成（trial-balance, income-statement, balance-sheet, cash-flow, etc.） |
| **tax** | 5 | 税务计算和规则（calendar, rules, calculations, compliance, filings） |
| **ai** | 5 | AI 功能（bookkeeping, ocr, compliance-qa, prompt, test-connection） |
| **import-export** | 8 | 数据导入导出（journal-entries, invoices, accounts, balance-sheet, etc.） |
| **auth** | 3 | 认证（login, logout, status） |
| **workspace** | 5 | 工作空间管理（list, current, switch, settings, members） |
| **admin** | 8 | 系统管理（users, tenants, monitoring, settings, revenue, subscriptions, etc.） |
| **invoice** | 3 | 发票专用逻辑（create-entry, batch-create-entries, reverse） |
| **reconciliation** | 3 | 银行对账（auto-match, generate-report, smart-match） |
| **period** | 2 | 期间管理（close, opening-balances） |
| **batch** | 3 | 批处理（ocr, import, export） |
| **db** | 5 | 数据库操作（服务端专属） |
| **logs** | 4 | 日志管理（服务端专属） |
| **api** | 3 | API 调试工具 |

**总计**: ~79 个有价值的命令

### 淘汰的模块（10 个，200 个重复命令）

- ❌ accounting（除报表外）→ 用 `crud`
- ❌ banking（除对账外）→ 用 `crud`
- ❌ tax-modules → 用 `crud`
- ❌ hr → 用 `crud`
- ❌ expense → 用 `crud`
- ❌ legal → 用 `crud`
- ❌ my → 用 `crud`
- ❌ users → 用 `crud`
- ❌ files → 用 `crud`
- ❌ admin-extended → 合并到 admin

### 命令迁移示例

**旧命令** → **新命令**

```bash
# 会计科目
accounting account-list        → crud list accounts
accounting account-create      → crud create accounts
accounting account-delete      → crud delete accounts <id>

# 凭证
accounting journal-list        → crud list journal-entries
accounting journal-create      → crud create journal-entries
accounting journal-reverse     → crud action journal-entries <id> reverse
# 报表保留
accounting trial-balance       → reports trial-balance

# 税务
tax bonus-list                 → crud list annual-bonus
tax bonus-create               → crud create annual-bonus
tax bonus-post                 → crud action annual-bonus <id> post
# 专用逻辑保留
tax calendar                   → tax calendar
tax calculations               → tax calculations

# 银行
banking account-list           → crud list bank-accounts
banking transaction-import     → crud action bank-transactions import
# 对账保留
banking reconciliation-*       → reconciliation auto-match

# 发票
invoice list                   → crud list business-vat-invoices
invoice create                 → crud create business-vat-invoices
# 专用逻辑保留
invoice create-entry           → invoice create-entry
invoice reverse                → invoice reverse

# HR
hr employee-list               → crud list employees
hr payroll-create              → crud create payroll-records
hr payroll-post                → crud action payroll-records <id> post

# 法务
legal contract-list            → crud list contracts
legal contract-create          → crud create contracts
legal contract-generate        → crud action contracts generate
legal contract-review          → crud action contracts review

# 报销
expense list                   → crud list expense-claims
expense create                 → crud create expense-claims
expense approve                → crud action expense-claims <id> approve
```

## MCP 实施方案（精简版）

### MCP 应该实现什么？

**按精简后的 79 个命令设计 MCP 工具**，而不是镜像 279 个 CLI 命令。

#### Core Package（通用数据）

```typescript
// 一个通用的 CRUD 工具，覆盖所有资源
resource_list(resource: string, filters: object)    // 替代 200+ 个 list 命令
resource_get(resource: string, id: string)          // 替代 200+ 个 get 命令
resource_create(resource: string, data: object)     // 替代 200+ 个 create 命令
resource_update(resource: string, id: string, data: object)
resource_delete(resource: string, id: string)
resource_action(resource: string, id: string, action: string, data: object)
```

**资源列表**通过配置注册（从 CLI crud.ts 复用）：
- accounts, journal-entries, bank-accounts, employees, contracts, etc.
- 共 127 个资源

#### Reports Package（报表）

```typescript
generate_trial_balance(workspace_id, date_range)
generate_income_statement(workspace_id, date_range)
generate_balance_sheet(workspace_id, date_range)
generate_cash_flow(workspace_id, date_range)
generate_general_ledger(account_id, date_range)
generate_bank_journal(account_id, date_range)
generate_cash_journal(date_range)
generate_account_balances(date_range)
```

#### Tax Package（税务）

```typescript
get_tax_calendar(workspace_id, date_range)
get_tax_rules()
calculate_tax(workspace_id, tax_type, data)
check_tax_compliance(workspace_id)
get_tax_filings(workspace_id)
```

#### AI Package（AI 功能）

```typescript
ai_bookkeeping(workspace_id, text)
ocr_invoice(file_url)
ask_compliance_question(workspace_id, question)
```

#### Invoice Package（发票）

```typescript
create_invoice_entry(invoice_id)
batch_create_invoice_entries(invoice_ids)
reverse_invoice(invoice_id)
```

#### Reconciliation Package（对账）

```typescript
auto_match_reconciliation(workspace_id, period)
generate_reconciliation_report(workspace_id, period)
```

#### Auth & Workspace Package（认证）

```typescript
login(api_key)
logout()
get_auth_status()
list_workspaces()
switch_workspace(workspace_id)
```

### MCP 工具总数：~50 个

| Package | 工具数 |
|---------|--------|
| Core (CRUD) | 6 |
| Reports | 8 |
| Tax | 5 |
| AI | 3 |
| Invoice | 3 |
| Reconciliation | 2 |
| Auth & Workspace | 5 |
| Import-Export | 4 |
| Admin | 8 |
| Period | 2 |
| Batch | 3 |

**总计**: ~50 个 MCP 工具，覆盖 279 个 CLI 命令的所有功能

## 实施计划

### Phase 1: CLI 精简（2周）

1. **保留所有现有命令（向后兼容）**
2. **添加废弃警告**
   ```bash
   accounting account-list
   # 输出:
   # ⚠️  Deprecated: Use 'crud list accounts' instead
   # This command will be removed in v2.0
   ```
3. **文档更新**
   - README: 推荐使用 CRUD
   - 迁移指南

### Phase 2: MCP 通用实现（1周）

1. **实现 Core Package 通用 CRUD**
   ```typescript
   // 一个工具替代 200+ 个重复工具
   resource_list('accounts', { limit: 10 })
   resource_list('journal-entries', { status: 'posted' })
   resource_create('employees', { name: '张三' })
   ```

2. **资源配置复用**
   - 从 CLI crud.ts 导出资源配置
   - MCP 直接复用

### Phase 3: MCP 专用包（1周）

1. **Reports Package**（8 个工具）
2. **Tax Package**（5 个工具）
3. **AI Package**（3 个工具）
4. **其他专用包**（~30 个工具）

### Phase 4: CLI v2.0（3个月后）

1. **移除废弃命令**
2. **只保留 79 个有价值命令**

## 结论

### 当前问题

- ✅ CLI 有 279 个命令
- ❌ 其中 200 个（71.7%）是 CRUD 重复
- ❌ 真正有价值的只有 79 个（28.3%）
- ❌ MCP 试图镜像 279 个命令 → 工作量巨大且无意义

### 正确方案

- ✅ CLI 精简到 79 个有价值命令
- ✅ MCP 实现 ~50 个工具（通过通用 CRUD + 专用逻辑）
- ✅ 通用 CRUD 工具覆盖 127 个资源的所有操作
- ✅ 专用工具覆盖报表、税务、AI 等业务逻辑

### 收益

| 指标 | 当前 | 优化后 | 改善 |
|------|------|--------|------|
| CLI 命令数 | 279 | 79 | -71.7% |
| MCP 工具数 | 77 (27.6%) | 50 (100%) | 完整覆盖 |
| 维护成本 | 高（大量重复） | 低（无重复） | -70% |
| 用户学习成本 | 高（279 个命令） | 低（79 个命令） | -71.7% |
| 开发时间 | 4周（镜像 279 个） | 2周（50 个工具） | -50% |

### 下一步

1. ✅ **立即**：实现 MCP Core Package 通用 CRUD（1天）
2. ✅ **本周**：实现 MCP 专用包（Reports, Tax, AI）（3天）
3. ✅ **下周**：CLI 添加废弃警告，推广 CRUD 命令（2天）
4. 🕐 **3个月后**：CLI v2.0 移除废弃命令

---

**最重要的结论**: 不要镜像 CLI 的 279 个命令到 MCP，应该实现 50 个精简的 MCP 工具，通过通用 CRUD + 专用逻辑覆盖所有功能。
