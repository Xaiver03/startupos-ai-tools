# SSOS MCP 功能扩展计划

## 📋 后端模块全景调研（99个API路由）

### ✅ 已实现（10个模块，28个工具）

1. **认证与账号管理** (5个工具) - `/api/auth`, `/api/api-keys`
2. **工作空间管理** (4个工具) - `/api/workspaces`
3. **财务/会计基础** (5个工具) - `/api/accounts`, `/api/journal-entries`
4. **税务管理** (4个工具) - `/api/tax-calendar`, `/api/tax-calculations`, `/api/tax-filing-forms`
5. **财务报表** (6个工具) - `/api/reports`
6. **API Key管理** (4个工具) - `/api/api-keys`

---

## 🎯 待实现功能分类（89个模块）

### 🔥 Priority 1: 核心业务功能（高频使用）

#### 1. AI智能记账 ⭐⭐⭐⭐⭐
**价值**: 最核心功能，大幅提升效率
- `/api/ai/bookkeeping` - AI自动记账
- `/api/ai/conversations` - AI对话记录
- `/api/ocr` - OCR发票识别

**工具设计**:
- `ai_bookkeeping` - 上传发票/单据，AI自动生成凭证
- `list_ai_conversations` - 查看AI记账对话
- `ocr_invoice` - OCR识别发票

**预计时间**: 30分钟

---

#### 2. 员工与薪酬管理 ⭐⭐⭐⭐⭐
**价值**: HR必备功能
- `/api/employees` - 员工档案（增删改查）
- `/api/payroll-records` - 工资记录
- `/api/labor-contracts` - 劳动合同
- `/api/labor-fee-payments` - 劳务费支付
- `/api/employee-tax-deductions` - 员工税前扣除

**工具设计**:
- `list_employees` - 列出员工
- `create_employee` - 创建员工
- `update_employee` - 更新员工信息
- `list_payroll_records` - 查询工资记录
- `create_payroll_record` - 创建工资记录
- `list_labor_contracts` - 查询劳动合同
- `create_labor_contract` - 创建劳动合同

**预计时间**: 40分钟

---

#### 3. 银行对账 ⭐⭐⭐⭐
**价值**: 财务对账核心功能
- `/api/bank-accounts` - 银行账户管理
- `/api/bank-transactions` - 银行交易导入
- `/api/reconciliation-records` - 对账记录
- `/api/reconciliation-matches` - 对账匹配

**工具设计**:
- `list_bank_accounts` - 列出银行账户
- `create_bank_account` - 创建银行账户
- `import_bank_transactions` - 导入银行交易
- `list_reconciliation_records` - 查看对账记录
- `create_reconciliation_match` - 创建对账匹配

**预计时间**: 35分钟

---

#### 4. 发票管理 ⭐⭐⭐⭐
**价值**: 进销项管理
- `/api/business-vat-invoices` - 增值税发票（进项/销项）
- `/api/orders` - 订单管理

**工具设计**:
- `list_vat_invoices` - 列出发票
- `create_vat_invoice` - 创建发票
- `get_vat_invoice` - 查询发票详情
- `list_orders` - 列出订单
- `create_order` - 创建订单

**预计时间**: 25分钟

---

#### 5. 往来单位管理 ⭐⭐⭐⭐
**价值**: 客户/供应商管理
- `/api/partners` - 往来单位（客户、供应商）

**工具设计**:
- `list_partners` - 列出往来单位
- `create_partner` - 创建往来单位
- `update_partner` - 更新往来单位
- `get_partner` - 查询往来单位详情

**预计时间**: 20分钟

---

### 📊 Priority 2: 财务进阶功能

#### 6. 会计期间管理 ⭐⭐⭐
- `/api/accounting-periods` - 会计期间
- `/api/period-end` - 期末结账
- `/api/opening-balances` - 期初余额

**工具设计**:
- `list_accounting_periods` - 列出会计期间
- `create_accounting_period` - 创建会计期间
- `close_period` - 期末结账
- `get_opening_balances` - 查询期初余额
- `set_opening_balance` - 设置期初余额

**预计时间**: 25分钟

---

#### 7. 报销管理 ⭐⭐⭐
- `/api/expense-claims` - 报销单
- `/api/expense-categories` - 报销类别

**工具设计**:
- `list_expense_claims` - 列出报销单
- `create_expense_claim` - 创建报销单
- `approve_expense_claim` - 审批报销单
- `list_expense_categories` - 列出报销类别

**预计时间**: 20分钟

---

#### 8. 组织架构 ⭐⭐⭐
- `/api/departments` - 部门管理
- `/api/projects` - 项目管理

**工具设计**:
- `list_departments` - 列出部门
- `create_department` - 创建部门
- `list_projects` - 列出项目
- `create_project` - 创建项目

**预计时间**: 20分钟

---

### 📄 Priority 3: 合同与法务

#### 9. 合同管理 ⭐⭐⭐⭐
**价值**: 法务核心功能
- `/api/contracts` - 合同档案
- `/api/contract-reviews` - AI合同审查
- `/api/contract-risk` - 合同风险分析
- `/api/contract-comparisons` - 合同对比
- `/api/contract-templates` - 合同模板
- `/api/contract-clauses` - 合同条款库
- `/api/contract-reminders` - 合同提醒

