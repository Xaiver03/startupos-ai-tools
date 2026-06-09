# SSOS MCP 服务器优化计划

**目标**: 为所有 SSOS MCP 服务器添加详细的使用说明（instructions），让 Claude 能够自动识别和使用这些工具。

---

## 📋 当前问题

1. **缺少服务器级别的使用说明** - Server 构造函数没有传入 `instructions` 选项
2. **工具数量多但无文档** - 83 个工具分布在 5 个服务器中，但没有自动加载的使用说明
3. **使用门槛高** - 用户需要手动查看 README 才能知道有哪些工具

---

## ✅ 优化方案

### 1. 为每个 MCP 服务器添加 instructions

**修改文件**:
- `packages/core/src/index.ts`
- `packages/accounting/src/index.ts`
- `packages/hr/src/index.ts`
- `packages/ai/src/index.ts`
- `packages/legal/src/index.ts`

**修改内容**:
```typescript
const server = new Server(
  {
    name: 'ssos-core',
    version: '1.0.0',
  },
  {
    capabilities: { tools: {} },
    instructions: `SSOS Core MCP 服务器 - 认证、工作空间、API 密钥管理

## 工具列表
- authenticate - 用户认证登录
- getCurrentWorkspace - 获取当前工作空间
- listWorkspaces - 列出所有工作空间
- ... (详细说明)

## 使用场景
- 用户认证和会话管理
- 工作空间切换和管理
- API 密钥生成和管理
- 通用 CRUD 操作（127 个资源）

## 认证方式
1. 通过 SSOS_API_KEY 环境变量（推荐）
2. 通过 authenticate 工具登录（用户名+密码）
`
  }
);
```

### 2. 创建 instructions 内容文件

**新建文件**:
- `packages/core/src/instructions.ts`
- `packages/accounting/src/instructions.ts`
- `packages/hr/src/instructions.ts`
- `packages/ai/src/instructions.ts`
- `packages/legal/src/instructions.ts`

**内容结构**:
```typescript
export const SERVER_INSTRUCTIONS = `
# 服务器名称

简短描述

## 工具列表

### tool_name
描述
参数: param1 (type, 必填), param2 (type, 可选)

## 使用场景

## 注意事项
`;
```

### 3. 重构工具注册方式

**当前问题**: 工具定义分散在多个文件中，难以生成统一的文档

**优化方案**:
```typescript
// tools/registry.ts
export interface ToolDefinition {
  name: string;
  description: string;
  category: string;
  inputSchema: any;
  handler: (args: any) => Promise<any>;
}

export const TOOL_REGISTRY: ToolDefinition[] = [
  {
    name: 'authenticate',
    description: '用户认证登录',
    category: 'auth',
    inputSchema: { ... },
    handler: authenticateHandler
  },
  // ...
];

// 自动生成 instructions
export function generateInstructions(tools: ToolDefinition[]): string {
  const byCategory = groupBy(tools, 'category');
  return `
## 工具列表 (${tools.length} 个)

${Object.entries(byCategory).map(([category, tools]) => `
### ${category}
${tools.map(t => `- **${t.name}**: ${t.description}`).join('\n')}
`).join('\n')}
  `;
}
```

---

## 🎯 实施步骤

### Phase 1: 核心服务器 (ssos-core)

1. ✅ 创建 `packages/core/src/instructions.ts`
2. ✅ 在 `index.ts` 中引入并传入 Server 构造函数
3. ✅ 编译测试
4. ✅ 重启 Claude Code 验证

### Phase 2: 其他服务器

1. ✅ accounting - 财务会计工具说明
2. ✅ hr - 人力资源工具说明
3. ✅ ai - AI 智能工具说明
4. ✅ legal - 法务合同工具说明

### Phase 3: 优化工具注册

1. ✅ 创建统一的 Tool Registry
2. ✅ 自动生成 instructions
3. ✅ 添加工具分类和标签

---

## 📝 Instructions 内容规范

### 必须包含的内容

1. **服务器描述** - 1-2 句话说明用途
2. **工具列表** - 每个工具的名称、描述、参数
3. **使用场景** - 何时使用这个服务器
4. **认证方式** - 如何配置 API Key
5. **注意事项** - 限流、权限、常见错误

### 内容格式

- 使用中文（因为 SSOS 是中国市场产品）
- 使用 Markdown 格式
- 保持简洁（每个服务器 < 2000 字符）
- 突出最常用的工具

---

## 🔍 验证方法

**测试步骤**:
1. 编译所有包: `npm run build`
2. 重启 Claude Code
3. 询问 Claude: "你知道有哪些 SSOS MCP 工具可以用吗？"
4. 验证 Claude 能回答出 5 个服务器及其工具列表

**预期结果**:
```
我可以使用以下 SSOS MCP 服务器:

1. ssos-core (13 个工具)
   - 认证、工作空间、API 密钥管理
   
2. ssos-accounting (41 个工具)
   - 记账凭证、科目、报表、税务、发票
   
3. ssos-hr (10 个工具)
   - 员工、薪资、劳动合同
   
4. ssos-ai (4 个工具)
   - AI 记账、OCR、合规问答
   
5. ssos-legal (13 个工具)
   - 合同管理、审查、催款函
```

---

## 📊 预期效果

**优化前**:
- ❌ Claude 不知道有哪些 SSOS 工具
- ❌ 用户需要手动告诉 Claude 工具名称
- ❌ 工具调用率低

**优化后**:
- ✅ Claude 自动知道所有工具
- ✅ Claude 能主动推荐合适的工具
- ✅ 用户体验更流畅

---

**开始实施？** 我现在就可以开始修改代码！
