# @ssos/mcp-accounting-utils

财务数据处理工具库 - 提供银行流水统一、发票对账、红字发票检测等核心功能。

## 📦 安装

```bash
npm install @ssos/mcp-accounting-utils
```

## 🚀 功能

### 1. 银行流水统一

支持工商银行、招商银行、支付宝等多种格式，自动处理：
- ✅ 列名差异（对方单位名称/对方户名）
- ✅ 千分位格式（4,000.00 → 4000.00）
- ✅ 表头跳过（招商银行 header=1）
- ✅ 自动去重（按时间+金额+银行）

```typescript
import { unifyBankStatements } from '@ssos/mcp-accounting-utils';

const result = await unifyBankStatements([
  {
    name: '工商银行_2024-03至2024-05.xlsx',
    content: buffer, // Excel Buffer
    bank: 'icbc',
  },
  {
    name: '招商银行_2025-03至2025-05.xlsx',
    content: buffer,
    bank: 'cmb',
    companyName: '晓黎创意', // 用于判断收入/支出
  },
]);

console.log(result.summary);
// {
//   totalCount: 176,
//   duplicatesRemoved: 3,
//   incomeCount: 61,
//   expenseCount: 115,
//   totalIncome: 814038.13,
//   totalExpense: 742388.45
// }
```

---

### 2. 发票对账

使用多重匹配算法（精确、模糊、关键词、拆分支付），按客户汇总对账。

```typescript
import { reconcileInvoices } from '@ssos/mcp-accounting-utils';

const invoices = [
  { invoiceNumber: '001', customerName: '芝诺未来生物科技（青岛）有限公司', amount: 100000, date: '2025-05-30' },
  { invoiceNumber: '002', customerName: '北京林业大学', amount: 5624, date: '2024-09-01' },
  // ...
];

const transactions = [
  { date: new Date('2025-05-30'), amount: 100000, counterparty: '芝诺(青岛)生物科技', direction: 'income' },
  // ...
];

const result = reconcileInvoices(invoices, transactions);

console.log(result.summary);
// {
//   totalCustomers: 22,
//   paidCustomers: 7,
//   partialCustomers: 5,
//   unpaidCustomers: 10,
//   collectionRate: 79.8
// }

// 查看每个客户的对账结果
result.results.forEach(r => {
  console.log(`${r.customerName}: ${r.status}, 已收 ${r.receivedAmount}, 欠款 ${r.unpaidAmount}`);
});
```

---

### 3. 红字发票检测

从 XML 文件中检测红字发票，标记被冲红的蓝字发票。

```typescript
import { detectRedInvoices } from '@ssos/mcp-accounting-utils';

const xmlFiles = [
  { name: 'dzfp_001.xml', content: '<Invoice>...</Invoice>' },
  { name: 'dzfp_002.xml', content: '<Invoice>...</Invoice>' },
  // ...
];

const result = await detectRedInvoices(xmlFiles);

console.log(result.summary);
// {
//   totalBlue: 733868.84,
//   totalRed: -148315.44,
//   netAmount: 585553.40,
//   reversedCount: 3
// }

// 查看被冲红的发票
result.blueInvoices
  .filter(inv => inv.isReversed)
  .forEach(inv => {
    console.log(`发票 ${inv.invoiceNumber} 已被冲红，冲红发票号：${inv.reversedBy}`);
  });
```

---

### 4. 名称标准化

处理全角/半角、括号、空格等差异。

```typescript
import { normalizeCompanyName, matchCompanyName, extractKeywords } from '@ssos/mcp-accounting-utils';

// 标准化
normalizeCompanyName('芝诺（青岛）生物科技'); // '芝诺(青岛)生物科技'
normalizeCompanyName('北京 林业 大学');      // '北京林业大学'

// 匹配
matchCompanyName('芝诺（青岛）', '芝诺(青岛)', 'exact');   // true
matchCompanyName('北京林业大学', '林业大学', 'fuzzy');     // true
matchCompanyName('清华大学深圳研究生院', '清华', 'keyword'); // true

// 提取关键词
extractKeywords('芝诺未来生物科技（青岛）有限公司');
// ['芝诺', '青岛', '生物']
```

---

## 📚 API 文档

### `unifyBankStatements(files)`

统一多个银行的流水格式。

**参数**:
- `files: BankFileInput[]` - 银行流水文件数组
  - `name: string` - 文件名
  - `content: Buffer | string` - Excel 文件内容
  - `bank: 'icbc' | 'cmb' | 'alipay'` - 银行类型
  - `companyName?: string` - 公司名称（可选）

