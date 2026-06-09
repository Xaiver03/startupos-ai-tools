# StartupOS CLI 命令全面分析与抽象方案

**日期**: 2026-06-09  
**版本**: 1.0  
**包名**: `@xaiverdeng/ssos`

---

## 📋 执行摘要

**问题**:
1. 命令过多（155+），难以记忆
2. 部分命令标签不准确（如 `invoice create` 实际不创建发票）
3. 大量操作本质是 CRUD，但分散在各个专用命令中
4. 区分不清哪些需要 AI 辅助，哪些是纯数据操作

**核心发现**:
- **90%+ 是 CRUD 操作** - 应通过统一 `crud` 命令访问 127 种资源
- **5% 是业务逻辑** - 需要专用命令（如报表生成、税务计算）
- **<5% 是 AI 辅助** - 智能记账、合同审查、合规问答

**建议方案**:
- **主路径**: `ssos crud <action> <resource>` - 纯数据操作
- **业务命令**: `ssos accounting trial-balance` - 复杂计算和报表
- **AI 命令**: `ssos ai-bookkeeping scan` - 需要 LLM 推理的操作

---

## 🎯 设计目标

1. **易记忆** - 少数几个模式覆盖所有场景
2. **语义清晰** - 命令名准确反映功能
3. **一致性** - 相似操作用相似命令
4. **可发现** - 用户容易找到需要的功能

---

## 📊 当前命令清单

### 1. 认证模块 (auth) - 3 命令

| 命令 | 功能 | 类型 | 问题 |
|------|------|------|------|
| `auth login` | 邮箱密码登录 | 业务 | ✓ 合理 |
| `auth api-key <key>` | 设置 API Key | 业务 | ✓ 合理 |
| `auth whoami` | 查看当前用户 | 业务 | ✓ 合理 |

**评估**: 认证是特殊操作，保持专用命令合理。

---

### 2. CRUD 模块 (crud) - 7 命令 × 127 资源 = 889 操作

| 命令 | 功能 | 类型 | 问题 |
|------|------|------|------|
| `crud list <resource>` | 列出资源 | CRUD | ✓ 合理 |
| `crud get <resource> <id>` | 获取单个 | CRUD | ✓ 合理 |
| `crud create <resource>` | 创建资源 | CRUD | ✓ 合理 |
| `crud update <resource> <id>` | 更新资源 | CRUD | ✓ 合理 |
| `crud delete <resource> <id>` | 删除资源 | CRUD | ✓ 合理 |
| `crud action <resource> <id> <action>` | 执行特殊操作 | CRUD+ | ✓ 合理 |
| `crud list-types` | 查看所有资源类型 | 元数据 | ✓ 合理 |

**127 种资源类型** (从 `resources.ts` 提取):

**会计** (20): accounts, journal-entries, ledger, trial-balance, balance-sheets, income-statements, cash-flows, account-balances, period-closings, opening-balances, bank-statements, reconciliation-matches, fiscal-years, accounting-periods, budget-plans, budget-executions, cost-centers, dimension-values, auxiliary-items, voucher-templates

**税务** (15): tax-calculations, tax-filings, tax-payments, vat-returns, income-tax-returns, individual-tax-withholdings, tax-calendars, tax-rates, tax-preferences, tax-adjustments, business-vat-invoices, vat-invoice-requests, invoice-items, labor-fee-payments, salary-individual-taxes

**人事** (12): employees, departments, positions, contracts, attendances, leaves, payrolls, payroll-items, social-insurances, housing-funds, employee-benefits, performance-reviews

**费用** (10): expense-reports, expense-items, expense-categories, payment-requests, payment-approvals, reimbursements, advance-payments, expense-budgets, cost-allocations, travel-expenses

**法务** (15): legal-contracts, contract-reviews, contract-templates, legal-reminders, legal-risks, demand-letters, legal-clauses, contract-amendments, contract-terminations, legal-consultations, compliance-checks, legal-documents, legal-cases, legal-entities, legal-deadlines

**AI 相关** (8): ai-bookkeeping-records, ai-learning-feedback, prompt-templates, prompt-versions, ai-audit-logs, compliance-questions, compliance-answers, ai-suggestions

**系统** (20): users, workspaces, workspace-members, roles, permissions, api-keys, audit-logs, notifications, notification-settings, file-uploads, help-articles, help-categories, user-feedback, system-settings, subscription-plans, subscription-invoices, usage-records, feature-flags, data-exports, integration-configs

**其他** (27): customers, suppliers, products, services, inventories, projects, tasks, documents, notes, tags, comments, attachments, workflows, approvals, reminders, activities, reports, dashboards, widgets, charts, kpis, goals, milestones, risks, issues, changes, versions

**评估**: CRUD 是核心统一接口，已经很好地抽象了数据操作。问题在于其他专用命令与 CRUD 重复。

