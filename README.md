# SSOS AI Tools

AI-powered tools for SSOS financial management system. Three independent tool systems with clear separation of concerns.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     SSOS AI Tools                            │
├─────────────────┬─────────────────┬─────────────────────────┤
│  CLI (ssos-cli) │  MCP Suite      │  Skills                 │
│  命令行工具      │  MCP 服务器组    │  工作流技能              │
├─────────────────┼─────────────────┼─────────────────────────┤
│  • 服务端直接执行 │  • AI Agent 调用 │  • Claude Code 工作流   │
│  • Bash/脚本调用 │  • JSON-RPC 协议 │  • 调用 CLI 命令        │
│  • 数据库直连    │  • HTTP API 调用 │  • 多步骤编排           │
├─────────────────┼─────────────────┼─────────────────────────┤
│  Commander.js   │  MCP SDK        │  Markdown + Bash        │
│  155 命令        │  7 通用工具      │  3 技能文件              │
│  (精简 44%)     │  127 资源类型    │                         │
└─────────────────┴─────────────────┴─────────────────────────┘
```

## System Architecture

### 1. CLI (Command Line Interface)
**Purpose**: Server-side operations with direct database access

**Usage Scenarios**:
- Server administrators running maintenance tasks
- Automated scripts and cron jobs
- Skills calling CLI commands
- Development and debugging

**Characteristics**:
- Direct PostgreSQL connection
- Full system access (PM2, logs, DB)
- Batch operations support
- No HTTP overhead

**Entry Point**: `ai-tools/cli/`

```bash
# Installation
cd ai-tools/cli
npm install
npm run build
npm link  # Makes ssos-cli available globally

# Usage
ssos-cli auth login --api-key sk_live_xxx
ssos-cli crud list journal-entries -w <workspace-id>
ssos-cli accounting trial-balance -w <workspace-id>
ssos-cli tax calendar -w <workspace-id>
```

### 2. MCP Suite (Model Context Protocol Servers)
**Purpose**: AI Agent integration via standardized protocol

**Usage Scenarios**:
- Claude Desktop app integration
- Other AI assistants with MCP support
- Third-party MCP clients
- Remote API calls (via MCP-over-HTTP)

**Characteristics**:
- JSON-RPC protocol
- HTTP API calls (no direct DB access)
- Automatic auth token management
- Sandboxed execution

**Entry Point**: `ai-tools/mcp-suite/`

**Architecture**: 5 modular packages
```
mcp-suite/
├── packages/core/          # Auth, workspace, API keys
├── packages/accounting/    # Financial operations
├── packages/ai/            # AI bookkeeping, OCR
├── packages/hr/            # Employees, payroll, contracts
└── packages/legal/         # Contracts, reviews, demand letters
```

```bash
# Installation
cd ai-tools/mcp-suite
npm install
npm run build

# Configuration (add to Claude Desktop settings)
{
  "mcpServers": {
    "ssos-core": {
      "command": "node",
      "args": ["/path/to/mcp-suite/packages/core/dist/index.js"]
    },
    "ssos-accounting": {
      "command": "node",
      "args": ["/path/to/mcp-suite/packages/accounting/dist/index.js"]
    }
  }
}
```

### 3. Skills (Claude Code Workflows)
**Purpose**: Multi-step workflow orchestration in Claude Code

**Usage Scenarios**:
- Month-end closing workflow
- Financial health check
- Batch bookkeeping tasks
- Complex cross-module operations

**Characteristics**:
- Markdown documentation + executable commands
- Calls CLI commands under the hood
- Interactive prompts for user input
- Checkpoint and rollback support

**Entry Point**: `ai-tools/skills/`

```bash
# Installation (symlink to Claude Code skills directory)
ln -s $(pwd)/ai-tools/skills/ssos-cli.md ~/.claude/skills/ssos-cli.md

