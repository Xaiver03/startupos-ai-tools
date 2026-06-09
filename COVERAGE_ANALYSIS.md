# SSOS 工具覆盖度分析报告

生成时间：2026-06-08

## 执行摘要

### 数量统计

| 工具系统 | 模块数 | 命令/工具数 | 覆盖率 |
|---------|--------|------------|--------|
| **CLI** | 25 | **279** | 100% (基准) |
| **MCP Suite** | 5 packages, 17 files | **77** | **27.6%** |
| **Skills** | 3 | N/A | 仅文档 |

### 关键发现

🔴 **严重问题**：
1. MCP Suite 仅覆盖 27.6% 的 CLI 功能（77/279）
2. 核心模块缺失：tax (39命令), admin (56命令), invoice (13命令)
3. Skills 未实现工具绑定机制

🟡 **中等问题**：
1. CLI 命令分散在 25 个模块，存在重复（workspace vs workspace-api）
2. MCP 工具命名不一致（snake_case vs CLI kebab-case）

## 详细分析

### 一、CLI 命令完整清单（按模块）

#### 1. Tax Module（税务）- 39 命令 ⚠️ **MCP 缺失**

```
tax (39 commands):
├── bonus-create, bonus-delete, bonus-get, bonus-list, bonus-post, bonus-update
├── calculations
├── calendar
├── compliance
├── deduction-create, deduction-delete, deduction-list, deduction-summary, deduction-update
├── dividend-create, dividend-delete, dividend-get, dividend-list, dividend-post, dividend-update
├── filings
├── iit-get, iit-list, iit-mark-filed, iit-pay
├── labor-fee-create, labor-fee-delete, labor-fee-get, labor-fee-list, labor-fee-update, labor-fee-void
├── loss-carryforward
├── rules
└── severance-create, severance-delete, severance-get, severance-list, severance-post, severance-update

MCP 覆盖度: 3/39 (7.7%)
MCP 仅有: get_tax_calculations, get_tax_calendar_rules, get_tax_calendar_tasks
```

#### 2. Admin-Extended Module（扩展管理）- 35 命令 ⚠️ **MCP 完全缺失**

```
admin-extended (35 commands):
├── announcements (list, create, delete)
├── compliance-kb (list, get)
├── coupons (list, create, distribute, delete)
├── force-cancel
├── metrics
├── orders (list, get, refund)
├── permissions (list)
├── plans (list, create, delete)
├── revenue
├── roles (list)
├── subscriptions (list, get)
├── tax-rules (list)
├── usage (by user/workspace)
└── users (list)

MCP 覆盖度: 0/35 (0%)
```

#### 3. Accounting Module（会计）- 22 命令 ✅ **MCP 基本覆盖**

```
accounting (22 commands):
├── account-balance, account-balances, account-create, account-delete, account-list, account-update
├── bank-journal, cash-journal, general-ledger
├── income-statement
├── journal-approve, journal-create, journal-delete, journal-get, journal-list
├── journal-post, journal-reject, journal-reverse, journal-submit-review, journal-unpost, journal-update
└── trial-balance

MCP 覆盖度: 16/22 (72.7%)
MCP 有: list_journal_entries, get_journal_entry, create_journal_entry, list_accounts, 
        get_account_balance, get_account_balances, generate_trial_balance, 
        generate_income_statement, generate_bank_journal, generate_cash_journal, 
        get_general_ledger, close_period, create_accounting_period, 
        list_accounting_periods, get_opening_balances, set_opening_balance

MCP 缺失: journal-approve, journal-reject, journal-submit-review, journal-unpost, 
         account-create, account-delete, account-update
```

#### 4. Admin Module（管理）- 21 命令 ⚠️ **MCP 完全缺失**

```
admin (21 commands):
├── activate, ban, unban, suspend
├── batch
├── get (user/workspace/tenant)
├── growth
├── list (users/workspaces/tenants)
├── monitoring
├── overview
├── reset-password
├── set, settings
├── tenants, top-tenants
├── users
└── whoami

MCP 覆盖度: 0/21 (0%)
```

#### 5. Tax-Modules Module（税务模块）- 19 命令 ⚠️ **MCP 完全缺失**

