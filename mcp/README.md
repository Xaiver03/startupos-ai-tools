# SSOS MCP Server

MCP server for SSOS financial management system. Allows Claude Code to interact with SSOS APIs directly from the terminal.

## Installation

```bash
cd ssos-mcp
npm install
npm run build
```

## Authentication

**Three authentication methods available:**

### 1. API Key (Recommended for automation)
Most secure and convenient for MCP usage. No password storage needed.

```bash
# First time: MCP will prompt you to choose auth method
# Select "API Key" and paste your key
```

Generate an API Key:
1. Login to SSOS web app
2. Go to Settings → API Keys
3. Click "Create API Key"
4. Copy the `sk_live_...` key (shown only once!)

### 2. OAuth 2.0 (Browser login)
Secure browser-based authentication. MCP opens your browser for login.

```bash
# First time: MCP will prompt you to choose auth method
# Select "OAuth (Browser login)"
# Browser opens → login → redirect back to MCP
```

**How it works:**
1. MCP starts local server on `http://localhost:8888`
2. Opens browser to SSOS login page
3. You login with your credentials
4. Browser redirects back with authorization code
5. MCP exchanges code for tokens
6. Tokens saved securely in system keychain

**Security:** Uses Authorization Code Flow with PKCE (Proof Key for Code Exchange) - industry standard for CLI apps.

### 3. Email & Password (Interactive)
Traditional login with email and password.

```bash
# MCP will prompt:
# Email: your-email@example.com
# Password: ****
```

Credentials are encrypted and stored in system keychain.

### 3. Environment Variables (Silent)
Set in `.mcp.json` for silent authentication:

**For API Key:**
```json
{
  "mcpServers": {
    "ssos": {
      "env": {
        "SSOS_API_URL": "https://api.finlaw.cloud",
        "SSOS_API_KEY": "sk_live_xxxxxxxxxxxxxx"
      }
    }
  }
}
```

**For Password:**
```json
{
  "mcpServers": {
    "ssos": {
      "env": {
        "SSOS_API_URL": "https://api.finlaw.cloud",
        "SSOS_EMAIL": "your-email@example.com",
        "SSOS_PASSWORD": "your-password"
      }
    }
  }
}
```

### How Authentication Works

1. **First time**: Choose method interactively
2. **Credentials saved**: System keychain (Keychain/Credential Manager/Secret Service)
3. **Next time**: Auto-login with saved credentials
4. **Token refresh**: Automatic (password method)
5. **Logout**: Use `logout` tool to clear and re-authenticate

## Configuration

Add to `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "ssos": {
      "command": "node",
      "args": ["/path/to/ssos-mcp/dist/index.js"],
      "env": {
        "SSOS_API_URL": "https://api.finlaw.cloud"
      }
    }
  }
}
```

For local development:
```json
"SSOS_API_URL": "http://localhost:4000"
```

## Available Tools

### Authentication & Account Management
- `logout` - Remove current account from saved accounts
- `get_auth_info` - Show current authentication method and user info
- `list_accounts` - List all saved accounts
- `switch_account` - Switch to a different saved account (use userId or apiKey)
- `remove_account` - Remove a saved account

### Workspace Management
- `list_workspaces` - List all accessible workspaces
- `get_current_workspace` - Get current workspace info
- `switch_workspace` - Switch to a different workspace
- `get_workspace_settings` - Get workspace settings

### Accounting (Read)
- `list_journal_entries` - List journal entries with filters
- `get_journal_entry` - Get specific journal entry by ID
- `list_accounts` - List chart of accounts
- `get_account_balance` - Get account balance for period

### Accounting (Write)
- `create_journal_entry` - Create new journal entry

### Tax Management
- `get_tax_calendar_tasks` - Get tax calendar tasks with deadlines
- `get_tax_calendar_rules` - Get available tax calendar rules  
- `get_tax_calculations` - List historical tax calculations
- `get_tax_filing_forms` - Get tax filing forms (declarations)

### Financial Reports
- `generate_trial_balance` - Generate trial balance (试算平衡表)
- `generate_income_statement` - Generate income statement (利润表)
- `generate_cash_journal` - Generate cash journal (现金日记账)
- `generate_bank_journal` - Generate bank journal (银行日记账)
- `get_general_ledger` - Get general ledger (总账)
- `get_account_balances` - Get account balances summary (科目余额表)

### API Key Management
- `create_api_key` - Create a new API key (⚠️ key shown only once!)
- `list_api_keys` - List all your API keys
- `revoke_api_key` - Revoke (delete) an API key
- `toggle_api_key` - Enable or disable an API key

## Usage Examples

From Claude Code:

```
# 财务查询
查询最近 20 条凭证
查询科目 1001 的余额
创建一笔销售收入凭证

# 税务管理
查询税务日历任务
查看税务规则
查看所有税务计算记录

# 财务报表
生成试算平衡表
生成利润表 2024-01-01 到 2024-12-31
生成现金日记账
获取总账
查询科目余额表

# 工作空间管理
列出所有工作空间
切换到工作空间 xxx

# 账号管理
查看当前认证信息
列出所有保存的账号
切换到账号 xxx
删除账号 xxx
退出登录

# API Key 管理
创建新的 API Key
列出所有 API Keys
撤销 API Key xxx
禁用 API Key xxx
```

## Multi-Account Management

SSOS MCP supports multiple accounts. You can:

1. **Add multiple accounts**: Simply authenticate with different credentials/API keys
2. **Switch between accounts**: Use `switch_account` tool
3. **View all accounts**: Use `list_accounts` tool
4. **Remove accounts**: Use `remove_account` tool

**Example workflow:**
```
# First login with API Key
SSOS_API_KEY=sk_live_account1... claude code

# Add another account (logout first, then login with different credentials)
# Use logout tool, then authenticate with new API key or password

# List all saved accounts
list_accounts

# Switch to another account
switch_account account_id

# Remove an account
remove_account account_id
```

On startup, if multiple accounts are saved, MCP will prompt you to select which account to use.

## Security

- **Credentials encrypted**: System keychain (Keychain/Credential Manager/Secret Service)
- **API Keys**: Most secure, no password storage, can be revoked anytime
- **Auto token refresh**: JWT tokens refresh automatically before expiry (password method)
- **No plaintext passwords**: Never stored in config files (unless you set env vars)
- **Workspace isolation**: All queries automatically filter by `workspace_id`

## Development

```bash
npm run watch   # Watch mode
npm run dev     # Build and run
```

## Troubleshooting

**"Authentication Required" every time?**
- Check system keychain access permissions
- Try setting `SSOS_API_KEY` or credentials in `.mcp.json` env

**Token expired?**
- Run the MCP tool, it will auto-refresh (password method)
- Or use `logout` tool to force re-login

**API Key not working?**
- Make sure key starts with `sk_live_`
- Check if key is active in SSOS web app (Settings → API Keys)
- Verify key hasn't expired

## Security Best Practices

1. **Use API Keys for automation** - More secure than storing passwords
2. **Rotate API Keys regularly** - Create new keys and revoke old ones
3. **Use workspace-scoped keys** - Limit key access to specific workspaces
4. **Set expiration dates** - Keys can auto-expire after a certain date
5. **Never commit credentials** - Add `.mcp.json` to `.gitignore` if it contains secrets