---

### 3. 会计模块 (accounting) - 41 命令

**报表生成** (7 命令):
| 命令 | 功能 | 实际是否 CRUD? |
|------|------|----------------|
| `trial-balance` | 试算平衡表 | ❌ 业务逻辑（多表聚合计算） |
| `balance-sheet` | 资产负债表 | ❌ 业务逻辑（报表生成） |
| `income-statement` | 利润表 | ❌ 业务逻辑（报表生成） |
| `cash-flow` | 现金流量表 | ❌ 业务逻辑（报表生成） |
| `ledger` | 总分类账 | ❌ 业务逻辑（账簿查询） |
| `subsidiary-ledger` | 明细账 | ❌ 业务逻辑（账簿查询） |
| `voucher-summary` | 凭证汇总表 | ❌ 业务逻辑（汇总统计） |

**凭证管理** (8 命令):
| 命令 | 功能 | 实际是否 CRUD? |
|------|------|----------------|
| `create-entry` | 创建凭证 | ✅ CRUD (= `crud create journal-entries`) |
| `update-entry` | 更新凭证 | ✅ CRUD (= `crud update journal-entries`) |
| `delete-entry` | 删除凭证 | ✅ CRUD (= `crud delete journal-entries`) |
| `list-entries` | 列出凭证 | ✅ CRUD (= `crud list journal-entries`) |
| `get-entry` | 获取凭证 | ✅ CRUD (= `crud get journal-entries`) |
| `batch-entries` | 批量导入凭证 | ⚠️ 批量操作（可保留） |
| `reverse-entry` | 凭证冲红 | ⚠️ 特殊操作（可保留或改为 action） |
| `post-entry` | 凭证过账 | ⚠️ 状态变更（可改为 `crud action journal-entries post`） |

**科目管理** (5 命令):
| 命令 | 功能 | 实际是否 CRUD? |
|------|------|----------------|
| `create-account` | 创建科目 | ✅ CRUD (= `crud create accounts`) |
| `update-account` | 更新科目 | ✅ CRUD (= `crud update accounts`) |
| `delete-account` | 删除科目 | ✅ CRUD (= `crud delete accounts`) |
| `list-accounts` | 列出科目 | ✅ CRUD (= `crud list accounts`) |
| `get-account` | 获取科目 | ✅ CRUD (= `crud get accounts`) |

**银行对账** (6 命令):
| 命令 | 功能 | 实际是否 CRUD? |
|------|------|----------------|
| `import-bank-statement` | 导入银行流水 | ⚠️ 批量操作 + 解析 |
| `match-transactions` | 自动匹配 | ❌ 业务逻辑（匹配算法） |
| `manual-match` | 手动匹配 | ✅ CRUD (= `crud create reconciliation-matches`) |
| `unmatch-transaction` | 取消匹配 | ✅ CRUD (= `crud delete reconciliation-matches`) |
| `reconciliation-report` | 对账报告 | ❌ 业务逻辑（报表生成） |
| `balance-check` | 余额核对 | ❌ 业务逻辑（余额计算） |

**期末处理** (5 命令):
| 命令 | 功能 | 实际是否 CRUD? |
|------|------|----------------|
| `period-close` | 期末结转 | ❌ 业务逻辑（结转损益 + 生成凭证） |
| `depreciation` | 计提折旧 | ❌ 业务逻辑（折旧计算 + 生成凭证） |
| `amortization` | 摊销费用 | ❌ 业务逻辑（摊销计算 + 生成凭证） |
| `accrual` | 计提费用 | ❌ 业务逻辑（计提计算 + 生成凭证） |
| `carry-forward` | 结转损益 | ❌ 业务逻辑（结转计算 + 生成凭证） |

**预算与成本** (5 命令):
| 命令 | 功能 | 实际是否 CRUD? |
|------|------|----------------|
| `create-budget` | 创建预算 | ✅ CRUD (= `crud create budget-plans`) |
| `budget-execution` | 预算执行分析 | ❌ 业务逻辑（预算 vs 实际） |
| `cost-allocation` | 成本分摊 | ❌ 业务逻辑（分摊算法） |
| `variance-analysis` | 差异分析 | ❌ 业务逻辑（差异计算） |
| `budget-adjustment` | 预算调整 | ✅ CRUD (= `crud update budget-plans`) |

**其他** (5 命令):
| 命令 | 功能 | 实际是否 CRUD? |
|------|------|----------------|
| `opening-balance` | 设置期初余额 | ✅ CRUD (= `crud create opening-balances`) |
| `fiscal-year-setup` | 设置会计年度 | ✅ CRUD (= `crud create fiscal-years`) |
| `dimension-setup` | 设置辅助核算 | ✅ CRUD (= `crud create dimension-values`) |
| `voucher-template` | 凭证模板 | ✅ CRUD (= `crud list voucher-templates`) |
| `batch-approve` | 批量审批凭证 | ⚠️ 批量操作 |