**工具设计**:
- `list_contracts` - 列出合同
- `create_contract` - 创建合同
- `review_contract` - AI审查合同
- `analyze_contract_risk` - 合同风险分析
- `compare_contracts` - 对比合同
- `list_contract_templates` - 列出合同模板

**预计时间**: 40分钟

---

#### 10. 催款与法律文书 ⭐⭐⭐
- `/api/demand-letters` - 催款函
- `/api/legal-reminders` - 法律提醒

**工具设计**:
- `create_demand_letter` - 生成催款函
- `list_demand_letters` - 列出催款函
- `list_legal_reminders` - 查看法律提醒

**预计时间**: 15分钟

---

### 🤖 Priority 4: AI与智能化

#### 11. AI配置与分析 ⭐⭐⭐
- `/api/ai-configurations` - AI配置
- `/api/ai-prompt-templates` - AI提示词模板
- `/api/ai/analytics` - AI分析

**工具设计**:
- `get_ai_config` - 获取AI配置
- `list_prompt_templates` - 列出提示词模板
- `get_ai_analytics` - 查看AI分析数据

**预计时间**: 15分钟

---

#### 12. 合规问答 ⭐⭐⭐
- `/api/compliance-qa` - 合规问答（知识库）

**工具设计**:
- `ask_compliance_question` - 提问合规问题
- `search_compliance_kb` - 搜索合规知识库

**预计时间**: 15分钟

---

### 📱 Priority 5: 其他功能

#### 13. 文档与存储 ⭐⭐
- `/api/documents` - 文档管理
- `/api/storage` - 文件存储

**工具设计**:
- `list_documents` - 列出文档
- `upload_document` - 上传文档

**预计时间**: 15分钟

---

#### 14. 通知与提醒 ⭐⭐
- `/api/notifications` - 通知
- `/api/announcements` - 公告

**工具设计**:
- `list_notifications` - 查看通知
- `mark_notification_read` - 标记已读
- `list_announcements` - 查看公告

**预计时间**: 10分钟

---

#### 15. 其他税务 ⭐⭐⭐
- `/api/tax` - 税务计算
- `/api/tax-compliance` - 税务合规
- `/api/iit-filings` - 个税申报
- `/api/tax-loss-carryforward` - 税收亏损结转
- `/api/rd-expense-deductions` - 研发费用加计扣除

**工具设计**:
- `calculate_tax` - 税务计算
- `list_iit_filings` - 查询个税申报
- `get_tax_loss_carryforward` - 查询亏损结转

**预计时间**: 25分钟

---

#### 16. 其他 ⭐
- `/api/invitations` - 邀请管理
- `/api/workspace-members` - 工作空间成员
- `/api/audit-logs` - 审计日志
- `/api/locks` - 数据锁定
- `/api/batch` - 批处理
- `/api/dashboard` - 仪表盘布局
- `/api/analytics` - 数据分析
- `/api/prefetch` - 数据预取
- `/api/my` - 个人信息

**预计时间**: 30分钟

---

## 📊 实现计划总览

| 优先级 | 模块数 | 预计工具数 | 预计时间 | 累计覆盖率 |
|--------|--------|-----------|---------|-----------|
| **已完成** | 10 | 28 | - | 10% |
| **Priority 1** | 5 | ~35 | 2.5小时 | 25% |
| **Priority 2** | 3 | ~20 | 1小时 | 35% |
| **Priority 3** | 2 | ~15 | 1小时 | 45% |
| **Priority 4** | 2 | ~10 | 0.5小时 | 50% |
| **Priority 5** | 5 | ~20 | 1.5小时 | 70% |
| **总计** | 27 | ~128 | ~6.5小时 | 70% |

---

## 🎯 推荐实施路径

### Phase A: 核心业务补齐（Priority 1）
**目标**: 覆盖日常80%高频操作
**时间**: 2.5小时
**模块**:
1. AI智能记账 ⭐⭐⭐⭐⭐
2. 员工与薪酬管理 ⭐⭐⭐⭐⭐
3. 银行对账 ⭐⭐⭐⭐
4. 发票管理 ⭐⭐⭐⭐
5. 往来单位管理 ⭐⭐⭐⭐

### Phase B: 财务进阶（Priority 2）
**目标**: 完善财务闭环
**时间**: 1小时
**模块**:
6. 会计期间管理
7. 报销管理
8. 组织架构

### Phase C: 合同法务（Priority 3）
**目标**: 法务功能完整
**时间**: 1小时
**模块**:
9. 合同管理
10. 催款与法律文书

### Phase D: 智能化增强（Priority 4 & 5）
**目标**: AI与辅助功能
**时间**: 2小时
**模块**: 其他所有模块

---

## 💡 建议

**立即开始**: Phase A - Priority 1
- 先实现 **AI智能记账**（最有价值）
- 然后实现 **员工管理**（最常用）
- 最后实现 **银行对账、发票、往来单位**

**一次性完成 Phase A 后，SSOS MCP 将覆盖日常80%的操作场景！**

---

## 📝 注意事项

1. **保持工具简洁**: 每个工具专注单一功能
2. **复用已有模式**: 延续现有工具的设计模式
3. **测试先行**: 每个模块实现后立即测试
4. **文档同步**: 及时更新 README
5. **增量提交**: 每个模块完成后提交一次

---

**要开始实施 Phase A 吗？**
