export const SSOS_ACCOUNTING_INSTRUCTIONS = `SSOS Accounting MCP 服务器 - 财务会计、报表生成、税务计算

提供完整的财务会计操作工具，支持小企业会计准则和企业会计准则。

## 重要说明

**数据操作（CRUD）请使用 startupos-core 的 universal_* 工具**:
- 科目管理 → universal_list/get/create/update/delete("accounts", ...)
- 凭证管理 → universal_list/get/create/update/delete("journal_entries", ...)
- 发票管理 → universal_list/get/create/update/delete("business_vat_invoices", ...)
- 往来单位 → universal_list/get/create/update/delete("partners", ...)

**本服务器专注于业务逻辑**: 报表生成、税务计算、期末处理、银行对账等复杂操作。

## CLI 命令对应

如果使用 CLI（@xaiverdeng/ssos），对应命令为:
- 数据操作: ssos crud list/get/create/update/delete <resource>
- 报表生成: ssos accounting trial-balance/balance-sheet/income-statement
- 税务计算: ssos tax calendar/calculations/compliance
- 发票操作: ssos invoice to-journal-entry/batch-to-entries/reverse

## 工具列表 (业务逻辑工具)

### 财务报表 (7 个报表生成工具)

**getBalanceSheet** - 生成资产负债表
参数: date (date, 必填), accountingStandard (enum, 可选)
返回: 资产、负债、所有者权益各项目金额

**getIncomeStatement** - 生成利润表
参数: startDate (date), endDate (date), accountingStandard (enum, 可选)
返回: 收入、成本、费用、利润各项目金额

**getCashFlowStatement** - 生成现金流量表
参数: startDate (date), endDate (date)
返回: 经营、投资、筹资活动现金流

**getEquityChangesStatement** - 生成所有者权益变动表（企业准则）
参数: year (number)

**getTrialBalance** - 生成试算平衡表
参数: date (date)
返回: 各科目借贷方发生额和余额

**getGeneralLedger** - 生成总账
参数: accountId (string), startDate (date), endDate (date)

**getSubsidiaryLedger** - 生成明细账
参数: accountId (string), startDate (date), endDate (date)

### 期末处理 (4 个)

**createClosingEntries** - 生成期末结转凭证
参数: period (string, YYYY-MM 格式)
返回: 结转凭证数组（损益结转、成本结转等）

**getClosingEntries** - 查看期末结转凭证
参数: period (string)

**lockPeriod** - 锁定会计期间（不可再修改）
参数: period (string)

**unlockPeriod** - 解锁会计期间
参数: period (string)

### 税务管理 (6 个)

**calculateVAT** - 计算增值税
参数: period (string), taxpayerType (enum: 'small' | 'general')
返回: 销项税额、进项税额、应纳税额

**createTaxReturn** - 创建税务申报表
参数: period (string), taxType (enum), data (object)

**listTaxReturns** - 列出税务申报表
参数: filters (object)

**getTaxCalendar** - 获取税务日历（申报截止日期）
参数: year (number)

**calculateIncomeTax** - 计算企业所得税
参数: year (number), data (object)
返回: 应纳税所得额、应纳税额

**getTaxOptimizations** - 获取税务优化建议
参数: workspaceId (string)

### 银行对账 (5 个)

**listBankAccounts** - 列出银行账户
参数: 无

**createBankAccount** - 添加银行账户
参数: bankName (string), accountNumber (string), accountName (string)

**importBankTransactions** - 导入银行流水
参数: bankAccountId (string), transactions (array)

**createBankReconciliation** - 创建银行对账单
参数: bankAccountId (string), statementDate (date), statementBalance (number)

**matchBankTransactions** - 自动匹配银行流水与凭证
参数: reconciliationId (string)

## 使用场景

### 1. 日常记账（使用 startupos-core）
\`\`\`
1. universal_list("accounts") // 查看科目表
2. universal_create("journal_entries", { ... }) // 创建凭证
3. universal_action("journal_entries", entryId, "post") // 过账
\`\`\`

### 2. 月末结账
\`\`\`
1. getTrialBalance(date) // 检查试算平衡
2. createClosingEntries(period) // 生成结转凭证
3. lockPeriod(period) // 锁定期间
\`\`\`

### 3. 报表查询
\`\`\`
1. getBalanceSheet(date) // 资产负债表
2. getIncomeStatement(startDate, endDate) // 利润表
3. getCashFlowStatement(startDate, endDate) // 现金流量表
\`\`\`

### 4. 税务申报
\`\`\`
1. calculateVAT(period, taxpayerType) // 计算增值税
2. universal_create("tax_returns", { period, taxType: 'vat', data }) // 创建申报表
3. getTaxCalendar(year) // 查看申报截止日期
\`\`\`

## 会计准则支持

**小企业会计准则** (accountingStandard: 'small_business'):
- 损益类科目: 5xxx
- 3 张报表: 资产负债表、利润表、现金流量表

**企业会计准则** (accountingStandard: 'enterprise'):
- 损益类科目: 6xxx
- 4 张报表: 资产负债表、利润表、现金流量表、所有者权益变动表

## 注意事项

- **凭证平衡**: 借方合计必须等于贷方合计
- **期间锁定**: 锁定后的期间不可修改凭证
- **科目删除**: 仅可删除无余额且无关联凭证的科目
- **发票记账**: 开具蓝字/红字发票必须生成会计凭证（《会计法》要求）
- **税率**: 小规模纳税人 3%/1%，一般纳税人 13%/9%/6%
- **申报截止**: 增值税次月15日前，所得税次年5月31日前
`;
