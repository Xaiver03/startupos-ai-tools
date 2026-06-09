# SSOS MCP Suite 优化方案

**方案名称**: 财务数据处理工具扩展  
**目标**: 将 organize-finances skill 的核心能力集成到 SSOS MCP Suite  
**优先级**: P1（中期，1个月内）  
**创建时间**: 2026-06-03 22:00

---

## 📋 背景

### 当前状况

**organize-finances skill**:
- ✅ 强大的数据清洗能力（招商银行列名异常、工商银行千分位等）
- ✅ 深厚的领域知识（红字发票检测、小规模/一般纳税人处理）
- ✅ 多重匹配算法（精确、模糊、关键词、字符拆分）
- ✅ 按客户汇总对账（避免单张发票误判）
- ❌ 独立运行，无法与 SSOS 系统交互

**SSOS MCP Suite**:
- ✅ 83 个工具，覆盖财务、HR、法务、AI
- ✅ 与 SSOS 系统深度集成
- ✅ 支持 Web/App 多端访问
- ❌ 缺少复杂的数据清洗和对账能力
- ❌ 无法处理混乱的银行流水和发票数据

### 问题

用户面临的实际场景：
1. 从银行下载的流水格式各异（工行、招行、支付宝）
2. 发票 XML 文件需要解析和去重
3. 需要智能匹配发票和银行流水
4. 个人垫付的发票需要识别和处理

**现有 MCP 工具的局限**:
- `import_bank_transactions` — 只能导入已清洗的数据，无法处理原始银行流水
- `list_vat_invoices` — 只能查询已录入的发票，无法从 XML 批量导入
- 无发票对账工具
- 无银行流水统一工具

---

## 🎯 优化目标

### 短期目标（1个月）

创建新的 MCP 工具，填补当前空白：

1. **`unify_bank_statements`** — 统一银行流水格式
2. **`reconcile_invoices`** — 发票对账（多重匹配）
3. **`detect_red_invoices`** — 检测红字发票
4. **`import_invoices_from_xml`** — 从 XML 批量导入发票

### 中期目标（3个月）

创建新的 MCP 包 `@ssos/mcp-accounting-extended`：
- 包含上述 4 个新工具
- 提供数据清洗和对账能力
- 与现有 `@ssos/mcp-accounting` 配合使用

### 长期目标（6个月）

在 SSOS Web 中集成：
- "导入银行流水" 功能（上传 Excel → 自动清洗 → 导入系统）
- "发票对账" 功能（批量上传 XML → 自动对账 → 生成报告）
- "个人垫付识别" 功能（标记未匹配的发票）

---

## 🛠️ 技术方案

### 方案架构

```
organize-finances skill (v1.4.0)
  ↓ 提取核心函数
  ↓
ssos-accounting-utils 包
  ├── unifyBankStatements()
  ├── reconcileInvoices()
  ├── detectRedInvoices()
  ├── parseInvoiceXML()
  └── normalizeCompanyName()
  ↓
@ssos/mcp-accounting-extended
  ├── unify_bank_statements (MCP 工具)
  ├── reconcile_invoices (MCP 工具)
  ├── detect_red_invoices (MCP 工具)
  └── import_invoices_from_xml (MCP 工具)
  ↓
Claude Code / SSOS Backend
```

---

## 📦 新增 MCP 工具详细设计

### 1. `unify_bank_statements`

**功能**: 统一多个银行的流水格式

**输入**:
```typescript
{
  workspace_id: string;
  files: Array<{
    name: string;
    content: string; // Base64 encoded Excel
    bank: 'icbc' | 'cmb' | 'alipay';
  }>;
}
```

**输出**:
```typescript
{
  success: true;
  transactions: Array<{
    date: string;
    amount: number;
    direction: 'income' | 'expense';
    counterparty: string;
    bank: string;
    description: string;
  }>;
  summary: {
    total_count: number;
    duplicates_removed: number;
    income_count: number;
    expense_count: number;
  };
}
```

**核心逻辑**（从 skill 提取）:
```typescript
// 1. 解析 Excel（处理 header=1、千分位、列名兼容）
// 2. 统一格式（日期、金额、方向、对方名称）
// 3. 去重（按时间+金额+银行）
// 4. 排序（按时间）
```

---

### 2. `reconcile_invoices`

**功能**: 发票对账（使用多重匹配算法）

**输入**:
```typescript
{
  workspace_id: string;
  invoices: Array<{
    invoice_number: string;
    customer_name: string;
    amount: number;
    date: string;
  }>;
  bank_transactions: Array<{
    date: string;
    amount: number;
    counterparty: string;
  }>;
  match_methods?: ['exact', 'fuzzy', 'keyword', 'split'];
}
```

**输出**:
```typescript
{
  success: true;
  results: Array<{
    customer_name: string;
    invoice_count: number;
    total_amount: number;
    received_amount: number;
    unpaid_amount: number;
    status: 'paid' | 'partial' | 'unpaid';
    matched_transactions: Array<{
      date: string;
      amount: number;
      match_method: string;
    }>;
  }>;
  summary: {
    total_customers: number;
    paid_customers: number;
    partial_customers: number;
    unpaid_customers: number;
    collection_rate: number;
  };
}
```

