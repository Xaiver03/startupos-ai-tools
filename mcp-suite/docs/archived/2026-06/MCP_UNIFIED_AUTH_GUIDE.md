# SSOS MCP 统一认证与上下文管理说明

**问题**: MCP 有 5 个服务器，如何统一认证和管理上下文？  
**创建时间**: 2026-06-03 22:30

---

## 🔐 统一认证架构

### 核心设计：一次认证，所有服务器共享

SSOS MCP Suite 采用 **共享认证层** 架构：

```
用户认证（一次）
    ↓
@ssos/mcp-shared (统一认证管理)
    ├── UnifiedAuthManager (认证管理器)
    ├── SSOSClient (API 客户端)
    └── AccountManager (账号管理)
    ↓
共享给所有 5 个 MCP 服务器
    ├── @ssos/mcp-core
    ├── @ssos/mcp-accounting
    ├── @ssos/mcp-hr
    ├── @ssos/mcp-ai
    └── @ssos/mcp-legal
```

---

## 📦 @ssos/mcp-shared 包

### 职责

**统一认证管理器** (`UnifiedAuthManager`):
- 处理 3 种认证方式：API Key、密码、OAuth
- 自动刷新 Token（密码/OAuth 方式）
- 账号管理（多账号切换）
- 持久化认证信息（使用 keytar 存储在系统 keychain）

**API 客户端** (`SSOSClient`):
- 封装所有 API 调用
- 自动添加 Authorization header
- 处理 401 自动刷新 Token
- 网络错误重试（最多 3 次）
- 管理当前工作空间（workspace）

---

## 🔑 三种认证方式

### 方式1: API Key（推荐）⭐

**特点**:
- ✅ 最简单，一次配置永久有效（直到过期）
- ✅ 适合自动化和 MCP 服务器
- ✅ 无需刷新 Token
- ✅ 可设置过期时间和权限范围

**使用方式**:
```bash
# 方法 A: 环境变量
export SSOS_API_KEY="sk_live_your_api_key_here"

# 方法 B: .mcp.json 配置
{
  "mcpServers": {
    "ssos-accounting": {
      "command": "node",
      "args": ["path/to/dist/index.js"],
      "env": {
        "SSOS_API_URL": "https://api.finlaw.cloud",
        "SSOS_API_KEY": "sk_live_your_api_key_here"  # ⭐ 统一配置
      }
    }
  }
}
```

**认证流程**:
```typescript
// UnifiedAuthManager.ts (Line 54-59)
const envApiKey = process.env.SSOS_API_KEY;
if (envApiKey) {
  console.error('Using API Key from environment variable...');
  await this.loginWithApiKey(envApiKey);
  return;
}

// 验证 API Key (Line 114-157)
const response = await fetch(`${apiBaseUrl}/api/workspaces`, {
  headers: { 'Authorization': `Bearer ${apiKey}` }
});
// 保存到 keychain
await this.accountManager.saveAccount(this.currentAuth);
```

---

### 方式2: 密码登录

**特点**:
- ✅ 用户名密码方式
- ⚠️ Token 50 分钟过期，需自动刷新
- ⚠️ 需要保存 refresh_token

**使用方式**:
```bash
# 环境变量
export SSOS_USERNAME="your@email.com"
export SSOS_PASSWORD="your_password"

# 或交互式输入
# MCP 启动时会提示输入
```

**认证流程**:
```typescript
// Login (Line 178-206)
const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
  method: 'POST',
  body: JSON.stringify({ email, password }),
});

this.currentAuth = {
  method: 'password',
  accessToken: data.access_token,
  refreshToken: data.refresh_token,
  expiresAt: Date.now() + 50 * 60 * 1000, // 50 分钟
};

// 自动刷新 Token (Line 255-281)
if (Date.now() >= this.currentAuth.expiresAt - 5 * 60 * 1000) {
  await this.refreshTokens(); // 提前 5 分钟刷新
}
```

---

### 方式3: OAuth（浏览器登录）

**特点**:
- ✅ 最安全（用户从不输入密码）
- ✅ 支持第三方登录（微信、企业微信等）
- ⚠️ Token 50 分钟过期，需自动刷新
- ⚠️ 需要浏览器交互

**使用方式**:
```bash
# 启动 MCP 服务器时选择 OAuth
# 会自动打开浏览器完成授权
```

---

## 🌍 统一上下文管理

### 1. 工作空间（Workspace）上下文

**问题**: 用户可能有多个工作空间，如何确保所有 MCP 服务器操作同一个工作空间？

**解决方案**: SSOSClient 统一管理当前工作空间

