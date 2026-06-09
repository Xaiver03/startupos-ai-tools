<div align="center">

# 🚀 StartupOS AI Tools

**AI-powered CLI, MCP Servers, and Skills for StartupOS Financial Management**

[![npm version](https://img.shields.io/npm/v/@xaiverdeng/startupos-cli.svg)](https://www.npmjs.com/package/@xaiverdeng/startupos-cli)
[![npm downloads](https://img.shields.io/npm/dm/@xaiverdeng/startupos-cli.svg)](https://www.npmjs.com/package/@xaiverdeng/startupos-cli)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node version](https://img.shields.io/node/v/@xaiverdeng/startupos-cli.svg)](https://nodejs.org)
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
- 🛠️ **155 个 CLI 命令** - 涵盖会计、税务、发票、人事、法务
- 🔧 **7 个通用工具 + 127 种资源** - 统一 CRUD 接口
- 📦 **模块化架构** - CLI、MCP Suite、Skills 独立可用

### 📊 项目统计

```
📦 包含组件
├─ CLI 工具................155+ 命令
├─ MCP 服务器..............81 工具 + 127 资源
└─ Claude Skills...........3 技能文件

🎯 覆盖业务
├─ 会计模块................41 命令（报表/凭证/期末）
├─ 税务模块................13 命令（增值税/所得税/个税）
├─ 发票模块................10 命令（导入/验证/记账）
├─ 人事模块................10 命令（员工/薪资/合同）
├─ 法务模块................13 命令（审查/生成/提醒）
└─ AI 记账.................4 命令（扫描/OCR/学习）

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
│  • Bash/脚本调用 │  • JSON-RPC 协议 │  • 调用 CLI 命令        │
│  • 数据库直连    │  • HTTP API 调用 │  • 多步骤编排           │
├─────────────────┼─────────────────┼─────────────────────────┤
│  155 命令        │  81 工具         │  3 技能文件              │
│  19 模块         │  127 资源类型    │                         │
└─────────────────┴─────────────────┴─────────────────────────┘
```

### 🚀 快速开始

#### 方法 1：NPX 一键安装（推荐）

```bash
# 克隆仓库
git clone https://github.com/Xaiver03/startupos-ai-tools.git
cd startupos-ai-tools

# 一键安装所有工具（CLI + MCP + Skills）
npx @xaiverdeng/startupos-cli setup

# 或仅安装 MCP 服务器
npx @xaiverdeng/startupos-cli setup --mcp

# 或仅安装 Skills
npx @xaiverdeng/startupos-cli setup --skill
```

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
npx @xaiverdeng/startupos-cli doctor
```

输出示例：

```
🏥 Startup OS AI Tools Health Check
══════════════════════════════════════════════════

📦 CLI
  ✓ Version: 1.0.0
  ✓ Package: @xaiverdeng/startupos-cli

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
npx @xaiverdeng/startupos-cli setup --mcp

# 3. 重启 AI IDE
```

**认证失败**
```bash
# 重新登录
startupos-cli auth login

# 或使用 API Key
startupos-cli auth api-key <your-key>
```

### 📚 使用指南

#### 🔐 认证命令

```bash
# 三种认证方式
startupos-cli auth login                    # 邮箱密码登录
startupos-cli auth api-key <key>            # API Key 认证
export STARTUPOS_JWT_TOKEN=<token>          # JWT Token (环境变量)

# 查看当前认证状态
startupos-cli auth whoami
```

#### 🗂️ 通用 CRUD（支持 127 种资源）

```bash
# 基础操作
startupos-cli crud list <resource> [--workspace-id=<uuid>]
startupos-cli crud get <resource> <id>
startupos-cli crud create <resource> <json-data>
startupos-cli crud update <resource> <id> <json-data>
startupos-cli crud delete <resource> <id>

# 示例
startupos-cli crud list journal-entries --workspace-id=abc123
startupos-cli crud get accounts 5001
startupos-cli crud create employees '{"name":"张三","email":"zhang@example.com"}'
```

**127 种资源类型**：`accounts`, `journal-entries`, `vat-invoices`, `employees`, `contracts`, `tax-calculations` 等

#### 💰 会计命令（41 工具）

```bash
# 报表生成
startupos-cli accounting trial-balance        # 试算平衡表
startupos-cli accounting balance-sheet        # 资产负债表
startupos-cli accounting income-statement     # 利润表
startupos-cli accounting cash-flow           # 现金流量表

# 凭证管理
startupos-cli accounting batch-entries <file> # 批量记账
startupos-cli accounting reverse-entry <id>   # 冲红凭证

# 期末处理
startupos-cli accounting period-close         # 期末结转
```

#### 🧾 税务命令（13 工具）

```bash
startupos-cli tax calculate-vat              # 计算增值税
startupos-cli tax annual-settlement          # 汇算清缴
startupos-cli tax salary-tax                 # 工资个税
startupos-cli tax calendar                   # 纳税日历
```

#### 📄 发票命令（10 工具）

```bash
startupos-cli invoice import-xml <file>      # 导入增值税发票
startupos-cli invoice batch-create-entries   # 批量生成凭证
startupos-cli invoice verify <code>          # 验证发票真伪
```

#### 👥 人事 + ⚖️ 法务 + 🤖 AI（37 工具）

```bash
startupos-cli hr payroll-calculate           # 计算工资
startupos-cli legal contract-review <file>   # 合同审查
startupos-cli ai-bookkeeping scan "购买办公用品500元"  # 智能记账
```

### 📋 完整命令参考

| 模块 | 命令数 | 主要功能 |
|------|--------|---------|
| **auth** | 3 | 登录、API Key、查看用户 |
| **crud** | 5×127 | 通用 CRUD（127 种资源类型）|
| **accounting** | 41 | 报表、凭证、账簿、期末处理、银行对账 |
| **tax** | 13 | 增值税、所得税、个税、税务日历 |
| **invoice** | 10 | 导入、验证、记账、开票申请 |
| **hr** | 10 | 员工、薪资、合同 |
| **legal** | 13 | 合同审查、风险评分、生成催款函 |
| **ai-bookkeeping** | 4 | 智能扫描、OCR、学习反馈 |
| **setup** | 1 | 一键安装配置 |
| **doctor** | 1 | 健康检查 |

**完整文档**: 运行 `startupos-cli --help` 或 `startuops-cli <module> --help` 查看详细用法

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