**核心逻辑**（从 skill 提取）:
```typescript
// 1. 按客户汇总发票
// 2. 对每个客户使用 4 种匹配方式
//    - 精确匹配
//    - 模糊匹配（包含）
//    - 关键词匹配
//    - 字符拆分匹配
// 3. 计算实收金额和未收金额
// 4. 生成对账结果
```

---

### 3. `detect_red_invoices`

**功能**: 从 XML 文件中检测红字发票

**输入**:
```typescript
{
  workspace_id: string;
  xml_files: Array<{
    name: string;
    content: string; // XML content
  }>;
}
```

**输出**:
```typescript
{
  success: true;
  blue_invoices: Array<{
    invoice_number: string;
    amount: number;
    customer: string;
    date: string;
    is_reversed: boolean; // 是否被冲红
    reversed_by?: string; // 冲红发票号
  }>;
  red_invoices: Array<{
    invoice_number: string;
    amount: number; // 负数
    customer: string;
    date: string;
    original_invoice: string; // 原蓝字发票号
  }>;
  summary: {
    total_blue: number;
    total_red: number;
    net_amount: number;
    reversed_count: number;
  };
}
```

**核心逻辑**（从 skill 提取）:
```typescript
// 1. 解析 XML（使用 xml2js 或类似库）
// 2. 检查 <InIssuType><LabelCode>
//    - "Y" = 蓝字发票
//    - "N" = 红字发票
// 3. 提取金额（负数 = 红字）
// 4. 提取 <RedEInvoice><OriginalInvoiceCode>（原发票号）
// 5. 标记被冲红的蓝字发票
// 6. 计算净额
```

---

### 4. `import_invoices_from_xml`

**功能**: 从 XML 批量导入发票到 SSOS 系统

**输入**:
```typescript
{
  workspace_id: string;
  xml_files: Array<{
    name: string;
    content: string; // XML content
  }>;
  type: 'sales' | 'purchase'; // 销项或进项
  auto_create_partners?: boolean; // 自动创建客户/供应商
}
```

**输出**:
```typescript
{
  success: true;
  imported: {
    invoices: number;
    partners: number;
  };
  skipped: {
    duplicates: number;
    red_invoices: number;
  };
  errors: Array<{
    file: string;
    reason: string;
  }>;
}
```

**核心逻辑**:
```typescript
// 1. 解析所有 XML 文件
// 2. 检测重复（按发票号）
// 3. 过滤红字发票（可选）
// 4. 提取客户/供应商名称
// 5. 调用 create_partner（如果不存在）
// 6. 调用 create_vat_invoice 导入发票
// 7. 返回统计结果
```

---

## 💻 实现步骤

### Phase 1: 创建 utils 包（Week 1-2）

**目录结构**:
```
ssos-mcp-suite/
└── packages/
    └── accounting-utils/          # 新增
        ├── src/
        │   ├── bank-statements.ts    # 银行流水处理
        │   ├── invoice-reconciliation.ts  # 发票对账
        │   ├── invoice-xml-parser.ts      # XML 解析
        │   ├── red-invoice-detector.ts    # 红字发票检测
        │   ├── name-normalizer.ts         # 名称标准化
        │   └── index.ts
        ├── package.json
        └── tsconfig.json
```

**核心函数**（从 skill 提取）:

1. `unifyBankStatements(files, options)` — 统一银行流水
2. `reconcileInvoices(invoices, transactions, options)` — 发票对账
3. `detectRedInvoices(xmlFiles)` — 检测红字发票
4. `parseInvoiceXML(xmlContent)` — 解析发票 XML
5. `normalizeCompanyName(name)` — 名称标准化

---

### Phase 2: 创建 MCP 工具（Week 3）

**目录结构**:
```
ssos-mcp-suite/
└── packages/
    └── accounting-extended/       # 新增
        ├── src/
        │   ├── tools/
        │   │   ├── unify-bank-statements.ts
        │   │   ├── reconcile-invoices.ts
        │   │   ├── detect-red-invoices.ts
        │   │   └── import-invoices-from-xml.ts
        │   └── index.ts
        ├── package.json
        └── tsconfig.json
```

**依赖**:
```json
{
  "dependencies": {
    "@ssos/mcp-shared": "^1.0.0",
    "@ssos/mcp-accounting-utils": "^1.0.0",
    "@modelcontextprotocol/sdk": "^0.6.0",
    "xml2js": "^0.6.0",
    "xlsx": "^0.18.0"
  }
}
```

---

### Phase 3: 测试和文档（Week 4）

**测试场景**:
1. 统一 3 个银行的流水（工行、招行、支付宝）
2. 对账 96 张销项发票
3. 检测 105 张发票中的红字发票
4. 从 57 个 XML 导入进项发票