```
tax-modules (19 commands):
├── confirm, create, delete, get, list, post, update, summary
├── discount-housing
├── equity-incentive
├── incidental-income
├── overseas-dispatch
├── pension-deduction, pension-payment
├── property-rental, property-transfer
├── rd-expense
├── royalty-income
└── tech-achievements

MCP 覆盖度: 0/19 (0%)
```

#### 6. Expense Module（报销）- 17 命令 ✅ **MCP 基本覆盖**

```
expense (17 commands):
├── approve, create, delete, get, list, reimburse, reject, submit, update
├── department-create, department-delete, department-list, department-update
└── project-create, project-delete, project-list, project-update

MCP 覆盖度: 12/17 (70.6%)
MCP 有: create_expense_claim, list_expense_claims, approve_expense_claim,
        create_department, list_departments, create_project, list_projects

MCP 缺失: reimburse, submit, department-delete/update, project-delete/update
```

#### 7. Legal Module（法务）- 16 命令 ✅ **MCP 完全覆盖**

```
legal (16 commands):
├── contract-create, contract-delete, contract-generate, contract-get, contract-list
├── contract-review, contract-update
├── demand-delete, demand-generate, demand-get, demand-list, demand-save, demand-update
├── legal-path
├── review-ask
└── review-get

MCP 覆盖度: 13/16 (81.3%)
MCP 有: create_contract, get_contract, list_contracts, update_contract,
        generate_contract, review_contract_text, get_contract_review,
        list_contract_reviews, ask_contract_question, generate_demand_letter,
        list_demand_letters, save_demand_letter, get_legal_path_recommendation

MCP 缺失: contract-delete, demand-delete, demand-get, demand-update
```

#### 8. HR Module（人力资源）- 16 命令 ✅ **MCP 基本覆盖**

```
hr (16 commands):
├── contract-create, contract-delete, contract-get, contract-list, contract-update
├── employee-create, employee-delete, employee-get, employee-list, employee-update
├── payroll-create, payroll-delete, payroll-get, payroll-list
├── payroll-post
└── payroll-update

MCP 覆盖度: 10/16 (62.5%)
MCP 有: create_employee, get_employee, list_employees, update_employee, delete_employee,
        create_labor_contract, list_labor_contracts, create_payroll_record,
        list_payroll_records, post_payroll

MCP 缺失: contract-delete/get/update, payroll-delete/get/update
```

#### 9. Banking Module（银行）- 13 命令 ✅ **MCP 基本覆盖**

```
banking (13 commands):
├── account-create, account-delete, account-get, account-list, account-update
├── reconciliation-create, reconciliation-delete, reconciliation-get
├── reconciliation-list, reconciliation-update
├── transaction-get, transaction-import
└── transaction-list

MCP 覆盖度: 7/13 (53.8%)
MCP 有: create_bank_account, list_bank_accounts, import_bank_transactions,
        list_bank_transactions, list_reconciliation_records

MCP 缺失: account-delete/get/update, reconciliation-create/delete/get/update,
         transaction-get
```

#### 10. Invoice Module（发票）- 13 命令 ⚠️ **MCP 部分覆盖**

```
invoice (13 commands):
├── batch-create-entries
├── create, create-entry, delete, get, list, reverse, update
├── partner-create, partner-delete, partner-get, partner-list
└── partner-update

MCP 覆盖度: 5/13 (38.5%)
MCP 有: create_vat_invoice, list_vat_invoices, create_partner,
        list_partners, update_partner

MCP 缺失: delete, get, reverse, update (invoice), batch-create-entries,
         partner-delete/get
```

#### 11. Period Module（会计期间）- 8 命令 ✅ **MCP 完全覆盖**

```
period (8 commands):
├── close, create, delete, get, list, update
├── opening-balances
└── set-opening-balance

MCP 覆盖度: 6/8 (75%)
MCP 有: close_period, create_accounting_period, list_accounting_periods,
        get_opening_balances, set_opening_balance

MCP 缺失: delete, get, update (period)
```

#### 12. My Module（个人中心）- 7 命令 ⚠️ **MCP 完全缺失**

```
my (7 commands):
├── expense-categories, expense-create, expense-get, expense-list, expense-submit
├── payslip
└── payslips

MCP 覆盖度: 0/7 (0%)
```

#### 13. CRUD Module（通用 CRUD）- 7 命令 ⚠️ **MCP 完全缺失**

