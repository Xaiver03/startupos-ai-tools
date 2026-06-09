# SSOS AI Tools 认证方式统一性分析

**分析时间**: 2026-06-08  
**目的**: 检查 CLI 和 MCP 的认证方式是否统一

---

## 📊 认证方式对比

### CLI (ssos-cli)

**存储位置**: `~/.ssos-cli/auth.json`

**支持的认证方式** (3种):
1. **API Key** - `SSOS_API_KEY` 环境变量或 `--api-key` 参数
2. **Email + Password** - `--email` + `--password` 参数
3. **JWT Token** - `SSOS_ACCESS_TOKEN` 环境变量或 `--token` 参数

**认证优先级**:
```
环境变量 > 保存的凭证文件 (~/.ssos-cli/auth.json)
```

**CLI 使用的环境变量**:
- `SSOS_API_KEY` 或 `API_TOKEN` - API Key 认证
- `SSOS_ACCESS_TOKEN` - JWT Token 认证  
- `SSOS_WORKSPACE_ID` - 工作空间 ID
- `API_URL` - API 基础 URL

**代码位置**:
- `cli/src/lib/api-client.ts` - loadAuth()
- `cli/src/commands/auth.ts` - 认证命令

---

### MCP (ssos-mcp-*)

**存储位置**: macOS Keychain (通过 keytar)

**支持的认证方式** (3种):
1. **API Key** - `SSOS_API_KEY` 环境变量或交互式输入
2. **Email + Password** - `SSOS_EMAIL` + `SSOS_PASSWORD` 环境变量或交互式输入
3. **OAuth** - 浏览器授权流程

**认证优先级**:
```
环境变量 (SSOS_API_KEY) > 环境变量 (SSOS_EMAIL + SSOS_PASSWORD) > 已保存账户 (Keychain) > 交互式登录
```

**MCP 使用的环境变量**:
- `SSOS_API_KEY` - API Key 认证（优先）
- `SSOS_EMAIL` + `SSOS_PASSWORD` - Email/密码认证
- `SSOS_API_URL` - API 基础 URL

**代码位置**:
- `mcp-suite/packages/shared/src/unified-auth.ts` - UnifiedAuthManager
- `mcp-suite/packages/core/src/index.ts` - 初始化

---

## ✅ 统一性评估

### 共同点

1. **都支持 API Key 认证** ✅
   - CLI: `SSOS_API_KEY` 或 `API_TOKEN`
   - MCP: `SSOS_API_KEY`

2. **都支持 Email + Password 认证** ✅
   - CLI: `--email` + `--password` 参数
   - MCP: `SSOS_EMAIL` + `SSOS_PASSWORD` 环境变量

3. **API Key 优先级最高** ✅
   - 两者都优先使用环境变量中的 API Key

4. **API URL 可配置** ✅
   - CLI: `API_URL`
   - MCP: `SSOS_API_URL`

### 差异点

| 特性 | CLI | MCP | 是否需要统一 |
|------|-----|-----|-------------|
| **存储位置** | `~/.ssos-cli/auth.json` | macOS Keychain | ✅ **需要** |
| **JWT Token 支持** | ✅ 支持 (`SSOS_ACCESS_TOKEN`) | ❌ 不支持 | ⚠️ 可选 |
| **OAuth 支持** | ❌ 不支持 | ✅ 支持 | ⚠️ 可选 |
| **环境变量命名** | `API_URL`, `API_TOKEN` | `SSOS_API_URL` | ✅ **需要** |
| **交互式登录** | ❌ 仅命令行参数 | ✅ inquirer 交互式 | ⚠️ 可选 |
| **多账户管理** | ❌ 单一账户 | ✅ AccountManager | ⚠️ 可选 |

---

## 🔴 需要统一的问题

### 1. 环境变量命名不统一

**问题**: CLI 使用 `API_URL`，MCP 使用 `SSOS_API_URL`

**建议**: 统一为 `SSOS_API_URL` (带命名空间，避免冲突)

**修改**:
```typescript
// cli/src/lib/api-client.ts
export function getApiUrl(): string {
  return process.env.SSOS_API_URL || process.env.API_URL || 'https://api.finlaw.cloud';
}
```

### 2. 凭证存储位置不统一

**问题**: 
- CLI 使用文件 `~/.ssos-cli/auth.json`
- MCP 使用 macOS Keychain