```typescript
// SSOSClient.ts (Line 10, 87-92, 94-100)
export class SSOSClient {
  private currentWorkspace: Workspace | null = null;

  // 初始化时自动加载默认工作空间
  private async loadDefaultWorkspace(): Promise<void> {
    const data = await this.apiFetch('/api/workspaces');
    if (data.data && data.data.length > 0) {
      this.currentWorkspace = data.data[0]; // 使用第一个工作空间
    }
  }

  getCurrentWorkspace(): Workspace | null {
    return this.currentWorkspace;
  }

  setCurrentWorkspace(workspace: Workspace): void {
    this.currentWorkspace = workspace;
  }

  getWorkspaceId(): string {
    if (!this.currentWorkspace) {
      throw new Error('No workspace selected');
    }
    return this.currentWorkspace.id;
  }
}
```

**所有 MCP 工具自动使用当前工作空间**:
```typescript
// 示例：banking.ts (Line 19-20)
list_bank_accounts: {
  handler: async () => {
    const params = new URLSearchParams();
    params.append('workspace_id', client.getWorkspaceId()); // ⭐ 自动获取
    
    const data = await client.apiFetch(`/api/bank-accounts?${params}`);
    return { content: [{ type: 'text', text: JSON.stringify(data) }] };
  }
}
```

---

### 2. 多账号管理

**问题**: 用户可能有多个 SSOS 账号（个人 + 公司），如何切换？

**解决方案**: AccountManager 管理多个账号

```typescript
// 账号保存格式
interface SavedAuth {
  method: 'api-key' | 'password' | 'oauth';
  userId: string;
  email: string;
  accessToken?: string;
  refreshToken?: string;
  apiKey?: string;
  expiresAt?: number;
  savedAt: number;
}

// 使用 keytar 保存到系统 keychain
const SERVICE_NAME = 'ssos-mcp';
const ACCOUNT_KEY = `account:${userId}:${method}`; // 唯一标识

// 列出所有账号 (Line 329-331)
async listAccounts(): Promise<SavedAuth[]> {
  return await this.accountManager.listAccounts();
}

// 切换账号 (Line 317-327)
async switchAccount(accountId: string): Promise<void> {
  const account = await this.accountManager.getAccountById(accountId);
  this.currentAuth = account;
  await this.validateAuth();
  console.error(`✓ Switched to ${account.email}`);
}
```

**启动时自动选择账号**:
```typescript
// UnifiedAuthManager.ts (Line 21-47)
async initialize(): Promise<void> {
  const accounts = await this.accountManager.listAccounts();

  if (accounts.length > 0) {
    // 提示用户选择账号
    const selectedAccount = await this.accountManager.promptSelectAccount();
    
    if (selectedAccount) {
      this.currentAuth = selectedAccount;
      await this.validateAuth();
      console.error(`✓ Authenticated as ${selectedAccount.email}`);
      return;
    }
  }

  // 没有保存的账号，开始新的认证流程
  await this.authFlow();
}
```

---

## 🔄 5 个 MCP 服务器如何共享认证

### 方案：每个服务器独立初始化，但共享同一套认证逻辑

```typescript
// 每个 MCP 服务器的入口文件（index.ts）
// 例如：@ssos/mcp-accounting/src/index.ts

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSOSClient } from '@ssos/mcp-shared'; // ⭐ 共享的客户端
import { createAccountingTools } from './tools/accounting.js';
import { createBankingTools } from './tools/banking.js';

// 1. 创建配置（从环境变量读取）
const config = {
  apiBaseUrl: process.env.SSOS_API_URL || 'https://api.finlaw.cloud',
  apiKey: process.env.SSOS_API_KEY,
  email: process.env.SSOS_USERNAME,
  password: process.env.SSOS_PASSWORD,
};

// 2. 创建 SSOSClient（统一认证）
const client = new SSOSClient(config);
await client.initialize(); // ⭐ 自动处理认证（API Key/密码/OAuth）

// 3. 创建工具（传入已认证的 client）
const accountingTools = createAccountingTools(client);
const bankingTools = createBankingTools(client);

// 4. 注册到 MCP Server
const server = new Server(
  { name: 'ssos-accounting', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [...accountingTools, ...bankingTools],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  // 所有工具都使用同一个已认证的 client
  const tool = allTools.find(t => t.name === request.params.name);
  return await tool.handler(request.params.arguments);
});
```

---

## 📝 实际配置示例

### 场景1: 使用单个 API Key（最简单）

```json
// ~/.claude/.mcp.json
{
  "mcpServers": {
    "ssos-core": {
      "command": "node",
      "args": ["/path/to/packages/core/dist/index.js"],
      "env": {
        "SSOS_API_URL": "https://api.finlaw.cloud",
        "SSOS_API_KEY": "sk_live_abc123xyz"  // ⭐ 统一 API Key
      }
    },
    "ssos-accounting": {
      "command": "node",
      "args": ["/path/to/packages/accounting/dist/index.js"],
      "env": {
        "SSOS_API_URL": "https://api.finlaw.cloud",
        "SSOS_API_KEY": "sk_live_abc123xyz"  // ⭐ 相同的 API Key
      }
    },
    "ssos-hr": {
      "command": "node",
      "args": ["/path/to/packages/hr/dist/index.js"],
      "env": {
        "SSOS_API_URL": "https://api.finlaw.cloud",
        "SSOS_API_KEY": "sk_live_abc123xyz"  // ⭐ 相同的 API Key
      }
    }
    // ... 其他服务器使用相同的 API Key
  }
}
```