# Usage in Claude Code
/ssos-cli        # Show CLI usage guide
```

## Design Principles

### ✅ Correct Usage Patterns

1. **Skills → CLI**
   ```
   User types: /organize-finances
   Skill executes: ssos-cli accounting trial-balance
                   ssos-cli tax calendar
                   ssos-cli period close
   ```

2. **MCP ← AI Agent**
   ```
   User: "Show me pending tax tasks"
   Claude Desktop → MCP tool: resource_list tax-calendar-tasks
   MCP → HTTP API → Backend
   ```

3. **CLI ← Scripts**
   ```bash
   # Cron job: daily backup
   0 2 * * * ssos-cli db backup
   ```

### ❌ Anti-Patterns

1. **Skills should NOT call MCP directly**
   - Skills run in server context, should use CLI
   - MCP is for remote AI agents

2. **MCP should NOT access database directly**
   - MCP calls HTTP APIs only
   - No database credentials in MCP config

3. **CLI should NOT be called from frontend**
   - CLI is server-side only
   - Frontend uses HTTP API

## Feature Coverage

### CLI Modules (19 modules, 155 commands)

| Category | Modules | Commands | Status |
|----------|---------|----------|--------|
| **Accounting** | accounting, period | 10 | ✅ Business logic only |
| **Tax & Payroll** | tax | 7 | ✅ Business logic only |
| **Invoice** | invoice | 3 | ✅ Business logic only |
| **AI & Automation** | ai, ai-bookkeeping | 11+ | ✅ Complete |
| **System Admin** | admin, admin-extended, db, logs | 30+ | ✅ Complete |
| **User & Workspace** | auth, users, workspace, workspace-api, my | 25+ | ✅ Complete |
| **Data & Files** | import-export, files, crud, api | 69+ | ✅ Complete |

**Total**: 155 commands across 19 modules (精简 44%，删除 124 个冗余 CRUD 命令)

**精简原则**:
- ✅ 保留：业务逻辑命令（报表生成、税务计算、期末处理、AI 功能）
- ❌ 删除：重复的 CRUD 命令（改用统一的 `crud` 命令）
- 📝 详见：`CLI_STREAMLINE_COMPLETE.md`

### MCP Suite Tools (7 universal tools + 127 resources)

| Package | Coverage | Status |
|---------|----------|--------|
| **Universal CRUD** | 7 tools cover 127 resource types | ✅ Complete |
| **Resource Types** | accounts, journal-entries, employees, invoices, contracts, etc. | ✅ 127 types |

**Architecture**: Universal CRUD pattern
```bash
# Instead of 200+ specialized tools, use 7 universal tools:
resource_list <type>           # List any resource
resource_get <type> <id>       # Get any resource
resource_create <type>         # Create any resource
resource_update <type> <id>    # Update any resource
resource_delete <type> <id>    # Delete any resource
resource_action <type> <id> <action>  # Execute actions (post, approve, etc.)
resource_list_types            # List all 127 available types

# Example:
resource_list journal-entries --workspace_id=xxx
resource_create employees --data='{"name":"..."}'
resource_action journal-entries abc123 post
```

**Coverage**: 100% of CLI CRUD functionality via 7 tools

### Skills (3 skill files)

| Skill | Purpose | CLI Binding | Status |
|-------|---------|-------------|--------|
| ssos-cli.md | CLI usage guide | Reference only | ✅ |
| organize-finances.md | Financial workflow | ❌ Not bound | ⚠️ |
| organize-finances-checklist.md | Health check | ❌ Not bound | ⚠️ |

**Issues**:
- `organize-finances.md` is documentation only, should execute CLI commands
- No skill executor implementation yet

## Command Reference

详细的命令列表和迁移指南见：
- `CLI_STREAMLINE_COMPLETE.md` - 精简完成报告
- `CLI_STREAMLINE_GUIDE.md` - 模块对照表和迁移指南

### 精简后保留的业务逻辑命令

#### Accounting (7 commands)
```bash
trial-balance         # 试算平衡表
income-statement      # 利润表
general-ledger        # 总账
bank-journal          # 银行日记账
cash-journal          # 现金日记账
account-balances      # 科目余额表
account-balance       # 单科目余额
```

#### Tax (7 commands)
```bash
calendar              # 税务日历
rules                 # 税务规则
calculations          # 税务计算
compliance            # 合规检查
filings               # 申报表
loss-carryforward     # 亏损弥补
```

#### Invoice (3 commands)
```bash
reverse               # 冲红发票
create-entry          # 生成凭证
batch-create-entries  # 批量生成凭证
```

#### Period (3 commands)
```bash
close                 # 关账
opening-balances      # 期初余额
set-opening-balance   # 设置期初余额
```

### CRUD 操作统一使用 crud 命令

```bash
# 所有数据操作统一使用 crud 命令
crud list <resource-type> -w <workspace-id>
crud get <resource-type> <id>
crud create <resource-type> --data '{...}'
crud update <resource-type> <id> --data '{...}'
crud delete <resource-type> <id>
crud action <resource-type> <id> <action-name>