```
crud (7 commands):
├── action, create, delete, get, list
├── resources
└── update

MCP 覆盖度: 0/7 (0%)
注: 这是通用模块，不应该在 MCP 中镜像实现
```

#### 14. Workspace-API Module（工作空间 API）- 5 命令 ✅ **MCP 完全覆盖**

```
workspace-api (5 commands):
├── current, list, members, settings
└── switch

MCP 覆盖度: 5/5 (100%)
MCP 有: get_current_workspace, list_workspaces, switch_workspace,
        get_workspace_settings
```

#### 15. AI-Bookkeeping Module（AI 记账）- 5 命令 ✅ **MCP 完全覆盖**

```
ai-bookkeeping (5 commands):
├── book, compliance, conversations
├── file-upload
└── ocr

MCP 覆盖度: 4/5 (80%)
MCP 有: ai_bookkeeping, ask_compliance_question, list_ai_conversations, ocr_invoice

MCP 缺失: file-upload (应该用 files 模块)
```

#### 16. DB Module（数据库）- 5 命令 ⚠️ **MCP 故意不实现**

```
db (5 commands):
├── backup, connections, query, restore
└── stats

MCP 覆盖度: 0/5 (0%)
原因: MCP 不应该直连数据库，这是服务端专属功能
```

#### 17. Files Module（文件）- 5 命令 ⚠️ **MCP 完全缺失**

```
files (5 commands):
├── delete, download, get, list
└── upload

MCP 覆盖度: 0/5 (0%)
```

#### 18. Logs Module（日志）- 4 命令 ⚠️ **MCP 故意不实现**

```
logs (4 commands):
├── restart, start, status
└── stop

MCP 覆盖度: 0/4 (0%)
原因: PM2 管理是服务端专属功能
```

#### 19. API-Key Module（API 密钥）- 4 命令 ✅ **MCP 完全覆盖**

```
api-key (4 commands):
├── create, list, revoke
└── toggle

MCP 覆盖度: 4/4 (100%)
MCP 有: create_api_key, list_api_keys, revoke_api_key, toggle_api_key
```

#### 20. Import-Export Module（导入导出）- 4 命令 ⚠️ **MCP 完全缺失**

```
import-export (4 commands):
├── balance-sheet, cash-flow
├── income-statement
└── journal-entries

MCP 覆盖度: 0/4 (0%)
```

#### 21. Auth Module（认证）- 3 命令 ✅ **MCP 部分覆盖**

```
auth (3 commands):
├── login, logout
└── status

MCP 覆盖度: 2/3 (66.7%)
MCP 有: logout, get_auth_info, list_saved_accounts, switch_account, remove_account

MCP 缺失: login (MCP 使用 OAuth 或 API Key，不支持密码登录)
```

#### 22. AI Module（AI）- 3 命令 ⚠️ **MCP 完全缺失**

```
ai (3 commands):
├── prompt
├── test-connection
└── usage-stats

MCP 覆盖度: 0/3 (0%)
```

#### 23. API Module（API）- 3 命令 ⚠️ **MCP 完全缺失**

```
api (3 commands):
├── call, get
└── post

MCP 覆盖度: 0/3 (0%)
注: 这是调试工具，不需要在 MCP 中实现
```

#### 24. Users Module（用户）- 3 命令 ⚠️ **MCP 完全缺失**

```
users (3 commands):
├── get, list
└── reset-password

MCP 覆盖度: 0/3 (0%)
```

#### 25. Workspace Module（工作空间）- 2 命令 ✅ **MCP 覆盖（通过 workspace-api）**

```
workspace (2 commands):
├── list
└── stats

MCP 覆盖度: 1/2 (50%)
MCP 有: list_workspaces
MCP 缺失: stats
```

## 覆盖度矩阵

### 按功能域分类