**评估**:
- **15/41 (37%)** 是纯 CRUD，完全可以用 `crud` 命令替代
- **13/41 (32%)** 是真正的业务逻辑（报表、计算），应保留专用命令
- **13/41 (32%)** 是特殊操作（批量、匹配），可考虑改为 `crud action` 或保留

---

### 4. 税务模块 (tax) - 13 命令

| 命令 | 功能 | 实际是否 CRUD? |
|------|------|----------------|
| `calculate-vat` | 计算增值税 | ❌ 业务逻辑（税额计算） |
| `vat-return` | 增值税申报表 | ❌ 业务逻辑（报表生成） |
| `income-tax` | 所得税计算 | ❌ 业务逻辑（税额计算） |
| `annual-settlement` | 汇算清缴 | ❌ 业务逻辑（年度汇算） |
| `salary-tax` | 工资个税计算 | ❌ 业务逻辑（个税计算） |
| `labor-fee-tax` | 劳务费个税 | ❌ 业务逻辑（个税计算） |
| `tax-calendar` | 纳税日历 | ✅ CRUD (= `crud list tax-calendars`) |
| `tax-filing` | 税务申报 | ✅ CRUD (= `crud create tax-filings`) |
| `tax-payment` | 税款缴纳记录 | ✅ CRUD (= `crud create tax-payments`) |
| `tax-rate-query` | 查询税率 | ✅ CRUD (= `crud list tax-rates`) |
| `tax-preference` | 税收优惠 | ✅ CRUD (= `crud list tax-preferences`) |
| `tax-adjustment` | 纳税调整 | ✅ CRUD (= `crud create tax-adjustments`) |
| `withholding-report` | 代扣代缴报告 | ❌ 业务逻辑（报表生成） |

**评估**:
- **6/13 (46%)** 是纯 CRUD
- **7/13 (54%)** 是真正的业务逻辑（税额计算、报表），应保留

---

### 5. 发票模块 (invoice) - 10 命令

| 命令 | 功能 | 实际功能 | 实际是否 CRUD? |
|------|------|---------|----------------|
| `import-xml` | 导入增值税发票 XML | 解析 XML → 存入 `business-vat-invoices` | ⚠️ 批量导入 + 解析 |
| `import-batch` | 批量导入发票 | 批量导入发票数据 | ⚠️ 批量导入 |
| `verify` | 验证发票真伪 | 调用税局 API 验证 | ❌ 业务逻辑（外部 API） |
| `list` | 列出发票 | 列出发票记录 | ✅ CRUD (= `crud list business-vat-invoices`) |
| `get` | 获取发票详情 | 获取单个发票 | ✅ CRUD (= `crud get business-vat-invoices`) |
| `create-entry` | **从发票生成凭证** | 基于发票创建记账凭证 | ❌ 业务逻辑（发票 → 凭证转换） |
| `batch-create-entries` | **批量生成凭证** | 批量从发票生成凭证 | ❌ 业务逻辑（批量转换） |
| `reverse` | 冲红发票 | 创建红字发票 | ⚠️ 特殊操作（可改为 action） |
| `statistics` | 发票统计 | 发票金额/数量统计 | ❌ 业务逻辑（聚合统计） |
| `request-invoice` | 申请开票 | 创建开票申请 | ✅ CRUD (= `crud create vat-invoice-requests`) |

**重要发现**:
- ❌ **没有 `create` 命令** - 因为发票不是我们创建的，是从税控系统导入或扫描的
- ❌ **`create-entry` 不是创建发票** - 是从已有发票生成会计凭证
- ✅ 命令语义清晰，符合实际业务流程

**评估**:
- **3/10 (30%)** 是纯 CRUD
- **3/10 (30%)** 是业务逻辑（验证、生成凭证、统计）
- **4/10 (40%)** 是特殊操作（导入、解析、冲红）

---

### 6. AI 记账模块 (ai-bookkeeping) - 4 命令

| 命令 | 功能 | 实际是否 AI? |
|------|------|-------------|
| `scan` | 智能扫描记账 | ✅ AI（NLP 解析 + 科目推荐） |
| `ocr` | OCR 识别票据 | ✅ AI（OCR + 信息提取） |
| `learn` | 用户反馈学习 | ✅ AI（学习系统更新） |
| `suggest` | 智能建议 | ✅ AI（基于历史推荐） |

**评估**: 这是真正需要 AI 的模块，4/4 命令都合理。

---

### 7. 人事模块 (hr) - 10 命令

