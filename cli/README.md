# @xaiverdeng/startupos-cli

[![npm version](https://badge.fury.io/js/@xaiverdeng%2Fstartupos-cli.svg)](https://www.npmjs.com/package/@xaiverdeng/startupos-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Startup OS CLI** — AI Native command-line tool for [Startup OS (创业OS)](https://github.com/finlaw/startupos), an AI-powered financial management system for Chinese startups.

## 🚀 One-Line Installation

Install AI tools to **all your AI IDEs** with a single command:

```bash
npx @xaiverdeng/startupos-cli setup
```

This automatically:
- ✅ Detects installed AI IDEs on your system
- ✅ Installs 5 MCP servers (81 AI tools total)
- ✅ Configures Claude Code Skills
- ✅ Works on macOS, Windows, and Linux

### Supported AI IDEs

| IDE | MCP Servers | Claude Skills |
|-----|-------------|---------------|
| **Claude Code** | ✅ | ✅ |
| **Cursor** | ✅ | — |
| **Windsurf (Codeium)** | ✅ | — |
| **VS Code + Cline** | ✅ | — |
| **Zed Editor** | ✅ | — |
| **OpenCode** | ✅ | — |
| **Hermes** | ✅ | — |
| **Codex** | ✅ | — |
| **OpenClaw** | ✅ | — |

## 📦 Installation

### Option 1: npx (Recommended)

No installation needed:

```bash
npx @xaiverdeng/startupos-cli <command>
```

### Option 2: Global Install

```bash
npm install -g @xaiverdeng/startupos-cli
startupos-cli <command>
```

## 🎯 Quick Start

```bash
# 1. Install AI tools
npx @xaiverdeng/startupos-cli setup

# 2. Authenticate
npx @xaiverdeng/startupos-cli auth login

# 3. Verify installation
npx @xaiverdeng/startupos-cli doctor

# 4. Start using
npx @xaiverdeng/startupos-cli crud list accounts
```

## 🛠️ Commands

### AI Native Setup

```bash
# Install everything (MCP + Skills)
startupos-cli setup

# Install MCP servers only
startupos-cli setup --mcp

# Install Claude Skills only
startupos-cli setup --skill

# Health check
startupos-cli doctor
```

### Authentication

```bash
# Login with email/password
startupos-cli auth login

# Use API key
startupos-cli auth api-key <your-api-key>

# Logout
startupos-cli auth logout

# Check auth status
startupos-cli auth status
```

### Universal CRUD (127 Resources)

```bash
# List all resource types
startupos-cli crud list-types

# List resources
startupos-cli crud list <resource-type>

# Get a single resource
startupos-cli crud get <resource-type> <id>

# Create resource
startupos-cli crud create <resource-type>

# Update resource
startupos-cli crud update <resource-type> <id>

# Delete resource
startupos-cli crud delete <resource-type> <id>
```

**Example resources**: `accounts`, `journal-entries`, `employees`, `contracts`, `invoices`, `tax-filings`, etc.

### Business Logic Commands

#### Accounting

```bash
# Add batch journal entries
startupos-cli accounting add-batch entries.json

# Close accounting period
startupos-cli accounting close-period <period-id>
```

#### Tax Calculation

```bash
# Calculate VAT
startupos-cli tax calculate-vat --start=2024-01-01 --end=2024-03-31

# Calculate income tax
startupos-cli tax calculate-income --year=2024
```

#### VAT Invoices

```bash
# Create VAT invoice
startupos-cli invoice create invoice.json

# List invoices
startupos-cli invoice list
```

#### AI Bookkeeping

```bash
# AI-powered bookkeeping
startupos-cli ai-bookkeeping scan "购买办公用品500元"

# Batch process
startupos-cli ai-bookkeeping batch transactions.json
```

### System Commands

```bash
# System health check
startupos-cli health

# System information
startupos-cli info

# Show version
startupos-cli --version

# Show help
startupos-cli --help
```

## 🤖 MCP Servers

The CLI installs 5 MCP servers with 81 tools total:

| Server | Tools | Resources | Description |
|--------|-------|-----------|-------------|
| **startupos-core** | 13 | 127 | Core CRUD operations for all resources |
| **startupos-accounting** | 41 | — | Journal entries, accounts, reports, taxes, banking |
| **startupos-hr** | 10 | — | Employees, payroll, labor contracts |
| **startupos-ai** | 4 | — | AI bookkeeping, OCR, compliance Q&A |
| **startupos-legal** | 13 | — | Contracts, legal review, demand letters |

### MCP Tools Examples

When using MCP-enabled AI IDEs, you can:

```
"Create a journal entry for purchasing office supplies 500 RMB"
→ Uses startupos-accounting:createJournalEntry

"List all employees in workspace X"
→ Uses startupos-hr:listEmployees

"Review this contract for legal issues"
→ Uses startupos-legal:reviewContract

"Calculate VAT for Q1 2024"
→ Uses startupos-accounting:calculateVAT
```

## 🔐 Authentication

Three methods:

1. **Email/Password** (Recommended)
   ```bash
   startupos-cli auth login
   # Prompts for email and password
   # Stores tokens in ~/.startupos-cli/auth.json
   ```

2. **API Key**
   ```bash
   startupos-cli auth api-key <your-api-key>
   # Or set environment variable:
   export STARTUPOS_API_KEY=<your-api-key>
   ```

3. **JWT Token** (Advanced)
   ```bash
   export STARTUPOS_JWT_TOKEN=<your-jwt-token>
   ```

## 📊 Configuration

Configuration stored in `~/.startupos-cli/`:
- `auth.json` — Authentication tokens
- `config.json` — CLI settings

Environment variables:
- `STARTUPOS_API_URL` — API endpoint (default: `https://api.finlaw.cloud`)
- `STARTUPOS_API_KEY` — API key
- `STARTUPOS_JWT_TOKEN` — JWT token
- `STARTUPOS_EMAIL` — Email (for login)
- `STARTUPOS_PASSWORD` — Password (for login)

## 🌍 API Endpoint

Default: `https://api.finlaw.cloud`

To use a different endpoint:

```bash
export STARTUPOS_API_URL=http://localhost:4000
```

## 🧪 Development

```bash
# Clone repo
git clone https://github.com/YOUR_USERNAME/startupos.git
cd startupos/ai-tools/cli

# Install dependencies
npm install

# Build
npm run build

# Run locally
node dist/index.js <command>

# Watch mode
npm run watch
```

## 📚 Documentation

- [Full Documentation](https://docs.startupos.com)
- [API Reference](https://api-docs.startupos.com)
- [MCP Servers Guide](../mcp-suite/README.md)
- [NPM Publishing Guide](./NPM_PUBLISH.md)

## 🤝 Contributing

Contributions welcome! Please read our [Contributing Guide](../../CONTRIBUTING.md).

## 📄 License

MIT License - see [LICENSE](../../LICENSE) file for details.

## 🔗 Links

- [Startup OS Main Repo](https://github.com/YOUR_USERNAME/startupos)
- [NPM Package](https://www.npmjs.com/package/@xaiverdeng/startupos-cli)
- [Issue Tracker](https://github.com/YOUR_USERNAME/startupos/issues)

---

**Startup OS (创业OS)** — AI 驱动的创业公司财务管理系统  
Built with ❤️ by [Finlaw](https://finlaw.cloud)