# 示例：
crud list journal-entries -w abc123
crud create employees --data '{"name":"张三"}'
crud action journal-entries xyz789 post
```

支持 127 种资源类型，包括：
- 会计：accounts, journal-entries, opening-balances
- 税务：annual-bonus, dividend-payments, labor-fee-payments
- 人力：employees, payroll-records, labor-contracts
- 发票：business-vat-invoices, partners
- 法务：contracts, demand-letters
- 更多：`crud list-types` 查看完整列表


## Testing

### CLI Testing
```bash
cd ai-tools/cli
npm run build

# Test authentication
ssos-cli auth login --api-key sk_live_xxx

# Test basic commands
ssos-cli workspace-api list
ssos-cli crud list journal-entries -w <workspace-id>
ssos-cli accounting trial-balance -w <workspace-id>
ssos-cli tax calendar -w <workspace-id>
```

### MCP Testing
```bash
cd ai-tools/mcp-suite
npm run build

# Test in Claude Desktop or compatible MCP client
# Example queries:
# - "List my journal entries"
# - "Show me tax calendar tasks"
# - "Create an employee record"
```

### Skills Testing
```bash
# In Claude Code
/ssos-cli
# Should show CLI usage guide
```

## Development

### Adding a New CLI Command
```typescript
// ai-tools/cli/src/commands/example.ts
import { Command } from 'commander';

export function createExampleCommands(program: Command) {
  const example = program.command('example');
  
  example
    .command('hello')
    .description('Say hello')
    .action(async () => {
      console.log('Hello from SSOS CLI!');
    });
  
  return example;
}
```

### Adding a New MCP Tool
```typescript
// ai-tools/mcp-suite/packages/core/src/tools/example.ts
export const exampleTools = {
  example_hello: {
    description: 'Say hello',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' }
      }
    },
    handler: async (args: { name: string }) => {
      return {
        content: [{
          type: 'text',
          text: `Hello ${args.name}!`
        }]
      };
    }
  }
};
```

### Adding a New Skill
```markdown
<!-- ai-tools/skills/example.md -->
---
name: example
description: Example skill
author: Claude
version: 1.0.0
---

# Example Skill

## Usage
/example

## Steps
1. Run CLI command: `ssos-cli example hello`
2. Process output
3. Display result
```

## Roadmap

### ✅ Phase 0: CLI Streamlining (Completed 2026-06-08)
- [x] Remove 124 redundant CRUD commands (44% reduction)
- [x] Standardize on universal `crud` module
- [x] Implement universal MCP CRUD (7 tools, 127 resources)
- [x] Zero `any` types - full TypeScript strict mode
- [x] Update documentation

### Phase 1: MCP Suite Enhancement (2 weeks)
- [ ] Add business logic tools (reports, calculations)
- [ ] Implement streaming for large datasets
- [ ] Add MCP resource discovery

### Phase 2: Skill Executor (2 weeks)
- [ ] Implement skill executor
- [ ] Convert `organize-finances.md` to executable workflow
- [ ] Add interactive prompts

### Phase 3: Testing & Quality (1 month)
- [ ] Comprehensive CLI test suite
- [ ] MCP integration tests
- [ ] Performance benchmarks

### Phase 4: Advanced Features (2 months)
- [ ] Batch operations optimization
- [ ] Real-time sync between CLI and MCP
- [ ] Performance monitoring

## Contributing

1. **CLI**: Add commands in `cli/src/commands/<module>.ts`
2. **MCP**: Add tools in `mcp-suite/packages/<package>/src/tools/<tool>.ts`
3. **Skills**: Add `.md` files in `skills/`

## License

Internal use only - SSOS Project

---

**Last Updated**: 2026-06-08  
**Maintained by**: SSOS Development Team

**Recent Changes**:
- 2026-06-08: CLI 命令精简完成 (279 → 155 commands, -44%)
- 2026-06-08: MCP 统一 CRUD 架构 (7 tools, 127 resources)
- 2026-06-08: TypeScript 严格类型 (0 `any` types)
