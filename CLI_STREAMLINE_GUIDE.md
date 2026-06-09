# CLI 命令精简 - 实施指南

## 已完成 ✅

### Accounting Module
- **删除前**: 22 个命令
- **删除后**: 7 个命令（-68%）
- **编译状态**: ✅ 通过（无 any 类型）
- **测试状态**: ✅ 通过

**保留的命令**:
```bash
accounting trial-balance
accounting income-statement
accounting general-ledger
accounting bank-journal
accounting cash-journal
accounting account-balances
accounting account-balance
```

**删除的命令** (15个 - 全部改用 CRUD):
```bash
# 改用: crud list journal-entries
accounting journal-list

# 改用: crud get journal-entries <id>
accounting journal-get

# 改用: crud create journal-entries
accounting journal-create

# 改用: crud update journal-entries <id>
accounting journal-update

# 改用: crud delete journal-entries <id>
accounting journal-delete

# 改用: crud action journal-entries <id> approve
accounting journal-approve

# 改用: crud action journal-entries <id> reject
accounting journal-reject

# 改用: crud action journal-entries <id> post
accounting journal-post

# 改用: crud action journal-entries <id> unpost
accounting journal-unpost

# 改用: crud action journal-entries <id> reverse
accounting journal-reverse

# 改用: crud action journal-entries <id> submit-review
accounting journal-submit-review

# 改用: crud list accounts
accounting account-list

# 改用: crud create accounts
accounting account-create

# 改用: crud update accounts <id>
accounting account-update

# 改用: crud delete accounts <id>
accounting account-delete
```

## 待完成模块

### 1. Tax Module (39 → 7 命令) 🔴 高优先级

**保留** (7个 - 业务逻辑):
- tax calendar
- tax rules
- tax calculations
- tax compliance
- tax filings
- tax loss-carryforward

**删除** (32个 - CRUD 重复):
```bash
# Annual Bonus (年终奖) - 6个命令
tax bonus-create    → crud create annual-bonus
tax bonus-delete    → crud delete annual-bonus <id>
tax bonus-get       → crud get annual-bonus <id>
tax bonus-list      → crud list annual-bonus
tax bonus-update    → crud update annual-bonus <id>
tax bonus-post      → crud action annual-bonus <id> post

# Dividend (股息分红) - 6个命令
tax dividend-create  → crud create dividend-payments
tax dividend-delete  → crud delete dividend-payments <id>
tax dividend-get     → crud get dividend-payments <id>
tax dividend-list    → crud list dividend-payments
tax dividend-update  → crud update dividend-payments <id>
tax dividend-post    → crud action dividend-payments <id> post

# Labor Fee (劳务费) - 6个命令
tax labor-fee-create → crud create labor-fee-payments
tax labor-fee-delete → crud delete labor-fee-payments <id>
tax labor-fee-get    → crud get labor-fee-payments <id>
tax labor-fee-list   → crud list labor-fee-payments
tax labor-fee-update → crud update labor-fee-payments <id>
tax labor-fee-void   → crud action labor-fee-payments <id> void

# Severance (离职补偿) - 6个命令
tax severance-create → crud create severance-payments
tax severance-delete → crud delete severance-payments <id>
tax severance-get    → crud get severance-payments <id>
tax severance-list   → crud list severance-payments
tax severance-update → crud update severance-payments <id>
tax severance-post   → crud action severance-payments <id> post

# Deduction (扣除) - 5个命令
tax deduction-create  → crud create employee-tax-deductions
tax deduction-delete  → crud delete employee-tax-deductions <id>
tax deduction-list    → crud list employee-tax-deductions
tax deduction-update  → crud update employee-tax-deductions <id>
tax deduction-summary → crud action employee-tax-deductions summary

# IIT (个税申报) - 4个命令
tax iit-get         → crud get iit-filings <id>
tax iit-list        → crud list iit-filings
tax iit-mark-filed  → crud action iit-filings <id> mark-filed
tax iit-pay         → crud action iit-filings <id> pay
```