| 功能域 | CLI 命令数 | MCP 工具数 | 覆盖率 | 状态 |
|--------|-----------|-----------|--------|------|
| **核心财务** | 57 | 41 | 71.9% | ⚠️ 需补全 |
| - Accounting | 22 | 16 | 72.7% | ⚠️ |
| - Banking | 13 | 7 | 53.8% | ⚠️ |
| - Invoice | 13 | 5 | 38.5% | ⚠️ |
| - Period | 8 | 6 | 75% | ⚠️ |
| **税务与薪酬** | 74 | 10 | 13.5% | 🔴 严重不足 |
| - Tax | 39 | 3 | 7.7% | 🔴 |
| - Tax-Modules | 19 | 0 | 0% | 🔴 |
| - HR | 16 | 10 | 62.5% | ⚠️ |
| **费用与法务** | 33 | 25 | 75.8% | ⚠️ 需补全 |
| - Expense | 17 | 12 | 70.6% | ⚠️ |
| - Legal | 16 | 13 | 81.3% | ✅ |
| **AI 与自动化** | 8 | 4 | 50% | ⚠️ |
| - AI-Bookkeeping | 5 | 4 | 80% | ✅ |
| - AI | 3 | 0 | 0% | ⚠️ |
| **系统管理** | 76 | 0 | 0% | 🔴 完全缺失 |
| - Admin | 21 | 0 | 0% | 🔴 |
| - Admin-Extended | 35 | 0 | 0% | 🔴 |
| - Users | 3 | 0 | 0% | 🔴 |
| - My | 7 | 0 | 0% | 🔴 |
| - Files | 5 | 0 | 0% | 🔴 |
| - Import-Export | 4 | 0 | 0% | 🔴 |
| **认证与工作空间** | 14 | 13 | 92.9% | ✅ |
| - Auth | 3 | 2 | 66.7% | ✅ |
| - API-Key | 4 | 4 | 100% | ✅ |
| - Workspace | 7 | 5 | 71.4% | ✅ |
| **服务端专属** | 17 | 0 | N/A | ✅ 故意不实现 |
| - DB | 5 | 0 | N/A | ✅ |
| - Logs | 4 | 0 | N/A | ✅ |
| - CRUD | 7 | 0 | N/A | ✅ |
| - API (debug) | 3 | 0 | N/A | ✅ |

### 优先级评估

#### P0 - 关键缺失（立即补充）

1. **Tax Module (39 命令 → 3 工具 = 7.7%)**
   ```
   缺失功能：
   - 奖金个税 (bonus-*)
   - 专项扣除 (deduction-*)
   - 股息红利 (dividend-*)
   - 个税申报 (iit-*)
   - 劳务费 (labor-fee-*)
   - 离职补偿 (severance-*)
   
   影响：无法完成个税计算和申报
   工作量：3-5天
   ```

2. **Tax-Modules (19 命令 → 0 工具 = 0%)**
   ```
   缺失功能：
   - 住房租金扣除
   - 股权激励
   - 养老金
   - 财产转让
   - 研发费用
   
   影响：无法处理特殊税务场景
   工作量：2-3天
   ```

3. **Invoice 补全 (13 命令 → 5 工具 = 38.5%)**
   ```
   缺失功能：
   - delete, get, update (invoice)
   - reverse (冲红)
   - batch-create-entries
   - partner CRUD 补全
   
   影响：发票管理功能不完整
   工作量：1天
   ```

#### P1 - 重要缺失（1周内补充）

4. **Admin & Admin-Extended (56 命令 → 0 工具 = 0%)**
   ```
   缺失功能：
   - 用户管理 (21 命令)
   - 订阅计费 (35 命令)
   - 系统监控
   - 运营数据
   
   影响：无法进行系统管理
   工作量：3-4天
   ```

5. **Files Module (5 命令 → 0 工具 = 0%)**
   ```
   缺失功能：
   - upload, download
   - list, get, delete
   
   影响：无法管理附件和文件
   工作量：0.5天
   ```

6. **Import-Export (4 命令 → 0 工具 = 0%)**
   ```
   缺失功能：
   - 导出报表 (balance-sheet, cash-flow, income-statement)
   - 导出凭证 (journal-entries)
   
   影响：无法批量导出数据
   工作量：1天
   ```

#### P2 - 补充完善（2周内）

7. **Banking 补全 (13 命令 → 7 工具 = 53.8%)**
   ```
   缺失功能：
   - account CRUD 补全
   - reconciliation CRUD
   - transaction-get
   
   工作量：1天
   ```

8. **Expense 补全 (17 命令 → 12 工具 = 70.6%)**
   ```
   缺失功能：
   - reimburse, submit
   - department/project CRUD 补全
   
   工作量：0.5天
   ```

9. **HR 补全 (16 命令 → 10 工具 = 62.5%)**
   ```
   缺失功能：
   - contract CRUD 补全
   - payroll CRUD 补全
   
   工作量：1天
   ```