| 命令 | 功能 | 实际是否 CRUD? |
|------|------|----------------|
| `list-employees` | 列出员工 | ✅ CRUD (= `crud list employees`) |
| `get-employee` | 获取员工 | ✅ CRUD (= `crud get employees`) |
| `create-employee` | 创建员工 | ✅ CRUD (= `crud create employees`) |
| `update-employee` | 更新员工 | ✅ CRUD (= `crud update employees`) |
| `delete-employee` | 删除员工 | ✅ CRUD (= `crud delete employees`) |
| `payroll-calculate` | 计算工资 | ❌ 业务逻辑（薪资计算） |
| `payroll-generate` | 生成工资表 | ❌ 业务逻辑（工资表生成） |
| `contract-create` | 创建合同 | ✅ CRUD (= `crud create contracts`) |
| `contract-renew` | 续签合同 | ⚠️ 特殊操作（可改为 action） |
| `contract-terminate` | 终止合同 | ⚠️ 特殊操作（可改为 action） |

**评估**:
- **6/10 (60%)** 是纯 CRUD
- **2/10 (20%)** 是业务逻辑（薪资计算）
- **2/10 (20%)** 是特殊操作（续签、终止）

---

### 8. 法务模块 (legal) - 13 命令

| 命令 | 功能 | 实际是否 CRUD/AI? |
|------|------|------------------|
| `contract-review` | 合同审查 | ✅ AI（NLP 风险识别） |
| `risk-score` | 风险评分 | ✅ AI（风险打分模型） |
| `generate-demand-letter` | 生成催款函 | ✅ AI（文本生成） |
| `clause-compare` | 条款对比 | ✅ AI（文本对比） |
| `list-contracts` | 列出合同 | ✅ CRUD (= `crud list legal-contracts`) |
| `get-contract` | 获取合同 | ✅ CRUD (= `crud get legal-contracts`) |
| `create-contract` | 创建合同 | ✅ CRUD (= `crud create legal-contracts`) |
| `update-contract` | 更新合同 | ✅ CRUD (= `crud update legal-contracts`) |
| `delete-contract` | 删除合同 | ✅ CRUD (= `crud delete legal-contracts`) |
| `reminder-setup` | 设置提醒 | ✅ CRUD (= `crud create legal-reminders`) |
| `compliance-check` | 合规检查 | ✅ AI（合规规则引擎） |
| `template-list` | 列出模板 | ✅ CRUD (= `crud list contract-templates`) |
| `template-apply` | 应用模板 | ❌ 业务逻辑（模板填充） |

**评估**:
- **6/13 (46%)** 是纯 CRUD
- **5/13 (38%)** 是 AI 操作（审查、评分、生成）
- **2/13 (15%)** 是业务逻辑（模板填充、合规检查）

---

### 9. 其他模块

**工作区管理** (workspace) - 5 命令:
- `list`, `get`, `create`, `update`, `delete` - 全部是 CRUD

**用户管理** (users) - 5 命令:
- `list`, `get`, `create`, `update`, `delete` - 全部是 CRUD

**文件管理** (files) - 3 命令:
- `upload`, `download`, `delete` - 文件操作（非标准 CRUD）

**数据导入导出** (import-export) - 2 命令:
- `import`, `export` - 批量操作

**工具命令** (setup, doctor, health, info) - 4 命令:
- 系统安装和诊断，保持原样

---

## 📊 统计分析

### 命令分类统计

| 类别 | 命令数 | 占比 | 示例 |
|------|--------|------|------|
| **纯 CRUD** | 67 | 43% | `crud list accounts`, `create-employee`, `list-contracts` |
| **业务逻辑** | 45 | 29% | `trial-balance`, `calculate-vat`, `payroll-calculate` |
| **AI 操作** | 14 | 9% | `ai-bookkeeping scan`, `contract-review`, `risk-score` |
| **批量/特殊操作** | 24 | 15% | `batch-entries`, `import-xml`, `contract-renew` |
| **系统工具** | 5 | 3% | `setup`, `doctor`, `health` |
| **认证** | 3 | 2% | `auth login`, `auth whoami` |
| **总计** | 158 | 100% | |

### 关键发现

1. **43% 的命令是纯 CRUD** - 完全可以用 `crud` 命令替代
2. **29% 是真正的业务逻辑** - 应保留专用命令（报表、计算、匹配）
3. **9% 是 AI 操作** - 需要 LLM 推理，应保留
4. **15% 是批量/特殊操作** - 可考虑改为 `crud action` 或保留便捷命令

---

## 🔧 问题诊断

### 问题 1: 命令语义不准确

**案例**: `invoice create-entry`

- **问题**: 名称暗示"创建发票的凭证"，但实际是"从已有发票生成会计凭证"
- **误导性**: 用户可能以为这是创建发票的命令
- **建议**: 
  - 重命名为 `invoice to-journal-entry` 或 `invoice generate-voucher`
  - 或移到 accounting 模块: `accounting entry-from-invoice`