**结果**:
- ✅ 所有 5 个服务器使用同一个 API Key 认证
- ✅ API Key 绑定到特定工作空间，所有服务器自动操作该工作空间
- ✅ 无需多次登录
- ✅ 无需担心 Token 过期

---

### 场景2: 使用密码登录（交互式）

```json
// ~/.claude/.mcp.json
{
  "mcpServers": {
    "ssos-accounting": {
      "command": "node",
      "args": ["/path/to/packages/accounting/dist/index.js"],
      "env": {
        "SSOS_API_URL": "https://api.finlaw.cloud",
        "SSOS_USERNAME": "your@email.com",      // ⭐ 用户名
        "SSOS_PASSWORD": "your_password"        // ⭐ 密码
      }
    }
    // ... 其他服务器使用相同的用户名密码
  }
}
```

**启动流程**:
1. 第一次启动 `ssos-accounting`：使用密码登录 → 保存到 keychain
2. 启动 `ssos-hr`：从 keychain 读取已保存的认证 → 无需再次登录
3. Token 过期时：自动刷新（使用 refresh_token）
4. 所有服务器共享同一套认证状态

---

### 场景3: 多账号切换

```bash
# 场景：用户有 2 个 SSOS 账号
# - personal@example.com (个人账号)
# - company@example.com (公司账号)

# 第一次使用个人账号登录
SSOS_API_KEY=sk_live_personal_key node packages/accounting/dist/index.js
# → 保存为账号 1

# 第二次使用公司账号登录
SSOS_API_KEY=sk_live_company_key node packages/accounting/dist/index.js
# → 保存为账号 2

# 第三次启动：自动提示选择账号
node packages/accounting/dist/index.js
# → 显示：
#   1. personal@example.com (api-key)
#   2. company@example.com (api-key)
#   3. Add new account
# → 用户选择账号 2
# → 所有后续操作使用公司账号
```

---

## 🎯 关键优势

### 1. 一次认证，处处可用

```
用户配置 API Key → 保存到 keychain
  ↓
启动任何 MCP 服务器
  ↓
自动从 keychain 读取认证
  ↓
无需再次登录 ✅
```

### 2. 自动工作空间管理

```
认证成功
  ↓
SSOSClient 自动加载默认工作空间
  ↓
所有 MCP 工具自动使用 client.getWorkspaceId()
  ↓
用户无需手动传递 workspace_id ✅
```

### 3. Token 自动刷新

```
API 调用
  ↓
检查 Token 是否即将过期（提前 5 分钟）
  ↓
自动刷新 Token
  ↓
重试 API 调用
  ↓
用户无感知 ✅
```

### 4. 多账号无缝切换

```
启动时检测到多个账号
  ↓
提示用户选择
  ↓
加载选中账号的认证
  ↓
切换完成，所有工具使用新账号 ✅
```

---

## 🔒 安全性

### 1. 密钥存储

使用 **keytar** 库将认证信息保存到系统 keychain：
- macOS: Keychain Access
- Windows: Credential Manager
- Linux: libsecret

**优势**:
- ✅ 加密存储，不是明文文件
- ✅ 与操作系统集成
- ✅ 跨进程共享（所有 MCP 服务器访问同一个 keychain）

### 2. Token 管理

- API Key: 长期有效，支持设置过期时间
- Access Token: 50 分钟有效，自动刷新
- Refresh Token: 用于获取新的 Access Token

### 3. 权限隔离

API Key 可以设置权限范围：
- 只读权限（查询）
- 写入权限（创建/更新）
- 管理员权限（删除）

---

## 📊 总结

### 统一认证的实现方式

| 层级 | 组件 | 职责 |
|------|------|------|
| **认证层** | `@ssos/mcp-shared` | 统一认证管理，Token 刷新，账号切换 |
| **客户端层** | `SSOSClient` | API 调用封装，工作空间管理，错误处理 |
| **工具层** | 5 个 MCP 服务器 | 使用共享的 client，自动获取 workspace_id |
| **存储层** | keytar (系统 keychain) | 加密存储认证信息，跨进程共享 |

### 用户体验

**第一次使用**:
1. 配置 API Key（或用户名密码）
2. 启动任意 MCP 服务器
3. 自动认证并保存到 keychain

**后续使用**:
1. 启动任意 MCP 服务器
2. 自动从 keychain 读取认证
3. 无需再次登录 ✅

**多账号场景**:
1. 启动时提示选择账号
2. 选择后自动切换
3. 所有 MCP 服务器使用新账号 ✅

---

**文档创建时间**: 2026-06-03 22:30  
**适用版本**: SSOS MCP Suite v1.0.0  
**相关文件**: 
- `packages/shared/src/unified-auth.ts`
- `packages/shared/src/client.ts`
- `packages/shared/src/account-manager.ts`