10. **My Module (7 命令 → 0 工具 = 0%)**
    ```
    缺失功能：
    - 个人报销
    - 个人工资单
    
    工作量：0.5天
    ```

#### P3 - 低优先级

11. **Users Module** - 合并到 Admin
12. **AI Module** - 调试工具，非必需

## 实施计划

### Week 1: P0 关键补充

**目标**: Tax 完整覆盖，Invoice 补全

| 任务 | 工作量 | 输出 |
|------|--------|------|
| Tax Module 补全 | 3天 | 新增 36 个工具 |
| Tax-Modules 实现 | 2天 | 新增 19 个工具 |
| Invoice 补全 | 1天 | 新增 8 个工具 |

**验收标准**:
- [ ] Tax 覆盖率 7.7% → 100%
- [ ] Tax-Modules 覆盖率 0% → 100%
- [ ] Invoice 覆盖率 38.5% → 100%

### Week 2: P1 重要功能

**目标**: Admin & Files 实现

| 任务 | 工作量 | 输出 |
|------|--------|------|
| Admin Module | 2天 | 新增 21 个工具 |
| Admin-Extended Module | 2天 | 新增 35 个工具 |
| Files Module | 0.5天 | 新增 5 个工具 |
| Import-Export Module | 1天 | 新增 4 个工具 |

**验收标准**:
- [ ] Admin 覆盖率 0% → 100%
- [ ] Files 覆盖率 0% → 100%
- [ ] Import-Export 覆盖率 0% → 100%

### Week 3-4: P2 补充完善

**目标**: 所有模块 80%+ 覆盖

| 任务 | 工作量 | 输出 |
|------|--------|------|
| Banking 补全 | 1天 | 新增 6 个工具 |
| Expense 补全 | 0.5天 | 新增 5 个工具 |
| HR 补全 | 1天 | 新增 6 个工具 |
| My Module | 0.5天 | 新增 7 个工具 |
| Accounting 补全 | 1天 | 新增 6 个工具 |

**验收标准**:
- [ ] 所有核心模块覆盖率 > 80%
- [ ] 总体覆盖率 27.6% → 85%+

## 目标

### 短期目标（1个月）

- ✅ MCP Suite 覆盖率：27.6% → **85%**
- ✅ 补充工具数量：77 → **220+**
- ✅ P0/P1 模块 100% 覆盖

### 中期目标（2个月）

- ✅ MCP Suite 覆盖率：85% → **95%**
- ✅ Skills 实现工具绑定
- ✅ 端到端测试 80% 覆盖

### 长期目标（3个月）

- ✅ MCP Suite 与 CLI 完全对等
- ✅ 自动化文档生成
- ✅ 性能优化和缓存

## 验收清单

### MCP Suite 完整性检查

- [ ] Tax: 39 → 39 (100%)
- [ ] Tax-Modules: 19 → 19 (100%)
- [ ] Admin: 21 → 21 (100%)
- [ ] Admin-Extended: 35 → 35 (100%)
- [ ] Invoice: 13 → 13 (100%)
- [ ] Files: 5 → 5 (100%)
- [ ] Import-Export: 4 → 4 (100%)
- [ ] Banking: 13 → 13 (100%)
- [ ] Expense: 17 → 17 (100%)
- [ ] HR: 16 → 16 (100%)
- [ ] My: 7 → 7 (100%)
- [ ] Accounting: 22 → 22 (100%)

### 功能验收

- [ ] 所有 CRUD 操作完整
- [ ] 所有报表生成可用
- [ ] 所有税务计算正确
- [ ] 所有 AI 功能正常
- [ ] 认证和权限正常
- [ ] 文件上传下载正常

### 测试覆盖

- [ ] 单元测试 80%+
- [ ] 集成测试 50%+
- [ ] 端到端测试 30%+

## 结论

**当前状态**: MCP Suite 仅覆盖 27.6% CLI 功能，核心税务模块几乎完全缺失

**行动计划**: 
1. Week 1: Tax 模块补全（P0）
2. Week 2: Admin & Files 实现（P1）
3. Week 3-4: 其他模块补全（P2）

**预期结果**: 4周内 MCP Suite 覆盖率从 27.6% 提升到 85%+

---

**下一步**: 立即开始 Tax Module 补全