### 问题 2: 大量 CRUD 命令重复

**案例**: 员工管理

```bash
# 现在有两种方式做同一件事
ssos hr list-employees
ssos crud list employees

ssos hr create-employee
ssos crud create employees
```

- **问题**: 用户困惑，不知道用哪个
- **冗余**: 两套命令维护成本高
- **建议**: 只保留 `crud` 命令，移除 `hr list-employees` 等

### 问题 3: 专用模块命令与 CRUD 边界不清

**案例**: 会计科目管理

```bash
# 这些都是纯 CRUD，为什么要专用命令？
ssos accounting create-account   # = crud create accounts
ssos accounting list-accounts    # = crud list accounts
ssos accounting update-account   # = crud update accounts
```

- **问题**: 增加记忆负担，没有业务价值
- **建议**: 移除专用命令，统一用 `crud`

### 问题 4: 批量操作命令不统一

**案例**: 批量导入

```bash
ssos accounting batch-entries <file>
ssos invoice import-xml <file>
ssos invoice import-batch <file>
```

- **问题**: 每个模块都有自己的批量命令，不一致
- **建议**: 统一为 `ssos crud batch-import <resource> <file>`

---

## 🎯 抽象方案

### 方案概述

**三层命令架构**:

1. **CRUD 层** - 统一数据操作 (90% 场景)
2. **业务层** - 复杂计算和报表 (8% 场景)
3. **AI 层** - 智能分析和生成 (2% 场景)

### 层级 1: CRUD 层（统一数据操作）

**命令格式**:
```bash
ssos crud <action> <resource> [id] [options]
```

**支持的 action**:
- `list` - 列出资源
- `get` - 获取单个资源
- `create` - 创建资源
- `update` - 更新资源
- `delete` - 删除资源
- `action` - 执行资源特定操作（post, approve, submit, reverse, etc.）

**示例**:
```bash
# 员工管理
ssos crud list employees --workspace-id=abc123
ssos crud create employees '{"name":"张三","email":"zhang@example.com"}'
ssos crud update employees emp_001 '{"position":"经理"}'

# 凭证管理
ssos crud list journal-entries --month=2024-06
ssos crud get journal-entries je_001
ssos crud action journal-entries je_001 post          # 过账
ssos crud action journal-entries je_001 approve       # 审批

# 发票管理
ssos crud list business-vat-invoices --type=input
ssos crud action business-vat-invoices inv_001 reverse  # 冲红
```

**优势**:
- 统一接口，易学易记
- 支持 127 种资源类型
- 自动发现（`ssos crud list-types`）
- 支持特殊操作（通过 `action` 子命令）

---

### 层级 2: 业务层（复杂计算和报表）

**保留的专用命令** (共 29 个):

**会计 (13 个)**:
```bash
ssos accounting trial-balance         # 试算平衡表
ssos accounting balance-sheet         # 资产负债表
ssos accounting income-statement      # 利润表
ssos accounting cash-flow             # 现金流量表
ssos accounting ledger                # 总账
ssos accounting subsidiary-ledger     # 明细账
ssos accounting period-close          # 期末结转
ssos accounting depreciation          # 计提折旧
ssos accounting match-transactions    # 银行对账匹配
ssos accounting reconciliation-report # 对账报告
ssos accounting cost-allocation       # 成本分摊
ssos accounting variance-analysis     # 差异分析
ssos accounting voucher-summary       # 凭证汇总
```

**税务 (7 个)**:
```bash
ssos tax calculate-vat                # 计算增值税
ssos tax vat-return                   # 增值税申报表
ssos tax income-tax                   # 所得税计算
ssos tax annual-settlement            # 汇算清缴
ssos tax salary-tax                   # 工资个税计算
ssos tax labor-fee-tax                # 劳务费个税
ssos tax withholding-report           # 代扣代缴报告
```

**发票 (3 个)**:
```bash
ssos invoice verify <code>            # 验证发票真伪（外部 API）
ssos invoice to-journal-entry <id>    # 从发票生成凭证（重命名）
ssos invoice batch-to-entries         # 批量生成凭证（重命名）
```

**人事 (2 个)**:
```bash
ssos hr payroll-calculate             # 计算工资
ssos hr payroll-generate              # 生成工资表
```

**法务 (1 个)**:
```bash
ssos legal template-apply <id>        # 应用合同模板
```

**批量操作 (3 个)**:
```bash
ssos batch import <resource> <file>   # 统一批量导入
ssos batch export <resource> [query]  # 统一批量导出
ssos batch approve <resource> <ids>   # 批量审批
```

**原因**: 这些命令涉及多表查询、复杂计算、外部 API 调用，不适合用 CRUD 抽象。

---

### 层级 3: AI 层（智能分析和生成）