**影响**: 用户在 CLI 登录后，MCP 无法自动使用相同凭证

**建议**: 
- **方案 A** (推荐): 两者都使用 Keychain 存储敏感凭证
- **方案 B**: 两者都使用文件存储（需加密）
- **方案 C**: 保持现状，依赖环境变量共享认证

**推荐方案 A 的原因**:
- ✅ Keychain 更安全（系统级加密）
- ✅ 跨应用共享凭证
- ✅ 支持多账户管理
- ❌ 但依赖 `keytar`（需要 native 模块）

### 3. API Token 命名不统一

**问题**: CLI 支持 `API_TOKEN` 和 `SSOS_API_KEY`，MCP 仅支持 `SSOS_API_KEY`

**建议**: 统一为 `SSOS_API_KEY`

---

## 🎯 统一化建议

### Phase 1: 环境变量统一 (高优先级)

**目标**: 确保 CLI 和 MCP 使用相同的环境变量名称

**修改清单**:
1. CLI 支持 `SSOS_API_URL` (向后兼容 `API_URL`)
2. CLI 移除 `API_TOKEN`，仅使用 `SSOS_API_KEY`
3. 文档更新：所有示例统一使用 `SSOS_*` 前缀

**代码修改**:
```typescript
// cli/src/lib/api-client.ts
export async function loadAuth(): Promise<SavedAuth | null> {
  // 统一使用 SSOS_API_KEY
  const envApiKey = process.env.SSOS_API_KEY;  // 移除 API_TOKEN
  
  const envJwt = process.env.SSOS_ACCESS_TOKEN;
  // ...
}

export function getApiUrl(): string {
  // 优先使用 SSOS_API_URL，向后兼容 API_URL
  return process.env.SSOS_API_URL || process.env.API_URL || 'https://api.finlaw.cloud';
}
```

### Phase 2: 凭证存储统一 (中优先级)

**目标**: CLI 也使用 Keychain 存储凭证

**优点**:
- ✅ 安全性提升
- ✅ CLI 登录后，MCP 自动可用
- ✅ 支持多账户切换

**缺点**:
- ❌ 需要引入 `keytar` 依赖（native 模块）
- ❌ Windows/Linux 上的 Keychain 支持不同

**实施步骤**:
1. CLI 添加 `keytar` 依赖
2. 创建共享的 `AuthManager`（在 `@ssos/cli-shared` 包中）
3. CLI 和 MCP 都使用相同的 `AuthManager`

### Phase 3: 认证方式完全统一 (低优先级)

**目标**: CLI 和 MCP 支持相同的所有认证方式

**补充功能**:
- MCP 添加 JWT Token 支持
- CLI 添加 OAuth 支持
- CLI 添加交互式登录（使用 inquirer）

---

## 📝 当前状态总结

### ✅ 已统一
- API Key 认证方式
- Email + Password 认证方式
- API Key 优先级最高

### ⚠️ 部分统一
- 环境变量命名（CLI 使用 `API_URL`，MCP 使用 `SSOS_API_URL`）
- API Token 变量名（CLI 有 `API_TOKEN` 别名）

### ❌ 未统一
- 凭证存储位置（文件 vs Keychain）
- 支持的认证方式（JWT vs OAuth）
- 多账户管理（CLI 不支持）

---

## 🚀 推荐实施方案

### 立即执行（影响小，价值高）

1. **统一环境变量命名**
   - CLI 支持 `SSOS_API_URL`（向后兼容）
   - 移除 `API_TOKEN` 别名
   - 更新所有文档

### 中期执行（需要重构）

2. **CLI 使用 Keychain**
   - 添加 keytar 依赖
   - 迁移现有的 `~/.ssos-cli/auth.json` 到 Keychain
   - 实现多账户管理

### 长期规划（功能增强）

3. **认证方式补齐**
   - MCP 添加 JWT Token 支持
   - CLI 添加 OAuth 支持

---

## 结论

**当前统一度**: ⭐⭐⭐⭐☆ (4/5)

**核心认证方式（API Key）已统一** ✅  
**环境变量命名需要微调** ⚠️  
**凭证存储可以进一步统一** 💡

**建议**: 先完成 Phase 1（环境变量统一），这是成本最低、收益最高的优化。Phase 2（Keychain 统一）可以根据需求决定是否实施。