**返回**: `Promise<UnifyBankStatementsResult>`

---

### `reconcileInvoices(invoices, transactions, matchMethods?)`

发票对账，使用多重匹配算法。

**参数**:
- `invoices: Invoice[]` - 发票列表
- `transactions: BankTransaction[]` - 银行交易列表
- `matchMethods?: MatchMethod[]` - 匹配方法（默认全部）
  - `'exact'` - 精确匹配
  - `'fuzzy'` - 模糊匹配（包含）
  - `'keyword'` - 关键词匹配
  - `'split'` - 拆分支付匹配

**返回**: `InvoiceReconciliationResult`

---

### `detectRedInvoices(xmlFiles)`

从 XML 文件中检测红字发票。

**参数**:
- `xmlFiles: Array<{ name: string, content: string }>` - XML 文件数组

**返回**: `Promise<RedInvoiceDetectionResult>`

---

### `normalizeCompanyName(name, toLowerCase?)`

标准化公司名称。

**参数**:
- `name: string` - 原始公司名称
- `toLowerCase?: boolean` - 是否转为小写（默认 false）

**返回**: `string`

---

## 🔧 开发

```bash
# 安装依赖
npm install

# 构建
npm run build

# 开发模式（监听文件变化）
npm run dev

# 运行测试
npm test
```

---

## 📊 使用场景

### 场景1: 整理混乱的银行流水

```typescript
// 用户有多个银行的流水文件，格式各异
const files = [
  { name: '工行_2024Q1.xlsx', content: icbcBuffer, bank: 'icbc' },
  { name: '工行_2024Q2.xlsx', content: icbcBuffer2, bank: 'icbc' },
  { name: '招行_2024Q1.xlsx', content: cmbBuffer, bank: 'cmb', companyName: '晓黎创意' },
];

const result = await unifyBankStatements(files);

// 得到统一格式的交易记录
result.transactions.forEach(t => {
  console.log(`${t.date.toISOString().split('T')[0]} ${t.direction} ${t.amount} ${t.counterparty}`);
});
```

### 场景2: 发票对账催款

```typescript
// 公司开了很多发票，需要知道哪些客户没付款
const invoices = await loadInvoicesFromXML(); // 从 XML 加载
const transactions = await loadBankTransactions(); // 从银行流水加载

const result = reconcileInvoices(invoices, transactions);

// 生成催款清单
const unpaidCustomers = result.results.filter(r => r.unpaidAmount > 0);
unpaidCustomers.sort((a, b) => b.unpaidAmount - a.unpaidAmount);

console.log('催款清单（按欠款金额排序）:');
unpaidCustomers.forEach(c => {
  console.log(`${c.customerName}: ¥${c.unpaidAmount.toFixed(2)}`);
});
```

### 场景3: 检测红字发票避免重复催款

```typescript
// 先检测红字发票
const xmlFiles = await loadAllXMLFiles();
const result = await detectRedInvoices(xmlFiles);

// 过滤掉被冲红的发票
const validInvoices = result.blueInvoices.filter(inv => !inv.isReversed);

// 用有效发票进行对账
const reconciliation = reconcileInvoices(
  validInvoices.map(inv => ({
    invoiceNumber: inv.invoiceNumber,
    customerName: inv.customer,
    amount: inv.amount,
    date: inv.date,
  })),
  transactions
);
```

---

## 🎯 与 organize-finances skill 的关系

本工具库从 [organize-finances skill](https://github.com/anthropics/claude-code/skills/organize-finances) (v1.4.0) 提取核心逻辑，作为可复用的 TypeScript 库。

**差异**:
- Skill: Python 实现，离线批处理，生成 Excel 报告
- Utils: TypeScript 实现，可集成到 MCP 工具和 SSOS 后端

**相同**:
- 核心算法一致（多重匹配、红字发票检测、名称标准化）
- 处理边界情况一致（千分位、列名兼容、去重逻辑）

---

## 📄 License

MIT

---

## 🔗 相关项目

- [SSOS MCP Suite](../) - 完整的 SSOS MCP 工具集（83个工具）
- [@ssos/mcp-accounting](../accounting) - 财务管理 MCP 工具（41个工具）
- [organize-finances skill](~/.claude/skills/organize-finances.md) - 财务整理 Skill (v1.4.0)

---

**版本**: 1.0.0  
**创建时间**: 2026-06-03  
**维护者**: SSOS Team