**AI 记账** (4 个):
```bash
ssos ai bookkeeping scan "购买办公用品500元"  # 自然语言记账
ssos ai bookkeeping ocr <image>              # OCR 识别票据
ssos ai bookkeeping learn <id> <feedback>    # 用户反馈学习
ssos ai bookkeeping suggest <context>        # 智能建议
```

**AI 法务** (5 个):
```bash
ssos ai legal review <file>                  # 合同审查
ssos ai legal risk-score <id>                # 风险评分
ssos ai legal generate-demand-letter <id>    # 生成催款函
ssos ai legal clause-compare <id1> <id2>     # 条款对比
ssos ai legal compliance-check <id>          # 合规检查
```

**AI 合规问答** (1 个):
```bash
ssos ai compliance ask "小规模纳税人如何转一般纳税人？"
```

**原因**: 这些命令需要 LLM 推理、NLP 解析、文本生成，是真正的 AI 操作。

---

## 📐 重构前后对比

### Before (158 命令)

```bash
# 员工管理 - 5 个专用命令
ssos hr list-employees
ssos hr get-employee emp_001
ssos hr create-employee '{"name":"张三"}'
ssos hr update-employee emp_001 '{"position":"经理"}'
ssos hr delete-employee emp_001

# 凭证管理 - 8 个专用命令
ssos accounting list-entries
ssos accounting get-entry je_001
ssos accounting create-entry '{...}'
ssos accounting update-entry je_001 '{...}'
ssos accounting delete-entry je_001
ssos accounting batch-entries <file>
ssos accounting reverse-entry je_001
ssos accounting post-entry je_001

# 科目管理 - 5 个专用命令
ssos accounting list-accounts
ssos accounting create-account '{...}'
# ... 等等
```

### After (51 命令)

```bash
# 所有数据操作 - 统一 CRUD (1 个命令模式 × 127 资源)
ssos crud list employees
ssos crud get employees emp_001
ssos crud create employees '{"name":"张三"}'
ssos crud update employees emp_001 '{"position":"经理"}'
ssos crud delete employees emp_001

ssos crud list journal-entries
ssos crud get journal-entries je_001
ssos crud action journal-entries je_001 post      # 过账
ssos crud action journal-entries je_001 reverse   # 冲红

# 业务逻辑 - 29 个专用命令
ssos accounting trial-balance
ssos tax calculate-vat
ssos invoice to-journal-entry inv_001

# AI 操作 - 10 个专用命令
ssos ai bookkeeping scan "购买办公用品500元"
ssos ai legal review contract.pdf

# 系统工具 - 8 个命令
ssos auth login
ssos setup
ssos doctor
```

**命令数量**: 158 → 51 (减少 67%)  
**记忆负担**: 大幅降低（只需记住 `crud` + 业务命令 + AI 命令）

---

## 🚀 实施计划

### Phase 1: 清理冗余 CRUD 命令 (Week 1)

**目标**: 移除所有可以用 `crud` 替代的专用命令

**操作**:
1. 移除 `hr` 模块中的 CRUD 命令 (5 个)
2. 移除 `accounting` 模块中的 CRUD 命令 (15 个)
3. 移除 `legal` 模块中的 CRUD 命令 (6 个)
4. 移除 `tax` 模块中的 CRUD 命令 (6 个)
5. 移除 `invoice` 模块中的 CRUD 命令 (3 个)
6. 移除 `workspace` 和 `users` 模块的专用命令 (10 个)

**影响**: 
- 删除 45 个命令
- 更新文档和帮助信息
- 保持向后兼容（可添加 deprecated 警告）

---

### Phase 2: 重命名误导性命令 (Week 1)

**目标**: 修正语义不准确的命令名称

**操作**:
```bash
# Before → After
invoice create-entry       → invoice to-journal-entry
invoice batch-create-entries → invoice batch-to-entries
accounting reverse-entry   → crud action journal-entries reverse
accounting post-entry      → crud action journal-entries post
```

**影响**: 
- 修改 4 个命令名称
- 更新所有文档和示例
- 保留旧命令作为 alias（添加 deprecated 警告）

---

### Phase 3: 统一批量操作 (Week 2)

**目标**: 创建统一的批量操作命令

**新增命令**:
```bash
ssos batch import <resource> <file>    # 替代各模块的 import/batch 命令
ssos batch export <resource> [query]   # 统一导出接口
ssos batch approve <resource> <ids>    # 批量审批
```

**迁移**:
```bash
# Before → After
accounting batch-entries    → batch import journal-entries
invoice import-xml          → batch import business-vat-invoices --format=xml
invoice import-batch        → batch import business-vat-invoices
```

**影响**: 
- 新增 3 个命令
- 移除 10+ 个分散的批量命令
- 统一批量操作接口

---

### Phase 4: 优化 AI 命令组织 (Week 2)

**目标**: 将 AI 命令统一到 `ai` 命令下

