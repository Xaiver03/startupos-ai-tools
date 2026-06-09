# SSOS MCP Suite

Production-ready MCP servers for SSOS (Startup OS) - AI-powered financial management platform for Chinese SMEs.

**83 tools across 5 specialized servers** covering accounting, HR, AI intelligence, and legal operations.

---

## 📦 Architecture

Modular design with independent MCP servers by business domain:

| Server | Tools | Description |
|--------|-------|-------------|
| **@ssos/mcp-core** | 13 | Authentication, workspace management, API keys |
| **@ssos/mcp-accounting** | 41 | Journal entries, accounts, reports, taxes, banking, invoices, partners |
| **@ssos/mcp-hr** | 10 | Employees, payroll, labor contracts |
| **@ssos/mcp-ai** | 4 | AI bookkeeping, OCR, compliance Q&A |
| **@ssos/mcp-legal** | 13 | Contracts, reviews, demand letters |
| **@ssos/mcp-shared** | - | Shared utilities (API client, types) |

**Why multiple servers?**
- ✅ Better performance - load only what you need
- ✅ Clear permissions - finance team doesn't see HR tools
- ✅ Independent updates - update accounting without affecting HR
- ✅ Fault isolation - one server crash doesn't affect others
- ✅ Easier maintenance - 10-20 tools per server vs 100+ monolith

---

## 🚀 Quick Start

### 1. Build All Packages

```bash
cd ssos-mcp-suite
npm install
npm run build
```

### 2. Configure Claude Code

Add to your `~/.claude/.mcp.json` or project `.mcp.json`:

```json
{
  "mcpServers": {
    "ssos-core": {
      "command": "node",
      "args": ["/absolute/path/to/ssos-mcp-suite/packages/core/dist/index.js"],
      "env": {
        "SSOS_API_URL": "https://api.finlaw.cloud",
        "SSOS_API_KEY": "sk_live_your_api_key_here"
      }
    },
    "ssos-accounting": {
      "command": "node",
      "args": ["/absolute/path/to/ssos-mcp-suite/packages/accounting/dist/index.js"],
      "env": {
        "SSOS_API_URL": "https://api.finlaw.cloud",
        "SSOS_API_KEY": "sk_live_your_api_key_here"
      }
    },
    "ssos-hr": {
      "command": "node",
      "args": ["/absolute/path/to/ssos-mcp-suite/packages/hr/dist/index.js"],
      "env": {
        "SSOS_API_URL": "https://api.finlaw.cloud",
        "SSOS_API_KEY": "sk_live_your_api_key_here"
      }
    },
    "ssos-ai": {
      "command": "node",
      "args": ["/absolute/path/to/ssos-mcp-suite/packages/ai/dist/index.js"],
      "env": {
        "SSOS_API_URL": "https://api.finlaw.cloud",
        "SSOS_API_KEY": "sk_live_your_api_key_here"
      }
    },
    "ssos-legal": {
      "command": "node",
      "args": ["/absolute/path/to/ssos-mcp-suite/packages/legal/dist/index.js"],
      "env": {
        "SSOS_API_URL": "https://api.finlaw.cloud",
        "SSOS_API_KEY": "sk_live_your_api_key_here"
      }
    }
  }
}
```

**Replace `/absolute/path/to/` with your actual path!**

### 3. Restart Claude Code

```bash
# In Claude Code CLI
/clear
# Or restart the app
```

### 4. Verify Installation

In Claude Code, ask:
```
List all available SSOS tools
```

You should see 83 tools from 5 servers.

---

## 🔑 Authentication

### Option 1: API Key (Recommended for MCP)

1. Login to SSOS and generate an API key:
   ```bash
   curl -X POST https://api.finlaw.cloud/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"your@email.com","password":"your_password"}'
   ```