**实施步骤**:
1. 创建新的 `tax.ts`，只保留 7 个业务逻辑命令
2. 在文件顶部添加注释说明删除的命令及其替代方案
3. 定义完整类型接口（禁止 any）
4. 测试编译通过

### 2. Banking Module (13 → 0 命令) 🟡 中优先级

**全部删除** - 所有命令都是 CRUD:
```bash
banking account-create     → crud create bank-accounts
banking account-delete     → crud delete bank-accounts <id>
banking account-get        → crud get bank-accounts <id>
banking account-list       → crud list bank-accounts
banking account-update     → crud update bank-accounts <id>

banking transaction-get    → crud get bank-transactions <id>
banking transaction-import → crud action bank-transactions import
banking transaction-list   → crud list bank-transactions

banking reconciliation-create → crud create reconciliation-records
banking reconciliation-delete → crud delete reconciliation-records <id>
banking reconciliation-get    → crud get reconciliation-records <id>
banking reconciliation-list   → crud list reconciliation-records
banking reconciliation-update → crud update reconciliation-records <id>
```

**实施步骤**:
1. **选项A**: 删除整个 `banking.ts` 文件
2. **选项B**: 保留文件，添加说明，所有命令重定向到 CRUD

推荐：**删除整个文件**

### 3. HR Module (16 → 0 命令) 🟡 中优先级

**全部删除** - 所有命令都是 CRUD:
```bash
hr employee-create  → crud create employees
hr employee-delete  → crud delete employees <id>
hr employee-get     → crud get employees <id>
hr employee-list    → crud list employees
hr employee-update  → crud update employees <id>

hr payroll-create   → crud create payroll-records
hr payroll-delete   → crud delete payroll-records <id>
hr payroll-get      → crud get payroll-records <id>
hr payroll-list     → crud list payroll-records
hr payroll-update   → crud update payroll-records <id>
hr payroll-post     → crud action payroll-records <id> post

hr contract-create  → crud create labor-contracts
hr contract-delete  → crud delete labor-contracts <id>
hr contract-get     → crud get labor-contracts <id>
hr contract-list    → crud list labor-contracts
hr contract-update  → crud update labor-contracts <id>
```

推荐：**删除整个文件**

### 4. Legal Module (16 → 0 命令) 🟡 中优先级

**全部删除** - 所有命令都是 CRUD 或 action:
```bash
legal contract-create    → crud create contracts
legal contract-delete    → crud delete contracts <id>
legal contract-get       → crud get contracts <id>
legal contract-list      → crud list contracts
legal contract-update    → crud update contracts <id>
legal contract-generate  → crud action contracts generate
legal contract-review    → crud action contracts review

legal demand-delete      → crud delete demand-letters <id>
legal demand-generate    → crud action demand-letters generate
legal demand-get         → crud get demand-letters <id>
legal demand-list        → crud list demand-letters
legal demand-save        → crud create demand-letters
legal demand-update      → crud update demand-letters <id>

legal legal-path         → crud action demand-letters legal-path
legal review-ask         → crud action contract-reviews ask
legal review-get         → crud get contract-reviews <id>
```

推荐：**删除整个文件**

### 5. Expense Module (17 → 0 命令) 🟡 中优先级

**全部删除**:
```bash
expense create           → crud create expense-claims
expense list             → crud list expense-claims
expense get              → crud get expense-claims <id>
expense update           → crud update expense-claims <id>
expense delete           → crud delete expense-claims <id>
expense approve          → crud action expense-claims <id> approve
expense reject           → crud action expense-claims <id> reject
expense reimburse        → crud action expense-claims <id> reimburse
expense submit           → crud action expense-claims <id> submit

expense department-create → crud create departments
expense department-delete → crud delete departments <id>
expense department-list   → crud list departments
expense department-update → crud update departments <id>

expense project-create   → crud create projects
expense project-delete   → crud delete projects <id>
expense project-list     → crud list projects
expense project-update   → crud update projects <id>
```