**重组**:
```bash
# Before
ssos ai-bookkeeping scan
ssos legal contract-review
ssos legal risk-score
ssos legal generate-demand-letter

# After
ssos ai bookkeeping scan
ssos ai legal review
ssos ai legal risk-score
ssos ai legal generate-demand-letter
ssos ai compliance ask
```

**影响**: 
- 移除 `ai-bookkeeping` 模块，合并到 `ai bookkeeping`
- 将法务 AI 命令移到 `ai legal`
- 更清晰的 AI 功能边界

---

### Phase 5: 文档更新 (Week 3)

**目标**: 更新所有文档和示例

**更新内容**:
1. README.md - 完整命令参考
2. ARCHITECTURE.md - 三层架构说明
3. CLI help 信息 - 简化输出，突出核心命令
4. MCP 服务器 instructions - 对齐命令变更
5. Skills 文件 - 更新命令示例
6. 官方文档 - 迁移指南

---

## 📋 迁移清单

### 移除的命令 (67 个)

**HR 模块** (5):
- `hr list-employees` → `crud list employees`
- `hr get-employee` → `crud get employees`
- `hr create-employee` → `crud create employees`
- `hr update-employee` → `crud update employees`
- `hr delete-employee` → `crud delete employees`

**Accounting 模块** (15):
- `accounting create-entry` → `crud create journal-entries`
- `accounting update-entry` → `crud update journal-entries`
- `accounting delete-entry` → `crud delete journal-entries`
- `accounting list-entries` → `crud list journal-entries`
- `accounting get-entry` → `crud get journal-entries`
- `accounting create-account` → `crud create accounts`
- `accounting update-account` → `crud update accounts`
- `accounting delete-account` → `crud delete accounts`
- `accounting list-accounts` → `crud list accounts`
- `accounting get-account` → `crud get accounts`
- `accounting create-budget` → `crud create budget-plans`
- `accounting budget-adjustment` → `crud update budget-plans`
- `accounting opening-balance` → `crud create opening-balances`
- `accounting fiscal-year-setup` → `crud create fiscal-years`
- `accounting dimension-setup` → `crud create dimension-values`

**Tax 模块** (6):
- `tax tax-calendar` → `crud list tax-calendars`
- `tax tax-filing` → `crud create tax-filings`
- `tax tax-payment` → `crud create tax-payments`
- `tax tax-rate-query` → `crud list tax-rates`
- `tax tax-preference` → `crud list tax-preferences`
- `tax tax-adjustment` → `crud create tax-adjustments`

**Invoice 模块** (3):
- `invoice list` → `crud list business-vat-invoices`
- `invoice get` → `crud get business-vat-invoices`
- `invoice request-invoice` → `crud create vat-invoice-requests`

**Legal 模块** (6):
- `legal list-contracts` → `crud list legal-contracts`
- `legal get-contract` → `crud get legal-contracts`
- `legal create-contract` → `crud create legal-contracts`
- `legal update-contract` → `crud update legal-contracts`
- `legal delete-contract` → `crud delete legal-contracts`
- `legal reminder-setup` → `crud create legal-reminders`

**Workspace & Users 模块** (10):
- `workspace list` → `crud list workspaces`
- `workspace get` → `crud get workspaces`
- `workspace create` → `crud create workspaces`
- `workspace update` → `crud update workspaces`
- `workspace delete` → `crud delete workspaces`
- `users list` → `crud list users`
- `users get` → `crud get users`
- `users create` → `crud create users`
- `users update` → `crud update users`
- `users delete` → `crud delete users`

**其他 CRUD** (22):
- 各个模块中剩余的纯 CRUD 命令

---

### 保留的命令 (51 个)

**认证** (3):
- `auth login`
- `auth api-key`
- `auth whoami`

**CRUD** (7 actions × 127 resources):
- `crud list <resource>`
- `crud get <resource> <id>`
- `crud create <resource>`
- `crud update <resource> <id>`
- `crud delete <resource> <id>`
- `crud action <resource> <id> <action>`
- `crud list-types`

**会计业务** (13):
- `accounting trial-balance`
- `accounting balance-sheet`
- `accounting income-statement`
- `accounting cash-flow`
- `accounting ledger`
- `accounting subsidiary-ledger`
- `accounting period-close`
- `accounting depreciation`
- `accounting match-transactions`
- `accounting reconciliation-report`
- `accounting cost-allocation`
- `accounting variance-analysis`
- `accounting voucher-summary`

**税务业务** (7):
- `tax calculate-vat`
- `tax vat-return`
- `tax income-tax`
- `tax annual-settlement`
- `tax salary-tax`
- `tax labor-fee-tax`
- `tax withholding-report`

**发票业务** (3):
- `invoice verify`
- `invoice to-journal-entry` (重命名)
- `invoice batch-to-entries` (重命名)