2. Get your workspace ID:
   ```bash
   curl https://api.finlaw.cloud/api/workspaces \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

3. Create API key:
   ```bash
   curl -X POST https://api.finlaw.cloud/api/api-keys \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "workspace_id":"YOUR_WORKSPACE_ID",
       "name":"MCP Server",
       "expires_in_days":90
     }'
   ```

4. Use the returned `key` (starts with `sk_live_`) in your `.mcp.json`

### Option 2: Username/Password

If you don't have an API key, MCP servers will automatically login with username/password (requires `SSOS_USERNAME` and `SSOS_PASSWORD` env vars). Not recommended for production.

---

## 📚 Complete Tool Reference

### @ssos/mcp-core (13 tools)

**Authentication & Session**
- `login` - Login with email/password
- `logout` - Logout current session
- `get_current_user` - Get current user info
- `refresh_token` - Refresh access token

**Workspace Management**
- `list_workspaces` - List all workspaces user has access to
- `get_workspace` - Get workspace details
- `create_workspace` - Create new workspace
- `update_workspace` - Update workspace settings
- `delete_workspace` - Delete workspace

**API Key Management**
- `list_api_keys` - List all API keys for workspace
- `create_api_key` - Create new API key
- `revoke_api_key` - Revoke API key
- `get_api_key_usage` - Get API key usage stats

---

### @ssos/mcp-accounting (41 tools)

**Journal Entries (5 tools)**
- `list_journal_entries` - List journal entries with filters
- `get_journal_entry` - Get single entry details
- `create_journal_entry` - Create new entry
- `update_journal_entry` - Update entry
- `delete_journal_entry` - Delete entry

**Accounts (5 tools)**
- `list_accounts` - List chart of accounts
- `get_account` - Get account details
- `create_account` - Create new account
- `update_account` - Update account
- `delete_account` - Delete account

**Reports (3 tools)**
- `get_balance_sheet` - Balance sheet report
- `get_income_statement` - Income statement (P&L)
- `get_cash_flow_statement` - Cash flow statement

**Tax (3 tools)**
- `calculate_vat` - Calculate VAT for period
- `calculate_income_tax` - Calculate income tax
- `get_tax_calendar` - Get tax filing calendar

**Bank Reconciliation (5 tools)**
- `list_bank_accounts` - List bank accounts
- `create_bank_account` - Add bank account
- `list_bank_transactions` - List transactions
- `import_bank_transactions` - Import transactions from file
- `list_reconciliation_records` - List reconciliation history

**VAT Invoices (2 tools)**
- `list_vat_invoices` - List VAT invoices
- `create_vat_invoice` - Create invoice request

**Partners (Customers/Suppliers) (3 tools)**
- `list_partners` - List business partners
- `create_partner` - Create new partner
- `update_partner` - Update partner info

**Accounting Periods (5 tools)**
- `list_accounting_periods` - List all periods
- `create_accounting_period` - Create new period
- `close_accounting_period` - Close period (lock entries)
- `list_opening_balances` - List opening balances
- `set_opening_balance` - Set opening balance for account

**Expense Claims (6 tools)**
- `list_expense_claims` - List expense claims
- `create_expense_claim` - Create new claim
- `approve_expense_claim` - Approve claim
- `reject_expense_claim` - Reject claim
- `list_expense_items` - List expense items
- `create_expense_item` - Add item to claim

**Departments (3 tools)**
- `list_departments` - List departments
- `create_department` - Create department
- `update_department` - Update department

**Batch Operations (1 tool)**
- `batch_create_journal_entries` - Bulk create entries (up to 50)

---

### @ssos/mcp-hr (10 tools)

**Employee Management (5 tools)**
- `list_employees` - List employees with filters
- `get_employee` - Get employee details
- `create_employee` - Create new employee
- `update_employee` - Update employee info
- `delete_employee` - Delete employee

**Payroll (3 tools)**
- `list_payroll_records` - List payroll records
- `create_payroll_record` - Create payroll entry
- `post_payroll` - Generate accounting entries for payroll

**Labor Contracts (2 tools)**
- `list_labor_contracts` - List labor contracts
- `create_labor_contract` - Create new contract

---

### @ssos/mcp-ai (4 tools)

**AI Bookkeeping**
- `ai_bookkeeping` - Natural language to accounting entry
- `list_ai_conversations` - List AI bookkeeping history

**Document Intelligence**
- `ocr_invoice` - Extract data from invoice image

**Compliance**
- `ask_compliance_question` - Ask Chinese tax/accounting compliance questions

---

### @ssos/mcp-legal (13 tools)

**Contract Management (5 tools)**
- `list_contracts` - List contracts with filters
- `get_contract` - Get contract details
- `create_contract` - Create new contract record
- `update_contract` - Update contract info
- `generate_contract` - AI generate contract from template

**Contract Review (4 tools)**
- `review_contract_text` - AI review contract for risks
- `get_contract_review` - Get review details
- `list_contract_reviews` - List review history
- `ask_contract_question` - Ask questions about contract

**Demand Letters (4 tools)**
- `list_demand_letters` - List demand letters
- `generate_demand_letter` - AI generate demand letter
- `save_demand_letter` - Save generated letter
- `get_legal_path_recommendation` - Get legal action recommendation by amount

---

## 💡 Usage Examples

### Example 1: AI Bookkeeping

```
You: "公司今天收到客户付款 5 万元，银行转账"

Claude: [Calls ai_bookkeeping tool]
Created journal entry:
- Debit: 1002 Bank Deposits 50,000
- Credit: 1122 Accounts Receivable 50,000
Entry ID: 12345
```

### Example 2: Generate Monthly Financial Reports

```
You: "Generate balance sheet and income statement for March 2026"

Claude: [Calls get_balance_sheet and get_income_statement]
Balance Sheet as of 2026-03-31:
Total Assets: ¥1,250,000
Total Liabilities: ¥450,000
Owner's Equity: ¥800,000

Income Statement for March 2026:
Revenue: ¥320,000
Expenses: ¥180,000
Net Income: ¥140,000
```

### Example 3: Create Employee and Payroll

```
You: "Add new employee 张三, salary 8000/month, start date 2026-06-01"

