# StartupOS AI Tools 架构设计

**版本**: 2.0  
**日期**: 2026-06-09

---

## 🎯 设计目标

1. **简洁易用** - 减少命令数量，统一操作模式
2. **语义清晰** - 命令名称准确反映功能
3. **AI Native** - 为 AI IDE 提供原生集成
4. **模块化** - CLI、MCP、Skills 独立可用

---

## 📦 三层命令架构

```
┌─────────────────────────────────────────────────────────┐
│                  StartupOS AI Tools                      │
├─────────────────┬─────────────────┬─────────────────────┤
│  CRUD 层        │  业务层          │  AI 层              │
│  统一数据操作    │  复杂计算和报表   │  智能分析和生成      │
├─────────────────┼─────────────────┼─────────────────────┤
│  • crud         │  • accounting   │  • ai-bookkeeping   │
│  • 127 资源     │  • tax          │  • OCR 识别         │
│  • 7 actions    │  • invoice      │  • 自动记账         │
│                 │  • workspace    │  • 合规问答         │
├─────────────────┼─────────────────┼─────────────────────┤
│  90% 场景       │  8% 场景        │  2% 场景            │
└─────────────────┴─────────────────┴─────────────────────┘
```

---

## 🔧 层级 1: CRUD 层（统一数据操作）

### 命令格式

```bash
ssos crud <action> <resource> [id] [options]
```

### 支持的 Actions

- `list` - 列出资源
- `get` - 获取单个资源
- `create` - 创建资源
- `update` - 更新资源
- `delete` - 删除资源
- `action` - 执行资源特定操作（post, approve, submit, reverse）
- `list-types` - 查看所有资源类型

### 127 种资源类型

详见 `mcp-suite/packages/shared/src/resources.ts`

**分类**:
- 会计类: 20 种 (accounts, journal-entries, ledger, etc.)
- 税务类: 15 种 (tax-calculations, vat-returns, etc.)
- 人事类: 12 种 (employees, payrolls, contracts, etc.)
- 费用类: 10 种 (expense-reports, reimbursements, etc.)
- 法务类: 15 种 (legal-contracts, contract-reviews, etc.)
- AI 类: 8 种 (ai-conversations, prompt-templates, etc.)
- 系统类: 20 种 (users, workspaces, api-keys, etc.)
- 其他: 27 种

### 示例

```bash
# 基础 CRUD
ssos crud list employees --workspace-id=abc123
ssos crud get employees emp_001
ssos crud create employees '{"name":"张三"}'
ssos crud update employees emp_001 '{"position":"经理"}'
ssos crud delete employees emp_001

# 特殊操作（通过 action）
ssos crud action journal-entries je_001 post      # 过账
ssos crud action journal-entries je_001 approve   # 审批
ssos crud action journal-entries je_001 reverse   # 冲红
```

---


## 💼 层级 2: 业务层（复杂计算和报表）

### Accounting 模块 (7 命令)

**报表生成** - 涉及多表查询和聚合计算

```bash
ssos accounting trial-balance        # 试算平衡表
ssos accounting balance-sheet        # 资产负债表
ssos accounting income-statement     # 利润表
ssos accounting cash-flow            # 现金流量表
ssos accounting general-ledger       # 总账
ssos accounting bank-journal         # 银行日记账
ssos accounting account-balances     # 科目余额表
```

### Tax 模块 (6 命令)

**税务计算和查询** - 涉及税法规则和复杂计算

```bash
ssos tax calendar                   # 税务日历
ssos tax calculations               # 税务计算
ssos tax compliance                 # 合规检查
ssos tax filings                    # 申报表
ssos tax rules                      # 税务规则
ssos tax loss-carryforward          # 亏损弥补
```

### Invoice 模块 (3 命令)

**发票业务逻辑** - 涉及会计凭证生成

```bash
ssos invoice reverse <id>              # 冲红发票
ssos invoice to-journal-entry <id>     # 从发票生成凭证
ssos invoice batch-to-entries --ids    # 批量生成凭证
```

**注意**: 发票数据操作使用 `crud list business-vat-invoices`

### Workspace 模块 (1 命令)

**工作区统计** - 跨表聚合查询

```bash
ssos workspace stats <id>           # 工作区统计
```

---

## 🤖 层级 3: AI 层（智能分析和生成）

### AI Bookkeeping 模块 (5 命令)

**智能记账** - 需要 LLM 推理和 NLP 解析

```bash
ssos ai-bookkeeping book --text "购买办公用品500元"  # AI 自动记账
ssos ai-bookkeeping ocr --file-url <url>           # OCR 识别票据
ssos ai-bookkeeping compliance --question "问题"    # 合规问答
ssos ai-bookkeeping conversations                  # 对话历史
ssos ai-bookkeeping file-upload --file <path>      # 上传文件
```

---

## 📊 命令统计

| 层级 | 命令数 | 占比 | 特点 |
|------|--------|------|------|
| **CRUD 层** | 7 actions × 127 resources | 90% | 统一接口，易于扩展 |
| **业务层** | 17 命令 | 8% | 复杂计算，领域专用 |
| **AI 层** | 5 命令 | 2% | 智能分析，LLM 驱动 |
| **系统工具** | 5 命令 | - | 安装、认证、健康检查 |
| **总计** | 51 核心命令 | 100% | 比 v1.0 减少 67% |

---

## 🔄 v1.0 → v2.0 变更

### 移除的命令 (67 个)

**原因**: 可以用 `crud` 命令替代

- `hr list-employees` → `crud list employees`
- `accounting list-entries` → `crud list journal-entries`
- `legal list-contracts` → `crud list legal-contracts`
- `workspace list` → `crud list workspaces`
- `users list` → `crud list users`
- ... 等 67 个纯 CRUD 命令

### 重命名的命令 (2 个)

**原因**: 语义不准确

- `invoice create-entry` → `invoice to-journal-entry`
- `invoice batch-create-entries` → `invoice batch-to-entries`

### Deprecated 命令

保留向后兼容性，显示警告：

```bash
ssos users list
# ⚠️ "users list" is deprecated. Use "ssos crud list users" instead.
```

---

## 🚀 迁移指南

### 快速参考

```bash
# 查看所有资源类型
ssos crud list-types

# 查看特定资源的 CRUD 操作
ssos crud --help

# 查看业务命令
ssos accounting --help
ssos tax --help
ssos invoice --help

# 查看 AI 命令
ssos ai-bookkeeping --help
```

### 常见操作映射

| v1.0 | v2.0 |
|------|------|
| `hr list-employees` | `crud list employees` |
| `accounting post-entry <id>` | `crud action journal-entries <id> post` |
| `invoice create-entry <id>` | `invoice to-journal-entry <id>` |
| `legal list-contracts` | `crud list legal-contracts` |

---

## 📚 相关文档

- `CLI_COMMAND_ANALYSIS.md` - 完整命令分析和抽象方案
- `README.md` - 快速开始和使用指南
- `mcp-suite/packages/shared/src/resources.ts` - 127 种资源类型定义

---

**文档版本**: 2.0  
**最后更新**: 2026-06-09  
**作者**: StartupOS Team