**文档**:
- `README.md` — 新增工具说明
- `EXAMPLES.md` — 使用示例
- 更新主 `README.md` 的工具统计（83 → 87）

---

## 📊 对比：优化前后

### 优化前（当前）

**用户工作流**:
```
1. 下载银行流水 Excel
2. 运行 organize-finances skill（离线）
3. 获得 Excel 报告
4. 手工将数据录入 SSOS
```

**问题**:
- ❌ 数据在 skill 和 SSOS 之间断层
- ❌ 需要手工导入（耗时、易错）
- ❌ 无法在 Web/App 中查看

---

### 优化后

**用户工作流 A**（通过 Claude Code）:
```
1. 下载银行流水 Excel
2. 调用 unify_bank_statements 工具
3. 调用 import_bank_transactions 导入
4. 在 SSOS Web 中查看
```

**用户工作流 B**（通过 SSOS Web）:
```
1. 在 SSOS Web 中上传银行流水
2. 后台自动调用 unify_bank_statements
3. 自动导入到系统
4. 实时查看对账结果
```

**优势**:
- ✅ 端到端自动化
- ✅ 数据存入数据库，持久化
- ✅ Web/App 实时查看
- ✅ 多用户协作

---

## 🎯 成功指标

### 技术指标
- [ ] 4 个新 MCP 工具已实现并测试通过
- [ ] utils 包测试覆盖率 ≥ 80%
- [ ] 文档完整（README + EXAMPLES）
- [ ] 与现有 83 个工具无冲突

### 用户指标
- [ ] 银行流水导入时间从 30 分钟降低到 5 分钟（降低 83%）
- [ ] 发票对账准确率 ≥ 95%（与 skill 一致）
- [ ] 用户反馈：导入流程"非常简单"或"简单"≥ 90%

---

## ⚠️ 风险和挑战

### 技术风险

**R1: XML 解析兼容性**
- 风险：不同税局的 XML 格式可能略有差异
- 缓解：广泛测试，支持多种格式

**R2: 性能问题**
- 风险：大量 XML 文件（>1000个）解析可能很慢
- 缓解：使用流式解析，分批处理

**R3: 数据质量**
- 风险：用户上传的 Excel 格式千奇百怪
- 缓解：详细的错误提示，建议标准格式

### 产品风险

**R4: 用户学习成本**
- 风险：新增 4 个工具，用户可能不知道何时使用
- 缓解：在文档中提供清晰的使用场景和流程图

**R5: 与 skill 的定位冲突**
- 风险：MCP 工具和 skill 功能重叠，用户混淆
- 缓解：明确定位
  - skill：离线批处理、生成报告、一次性任务
  - MCP：在线集成、数据导入、系统交互

---

## 📅 时间线

| 阶段 | 时间 | 交付物 |
|------|------|--------|
| **Phase 1** | Week 1-2 | `@ssos/mcp-accounting-utils` 包 |
| **Phase 2** | Week 3 | `@ssos/mcp-accounting-extended` MCP 服务器 |
| **Phase 3** | Week 4 | 测试、文档、示例 |
| **总计** | **4 周** | **4 个新工具 + 1 个 utils 包** |

---

## 🚀 快速开始（给开发者）

### 创建 utils 包

```bash
cd ssos-mcp-suite/packages
mkdir -p accounting-utils/src
cd accounting-utils

# 初始化 package.json
npm init -y
npm install typescript @types/node xlsx xml2js

# 从 organize-finances skill 提取核心函数
# 参考: ~/.claude/skills/organize-finances.md (v1.4.0)
```

### 创建 MCP 工具

```bash
cd ssos-mcp-suite/packages
mkdir -p accounting-extended/src/tools
cd accounting-extended

# 初始化
npm init -y
npm install @ssos/mcp-shared @ssos/mcp-accounting-utils @modelcontextprotocol/sdk

# 创建工具文件
touch src/tools/unify-bank-statements.ts
touch src/tools/reconcile-invoices.ts
touch src/tools/detect-red-invoices.ts
touch src/tools/import-invoices-from-xml.ts
```

### 测试

```bash
# 构建
npm run build

# 配置 MCP
# 编辑 ~/.claude/.mcp.json，添加 ssos-accounting-extended

# 测试
# 在 Claude Code 中调用新工具
```

---

## 📝 下一步行动

**立即可做**（今天）:
- [ ] 创建 `packages/accounting-utils` 目录结构
- [ ] 从 organize-finances skill 提取第一个函数（normalizeCompanyName）

**本周**:
- [ ] 提取所有核心函数到 utils 包
- [ ] 编写单元测试
- [ ] 创建 accounting-extended MCP 服务器框架

**下周**:
- [ ] 实现 4 个 MCP 工具
- [ ] 集成测试
- [ ] 编写文档和示例

---

**方案创建时间**: 2026-06-03 22:00  
**创建人**: Claude Code  
**状态**: ✅ 待评审  
**优先级**: P1（中期，1个月内）