Claude: [Calls create_employee]
Employee created: ID 101, Name: 张三

You: "Calculate June payroll for all employees"

Claude: [Calls list_employees, create_payroll_record for each, post_payroll]
Payroll entries created for 15 employees.
Accounting entries generated:
- Debit: Salary Expense ¥120,000
- Credit: Payroll Payable ¥102,000
- Credit: Taxes Payable ¥18,000
```

### Example 4: AI Contract Review

```
You: "Review this contract for risks: [paste contract text]"

Claude: [Calls review_contract_text]
Risk Analysis:
- High Risk: Payment terms unclear (no specific due date)
- Medium Risk: Liquidated damages clause only 5% (below industry standard 10-20%)
- Low Risk: Arbitration clause valid but venue not specified

Recommendations:
1. Add specific payment deadline (e.g., "within 30 days of invoice date")
2. Increase liquidated damages to 15%
3. Specify arbitration venue (e.g., Beijing Arbitration Commission)
```

---

## 🛠️ Development

### Install Dependencies

```bash
npm install
```

### Build All Packages

```bash
npm run build
```

### Build Specific Package

```bash
npm run build -w packages/core
npm run build -w packages/accounting
npm run build -w packages/hr
npm run build -w packages/ai
npm run build -w packages/legal
```

### Watch Mode (Auto-rebuild on change)

```bash
npm run dev
```

### Project Structure

```
ssos-mcp-suite/
├── packages/
│   ├── shared/              # Shared utilities
│   │   ├── src/
│   │   │   ├── api-client.ts   # API client with auto-refresh
│   │   │   ├── types.ts        # Shared types
│   │   │   └── index.ts
│   │   └── package.json
│   ├── core/                # @ssos/mcp-core
│   │   ├── src/
│   │   │   ├── index.ts        # Server entry
│   │   │   ├── tools/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── workspaces.ts
│   │   │   │   └── api-keys.ts
│   │   │   └── types.ts
│   │   └── package.json
│   ├── accounting/          # @ssos/mcp-accounting
│   ├── hr/                  # @ssos/mcp-hr
│   ├── ai/                  # @ssos/mcp-ai
│   └── legal/               # @ssos/mcp-legal
├── package.json             # Workspace root
├── tsconfig.json
└── README.md
```

### Adding a New Tool

1. Create tool file in `packages/[server]/src/tools/[name].ts`:

```typescript
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { client } from '@ssos/mcp-shared';

export const myNewTool: Tool = {
  name: 'my_new_tool',
  description: 'What this tool does',
  inputSchema: {
    type: 'object',
    properties: {
      param1: { type: 'string', description: 'Parameter description' },
    },
    required: ['param1'],
  },
  handler: async (args: any) => {
    const response = await client.apiFetch('/api/my-endpoint', {
      method: 'POST',
      body: JSON.stringify(args),
    });
    return {
      content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
    };
  },
};
```

2. Export in `packages/[server]/src/index.ts`:

```typescript
import { myNewTool } from './tools/my-new-tool.js';

const server = new Server(
  { name: 'ssos-[server]', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    // ... existing tools
    myNewTool,
  ],
}));
```

3. Rebuild:

```bash
npm run build -w packages/[server]
```

---

## 🐛 Troubleshooting

### Tools not showing up in Claude Code

1. Check MCP server is running:
   ```bash
   # In Claude Code
   /mcp status
   ```

2. Check logs:
   ```bash
   # In Claude Code
   /mcp logs ssos-core
   ```

3. Verify path in `.mcp.json` is absolute (not relative)

4. Restart Claude Code after config changes

### "API Key invalid" error

1. Verify API key is correct (starts with `sk_live_`)
2. Check key hasn't expired
3. Check key belongs to correct workspace

### "Workspace not found" error

1. Use `list_workspaces` tool to see available workspaces
2. Verify `SSOS_API_KEY` was created for correct workspace

### Build errors

1. Clean and rebuild:
   ```bash
   rm -rf packages/*/dist node_modules
   npm install
   npm run build
   ```

2. Check Node version (requires Node 18+):
   ```bash
   node --version
   ```

---

## 📊 Coverage

Current MCP coverage: **83 tools covering ~35/99 backend API endpoints (35%)**

High-frequency operations covered: **~90%**

| Domain | Coverage |
|--------|----------|
| Authentication | 100% |
| Journal Entries | 100% |
| Accounts | 100% |
| Financial Reports | 100% |
| Tax Calculations | 80% |
| Bank Reconciliation | 90% |
| Employees & Payroll | 100% |
| AI Bookkeeping | 100% |
| Contracts & Legal | 85% |

---

## 📝 License

MIT

---

## 🔗 Related

- [SSOS Project](../)
- [Backend API Docs](../docs/architecture/FEATURE_OVERVIEW.md)
- [MCP Expansion Plan](./MCP_EXPANSION_PLAN.md)

---

**Last Updated**: 2026-06-03
