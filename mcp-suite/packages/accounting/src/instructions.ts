export const SSOS_ACCOUNTING_INSTRUCTIONS = `SSOS Accounting MCP 服务器 - 财务会计、税务、发票、银行对账

提供完整的财务会计操作工具，支持小企业会计准则和企业会计准则。

## 工具列表 (41 个)

### 会计科目 (5 个)

**listAccounts** - 列出所有会计科目
参数: filters (object, 可选) - 如 { type: 'asset', level: 1 }
返回: 科目数组（编号、名称、类型、余额方向）

**getAccount** - 获取单个科目详情
参数: accountId (string, 必填)

**createAccount** - 创建新科目
参数: code (string), name (string), type (enum), debitCredit (enum), level (number)

**updateAccount** - 更新科目信息
参数: accountId (string), data (object)

**deleteAccount** - 删除科目（需无余额且无关联凭证）
参数: accountId (string)

### 记账凭证 (8 个)

**listJournalEntries** - 列出凭证
参数: filters (object, 可选) - 如 { period: '2026-06', status: 'posted' }

**getJournalEntry** - 获取凭证详情
参数: entryId (string)

**createJournalEntry** - 创建记账凭证
参数: entryDate (date), description (string), items (array)
items 格式: [{ accountId, debit, credit, description }]

**updateJournalEntry** - 更新凭证（仅草稿状态）
参数: entryId (string), data (object)

**deleteJournalEntry** - 删除凭证（仅草稿状态）
参数: entryId (string)

**postJournalEntry** - 过账凭证（草稿 → 已过账）
参数: entryId (string)

**reverseJournalEntry** - 冲红凭证
参数: entryId (string), reverseDate (date, 可选)
返回: 新创建的红字凭证

**batchCreateJournalEntries** - 批量创建凭证
参数: entries (array)

### 财务报表 (6 个)

**getBalanceSheet** - 资产负债表
参数: date (date, 必填), accountingStandard (enum, 可选)
返回: 资产、负债、所有者权益各项目金额

**getIncomeStatement** - 利润表
参数: startDate (date), endDate (date), accountingStandard (enum, 可选)
返回: 收入、成本、费用、利润各项目金额

**getCashFlowStatement** - 现金流量表
参数: startDate (date), endDate (date)
返回: 经营、投资、筹资活动现金流

**getEquityChangesStatement** - 所有者权益变动表（企业准则）
参数: year (number)

**getTrialBalance** - 试算平衡表
参数: date (date)
返回: 各科目借贷方发生额和余额

**getGeneralLedger** - 总账
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

### 发票管理 (4 个)

**listInvoices** - 列出发票
参数: filters (object) - 如 { type: 'sales', status: 'issued' }

**createInvoice** - 开具发票
参数: type (enum), customerName (string), items (array), taxRate (number)

**getInvoice** - 获取发票详情
参数: invoiceId (string)

**reverseInvoice** - 开具红字发票（冲红）
参数: invoiceId (string), reason (string)

### 往来管理 (3 个)

**listPartners** - 列出往来单位（客户/供应商）
参数: type (enum: 'customer' | 'supplier')

**getPartnerBalance** - 获取往来单位余额
参数: partnerId (string), date (date, 可选)

**createPartner** - 创建往来单位
参数: name (string), type (enum), taxNumber (string, 可选)

## 使用场景

### 1. 日常记账
\`\`\`
1. listAccounts() // 查看科目表
2. createJournalEntry({ ... }) // 创建凭证
3. postJournalEntry(entryId) // 过账
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
2. createTaxReturn(period, 'vat', data) // 创建申报表
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
