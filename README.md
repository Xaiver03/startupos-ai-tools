<div align="center">

# 🚀 StartupOS AI Tools

**AI-powered CLI, MCP Servers, and Skills for StartupOS Financial Management**

[![npm version](https://img.shields.io/npm/v/@xaiverdeng/ssos.svg)](https://www.npmjs.com/package/@xaiverdeng/ssos)
[![npm downloads](https://img.shields.io/npm/dm/@xaiverdeng/ssos.svg)](https://www.npmjs.com/package/@xaiverdeng/ssos)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node version](https://img.shields.io/node/v/@xaiverdeng/ssos.svg)](https://nodejs.org)
[![GitHub stars](https://img.shields.io/github/stars/Xaiver03/startupos-ai-tools.svg)](https://github.com/Xaiver03/startupos-ai-tools/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/Xaiver03/startupos-ai-tools.svg)](https://github.com/Xaiver03/startupos-ai-tools/issues)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[English](#english) | [中文](#中文)

</div>

---

## 中文

### ✨ 特性

- 🤖 **AI Native 设计** - 无缝集成 9+ AI IDE（Claude Code, Cursor, Windsurf, Zed 等）
- ⚡ **一键安装** - 自动配置 MCP 服务器和 Claude Skills
- 🛠️ **50+ 核心命令** - 统一 CRUD + 业务逻辑 + AI 功能
- 🔧 **7 个通用工具 + 127 种资源** - 统一 CRUD 接口
- 📦 **模块化架构** - CLI、MCP Suite、Skills 独立可用

### 📊 项目统计

```
📦 包含组件
├─ CLI 工具................51 核心命令
├─ MCP 服务器..............81 工具 + 127 资源
└─ Claude Skills...........3 技能文件

🎯 三层命令架构
├─ CRUD 层.................统一数据操作（127 种资源）
├─ 业务层.................29 个专用命令（报表/计算/匹配）
└─ AI 层..................10 个 AI 命令（记账/审查/问答）

🔌 支持 AI IDE
└─ Claude Code, Cursor, Windsurf, VS Code + Cline, Zed, 
   OpenCode, Hermes, Codex, OpenClaw
```

### 🎯 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                  StartupOS AI Tools                          │
├─────────────────┬─────────────────┬─────────────────────────┤
│  CLI            │  MCP Suite      │  Skills                 │
│  命令行工具      │  MCP 服务器组    │  工作流技能              │
├─────────────────┼─────────────────┼─────────────────────────┤
│  • 服务端直接执行 │  • AI Agent 调用 │  • Claude Code 工作流   │
│  • Bash/脚本调用 │  • JSON-RPC 协议 │  • 调用 CLI 命令 ⚠️     │
│  • 数据库直连    │  • HTTP API 调用 │  • 多步骤编排           │
├─────────────────┼─────────────────┼─────────────────────────┤
│  155 命令        │  81 工具         │  3 技能文件              │
│  19 模块         │  127 资源类型    │  依赖 CLI ⚠️             │
└─────────────────┴─────────────────┴─────────────────────────┘

依赖关系:
  MCP Suite → 独立运行（不依赖 CLI）
  Skills → 依赖 CLI（必须先安装 CLI）
  CLI → 独立运行
```

### 🚀 快速开始

#### 方法 1：NPX 一键安装（推荐）

```bash
# 克隆仓库
git clone https://github.com/Xaiver03/startupos-ai-tools.git
cd startupos-ai-tools

# 一键安装所有工具（CLI + MCP + Skills）
npx @xaiverdeng/ssos setup

# 或仅安装 MCP 服务器
npx @xaiverdeng/ssos setup --mcp

# ⚠️ 注意: Skills 依赖 CLI，不能单独安装
# 如果只想要 Skills，需要先安装 CLI：
npm install -g @xaiverdeng/ssos  # 安装 CLI
npx @xaiverdeng/ssos setup --skill  # 然后安装 Skill
```

**💡 命令简洁**: 包名和命令都是 `ssos`
```bash
# 全局安装
npm install -g @xaiverdeng/ssos

# 使用命令
ssos auth login
ssos accounting trial-balance
ssos doctor
```

**重要说明**:
- **MCP 服务器**: 独立工具，AI IDE 直接调用，不依赖 CLI
- **Skills**: Claude Code 工作流，内部调用 CLI 命令，必须先安装 CLI
- **推荐**: 使用 `setup` (无参数) 安装所有组件

#### 方法 2：全局安装 CLI

```bash
npm install -g @xaiverdeng/startupos-cli

# 然后在仓库目录运行
startupos-cli setup
```

#### 方法 3：手动安装脚本

```bash
git clone https://github.com/Xaiver03/startupos-ai-tools.git
cd startupos-ai-tools
./install.sh
```

### 🔍 检查安装状态

```bash
npx @xaiverdeng/ssos doctor
```

输出示例：

```
🏥 Startup OS AI Tools Health Check
══════════════════════════════════════════════════

📦 CLI
  ✓ Version: 1.0.0
  ✓ Package: @xaiverdeng/ssos

🤖 AI IDEs
  ✓ Claude Code - configured
  ✓ Cursor - configured
  ○ Windsurf - installed (not configured)

🔧 MCP Servers
  ✓ startupos-core built
  ✓ startupos-accounting built
  ✓ startupos-hr built
  ✓ startupos-ai built
  ✓ startupos-legal built
  ✓ 5 server(s) configured in AI IDEs

🎯 Claude Skills
  ✓ Skill installed

🔐 Authentication
  ✓ API Key configured

══════════════════════════════════════════════════
✓ Health check complete
```

### 🔧 故障排除

**MCP 服务器未显示在 AI IDE 中**
```bash
# 1. 检查配置文件
cat ~/.claude.json  # Claude Code
cat ~/Library/Application\ Support/Cursor/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json  # Cursor

# 2. 重新安装
npx @xaiverdeng/ssos setup --mcp

# 3. 重启 AI IDE
```

**认证失败**
```bash
# 重新登录
ssos auth login

# 或使用 API Key
ssos auth api-key <your-key>
```

### 📚 使用指南

#### 🔐 认证命令

```bash
# 三种认证方式（可用 ssos 短命令）
ssos auth login                             # 邮箱密码登录
ssos auth api-key <key>                     # API Key 认证
export STARTUPOS_JWT_TOKEN=<token>          # JWT Token (环境变量)

# 查看当前认证状态
ssos auth whoami
```

#### 🗂️ 通用 CRUD（支持 127 种资源）

```bash
# 基础操作
ssos crud list <resource> [--workspace-id=<uuid>]
ssos crud get <resource> <id>
ssos crud create <resource> <json-data>
ssos crud update <resource> <id> <json-data>
ssos crud delete <resource> <id>
ssos crud action <resource> <id> <action>  # 特殊操作（post, approve, reverse）

# 示例
ssos crud list journal-entries --workspace-id=abc123
ssos crud get accounts 5001
ssos crud create employees '{"name":"张三","email":"zhang@example.com"}'
ssos crud action journal-entries je_001 post      # 凭证过账
ssos crud action journal-entries je_001 reverse   # 凭证冲红
```

**127 种资源类型**：`accounts`, `journal-entries`, `business-vat-invoices`, `employees`, `contracts`, `tax-calculations` 等

**查看所有资源类型**：`ssos crud list-types`

#### 💰 会计命令（7 个报表生成）

```bash
# 报表生成
ssos accounting trial-balance        # 试算平衡表
ssos accounting balance-sheet        # 资产负债表
ssos accounting income-statement     # 利润表
ssos accounting cash-flow            # 现金流量表
ssos accounting general-ledger       # 总账
ssos accounting bank-journal         # 银行日记账
ssos accounting account-balances     # 科目余额表
```

**注意**：凭证和科目的数据操作请使用 `crud` 命令

#### 🧾 税务命令（6 个计算和查询）

```bash
ssos tax calendar                   # 税务日历
ssos tax calculations               # 税务计算
ssos tax compliance                 # 合规检查
ssos tax filings                    # 申报表
ssos tax rules                      # 税务规则
ssos tax loss-carryforward          # 亏损弥补
```

#### 📄 发票命令（3 个业务操作）

```bash
ssos invoice reverse <id>              # 冲红发票
ssos invoice to-journal-entry <id>     # 从发票生成凭证
ssos invoice batch-to-entries --ids    # 批量生成凭证
```

**注意**：发票数据操作请使用 `crud list business-vat-invoices`

#### 🤖 AI 命令（5 个智能功能）

```bash
ssos ai-bookkeeping book --text "购买办公用品500元"  # AI 记账
ssos ai-bookkeeping ocr --file-url <url>           # OCR 识别
ssos ai-bookkeeping compliance --question "问题"    # 合规问答
ssos ai-bookkeeping conversations                  # 对话历史
ssos ai-bookkeeping file-upload --file <path>      # 上传文件
```

### 📋 完整命令参考

| 模块 | 命令数 | 主要功能 |
|------|--------|---------|
| **auth** | 3 | 登录、API Key、查看用户 |
| **crud** | 7 actions × 127 resources | 统一 CRUD 接口（list, get, create, update, delete, action, list-types）|
| **accounting** | 7 | 财务报表生成（试算表、资产负债表、利润表等）|
| **tax** | 6 | 税务计算和查询（日历、合规、申报）|
| **invoice** | 3 | 发票业务逻辑（冲红、生成凭证）|
| **ai-bookkeeping** | 5 | AI 智能记账（OCR、自动记账、合规问答）|
| **workspace** | 1 | 工作区统计（stats）|
| **users** | 1 | 用户管理（reset-password）|
| **setup** | 1 | 一键安装配置 |
| **doctor** | 1 | 健康检查 |

**总计**: 51 核心命令

**完整文档**: 运行 `ssos --help` 或 `ssos <module> --help` 查看详细用法

**💡 提示**: 
- 90% 数据操作通过 `crud` 命令完成
- 复杂业务逻辑使用专用命令（accounting, tax, invoice）
- AI 功能统一在 `ai-bookkeeping` 模块

#### MCP 服务器

安装后，在 AI IDE 中可直接调用：

```
用户: "列出本月的记账凭证"
AI → MCP: resource_list journal-entries --workspace_id=xxx

用户: "计算本季度增值税"
AI → MCP: tax_calculate_vat --start=2024-01-01 --end=2024-03-31
```

支持的 MCP 服务器：
- **startupos-core** (13 工具, 127 资源) - 认证、工作区、通用 CRUD
- **startupos-accounting** (41 工具) - 会计、报表、对账
- **startupos-hr** (10 工具) - 员工、薪资、合同
- **startupos-ai** (4 工具) - AI 记账、OCR
- **startupos-legal** (13 工具) - 合同审查、催款函

#### Claude Skills

在 Claude Code 中输入：

```
/startupos-cli
```

### 🛠️ 开发

```bash
# 克隆仓库
git clone https://github.com/Xaiver03/startupos-ai-tools.git
cd startupos-ai-tools

# 安装依赖并构建
npm install

# 构建 CLI
cd cli
npm install
npm run build
npm link

# 构建 MCP Suite
cd ../mcp-suite
npm install
npm run build

# 运行测试
npm test
```

### 📋 系统要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- AI IDE（Claude Code, Cursor, Windsurf, VS Code + Cline, Zed 等）

### 🤝 贡献

欢迎贡献！请阅读 [贡献指南](CONTRIBUTING.md)。

### 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

### 🔗 相关链接

- [StartupOS 官网](https://finlaw.cloud)
- [API 文档](https://docs.finlaw.cloud)
- [问题反馈](https://github.com/Xaiver03/startupos-ai-tools/issues)

---

## English

### ✨ Features

- 🤖 **AI Native Design** - Seamless integration with 9+ AI IDEs (Claude Code, Cursor, Windsurf, Zed, etc.)
- ⚡ **One-line Install** - Auto-configure MCP servers and Claude Skills
- 🛠️ **155 CLI Commands** - Covering accounting, tax, invoicing, HR, legal
- 🔧 **7 Universal Tools + 127 Resources** - Unified CRUD interface
- 📦 **Modular Architecture** - CLI, MCP Suite, Skills work independently

### 🎯 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  StartupOS AI Tools                          │
├─────────────────┬─────────────────┬─────────────────────────┤
│  CLI            │  MCP Suite      │  Skills                 │
│  Command Line   │  MCP Servers    │  Workflow Skills        │
├─────────────────┼─────────────────┼─────────────────────────┤
│  • Server-side  │  • AI Agent     │  • Claude Code workflow │
│  • Bash/Script  │  • JSON-RPC     │  • CLI commands         │
│  • Direct DB    │  • HTTP API     │  • Multi-step           │
├─────────────────┼─────────────────┼─────────────────────────┤
│  155 commands   │  81 tools       │  3 skill files          │
│  19 modules     │  127 resources  │                         │
└─────────────────┴─────────────────┴─────────────────────────┘
```

### 🚀 Quick Start

#### Method 1: NPX One-line Install (Recommended)

```bash
# Clone repository
git clone https://github.com/Xaiver03/startupos-ai-tools.git
cd startupos-ai-tools

# One-line install (CLI + MCP + Skills)
npx @xaiverdeng/startupos-cli setup

# Or MCP servers only
npx @xaiverdeng/startupos-cli setup --mcp

# Or Skills only
npx @xaiverdeng/startupos-cli setup --skill
```

#### Method 2: Global CLI Install

```bash
npm install -g @xaiverdeng/startupos-cli

# Then run in repo directory
startupos-cli setup
```

#### Method 3: Manual Script

```bash
git clone https://github.com/Xaiver03/startupos-ai-tools.git
cd startupos-ai-tools
./install.sh
```

### 🔍 Health Check

```bash
npx @xaiverdeng/startupos-cli doctor
```

### 📚 Usage

See Chinese section above for detailed usage examples.

### 📄 License

MIT License - see [LICENSE](LICENSE) file

---

<div align="center">

**Built with ❤️ by the StartupOS Team**

[Website](https://finlaw.cloud) · [Documentation](https://docs.finlaw.cloud) · [Issues](https://github.com/Xaiver03/startupos-ai-tools/issues)

</div>