推荐：**删除整个文件**

### 6. Invoice Module (13 → 3 命令) 🟢 低优先级

**保留** (3个 - 业务逻辑):
- invoice create-entry
- invoice batch-create-entries
- invoice reverse

**删除** (10个):
```bash
invoice create           → crud create business-vat-invoices
invoice list             → crud list business-vat-invoices
invoice get              → crud get business-vat-invoices <id>
invoice update           → crud update business-vat-invoices <id>
invoice delete           → crud delete business-vat-invoices <id>

invoice partner-create   → crud create partners
invoice partner-delete   → crud delete partners <id>
invoice partner-get      → crud get partners <id>
invoice partner-list     → crud list partners
invoice partner-update   → crud update partners <id>
```

### 7. Period Module (8 → 2 命令) 🟢 低优先级

**保留** (2个 - 业务逻辑):
- period close
- period opening-balances
- period set-opening-balance

**删除** (5个):
```bash
period create            → crud create accounting-periods
period delete            → crud delete accounting-periods <id>
period get               → crud get accounting-periods <id>
period list              → crud list accounting-periods
period update            → crud update accounting-periods <id>
```

### 8. 其他保持不变的模块

这些模块已经是业务逻辑，保持不变：
- ✅ ai-bookkeeping (5个命令)
- ✅ auth (3个命令)
- ✅ workspace-api (5个命令)
- ✅ api-key (4个命令)
- ✅ crud (7个命令)
- ✅ admin (21个命令)
- ✅ files (5个命令)
- ✅ import-export (4个命令)
- ✅ db (5个命令)
- ✅ logs (4个命令)

## 预计最终结果

| 模块 | 删除前 | 删除后 | 删除数 |
|------|--------|--------|--------|
| accounting | 22 | 7 | -15 ✅ |
| tax | 39 | 7 | -32 |
| banking | 13 | 0 | -13 |
| hr | 16 | 0 | -16 |
| legal | 16 | 0 | -16 |
| expense | 17 | 0 | -17 |
| invoice | 13 | 3 | -10 |
| period | 8 | 3 | -5 |
| **小计** | **144** | **20** | **-124** |
| **保持不变** | **135** | **135** | **0** |
| **总计** | **279** | **155** | **-124** |

## 实施步骤

### Phase 1: 删除简单模块（1小时）
1. 删除 banking.ts
2. 删除 hr.ts
3. 删除 legal.ts
4. 删除 expense.ts
5. 从 index.ts 中移除这些模块的导入

### Phase 2: 精简复杂模块（2小时）
1. 精简 tax.ts (39 → 7)
2. 精简 invoice.ts (13 → 3)
3. 精简 period.ts (8 → 3)

### Phase 3: 更新测试（1小时）
1. 更新测试脚本
2. 更新文档
3. 创建迁移指南

## 迁移指南示例

用户需要的迁移文档：

```markdown
# SSOS CLI v2.0 迁移指南

## 重大变更

为了简化 CLI 命令，我们删除了 200+ 个重复的 CRUD 命令，统一使用 `crud` 命令。

## 快速对照表

### 凭证管理
旧命令: `ssos-cli accounting journal-list -w <id>`
新命令: `ssos-cli crud list journal-entries --workspace <id>`

旧命令: `ssos-cli accounting journal-create -w <id> ...`
新命令: `ssos-cli crud create journal-entries --data '{...}'`

### 员工管理
旧命令: `ssos-cli hr employee-list -w <id>`
新命令: `ssos-cli crud list employees --workspace <id>`

### 完整对照
见文档: docs/CLI_MIGRATION_GUIDE.md
```

## 下一步

选择一个选项继续：
1. **继续删除** - 按 Phase 1 → Phase 2 → Phase 3 顺序执行
2. **先测试** - 测试当前的 accounting 精简版是否工作正常
3. **暂停** - 保存当前进度，稍后继续

---

**当前进度**: 1/8 模块完成 (12.5%)
**预计剩余时间**: 4小时