**人事业务** (2):
- `hr payroll-calculate`
- `hr payroll-generate`

**法务业务** (1):
- `legal template-apply`

**批量操作** (3):
- `batch import`
- `batch export`
- `batch approve`

**AI 记账** (4):
- `ai bookkeeping scan`
- `ai bookkeeping ocr`
- `ai bookkeeping learn`
- `ai bookkeeping suggest`

**AI 法务** (5):
- `ai legal review`
- `ai legal risk-score`
- `ai legal generate-demand-letter`
- `ai legal clause-compare`
- `ai legal compliance-check`

**AI 合规** (1):
- `ai compliance ask`

**系统工具** (5):
- `setup`
- `doctor`
- `health`
- `info`
- `files upload/download/delete`

---

## 🎓 用户迁移指南

### 快速参考

**查找资源类型**:
```bash
ssos crud list-types                    # 查看所有 127 种资源
ssos crud list-types | grep invoice     # 搜索发票相关资源
```

**常见操作映射**:
```bash
# 员工管理
ssos hr list-employees                  → ssos crud list employees
ssos hr create-employee '{...}'         → ssos crud create employees '{...}'

# 凭证管理
ssos accounting list-entries            → ssos crud list journal-entries
ssos accounting post-entry <id>         → ssos crud action journal-entries <id> post
ssos accounting reverse-entry <id>      → ssos crud action journal-entries <id> reverse

# 合同管理
ssos legal list-contracts               → ssos crud list legal-contracts
ssos legal create-contract '{...}'      → ssos crud create legal-contracts '{...}'
```

**特殊操作 (actions)**:
```bash
# 查看资源支持的 actions
ssos crud get journal-entries <id>      # 响应中会包含 available_actions

# 常见 actions
ssos crud action journal-entries <id> post      # 过账
ssos crud action journal-entries <id> approve   # 审批
ssos crud action journal-entries <id> reverse   # 冲红
ssos crud action journal-entries <id> submit-review  # 提交审核
```

---

## 🔮 未来优化

### 1. 交互式模式

```bash
ssos interactive
# 进入交互式 shell，支持自动补全和命令建议
```

### 2. 自然语言接口

```bash
ssos ask "列出本月的所有记账凭证"
# AI 解析 → ssos crud list journal-entries --month=2024-06
```

### 3. 管道操作

```bash
ssos crud list journal-entries --month=2024-06 | \
  ssos crud action - batch-approve
# 批量审批本月凭证
```

### 4. 配置文件支持

```yaml
# ~/.ssos/config.yml
default_workspace: workspace_001
default_format: table
aliases:
  je: journal-entries
  inv: business-vat-invoices
```

---


## 📊 总结

### 核心问题
1. **命令过多** - 158 个命令，67% 是冗余的 CRUD
2. **语义不清** - 部分命令名称误导用户
3. **不一致** - 同一操作有多种命令方式
4. **难发现** - 用户不知道有哪些功能

### 解决方案
1. **统一 CRUD** - 90% 操作通过 `crud` 命令完成
2. **保留业务逻辑** - 29 个真正需要的专用命令
3. **明确 AI 边界** - 10 个 AI 命令，清晰标识
4. **三层架构** - CRUD / 业务 / AI，职责清晰

### 实施效果
- **命令数**: 158 → 51 (减少 67%)
- **记忆负担**: 大幅降低
- **一致性**: 所有 CRUD 操作统一接口
- **可扩展性**: 新增资源无需新增命令

### 下一步
1. **Week 1**: 清理冗余 CRUD 命令 + 重命名误导性命令
2. **Week 2**: 统一批量操作 + 重组 AI 命令
3. **Week 3**: 文档更新 + 迁移指南
4. **Week 4**: 发布 v2.0.0，包含向后兼容层（deprecated 警告）

---

## 🔗 附录

### 完整资源类型列表 (127 种)

详见 `mcp-suite/packages/shared/src/resources.ts`

**分类**:
- 会计类: 20 种
- 税务类: 15 种
- 人事类: 12 种
- 费用类: 10 种
- 法务类: 15 种
- AI 类: 8 种
- 系统类: 20 种
- 其他: 27 种

### 命令复杂度对比

| 方案 | 命令数 | 学习成本 | 一致性 | 可扩展性 |
|------|--------|---------|--------|---------|
| **现状** (v1.0) | 158 | 高 | 低 | 低 |
| **优化后** (v2.0) | 51 | 低 | 高 | 高 |

### 参考资源

- [MCP Protocol](https://modelcontextprotocol.io)
- [Commander.js](https://github.com/tj/commander.js)
- [REST API 设计最佳实践](https://restfulapi.net/)

---

**文档版本**: 1.0  
**最后更新**: 2026-06-09  
**作者**: StartupOS Team
