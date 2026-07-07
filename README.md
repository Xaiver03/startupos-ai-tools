# StartupOS AI Tools

为 StartupOS 财税管理系统提供 CLI 命令行工具、MCP 服务器和 Claude Skills。

[![npm version](https://img.shields.io/npm/v/@xaiverdeng/ssos.svg)](https://www.npmjs.com/package/@xaiverdeng/ssos)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](../LICENSE)

---

## 🚀 安装

```bash
# 一键安装（推荐）
npx @xaiverdeng/ssos setup

# 仅安装 MCP 服务器
npx @xaiverdeng/ssos setup --mcp

# 仅安装 Claude Skills
npx @xaiverdeng/ssos setup --skill
```

CLI 工具自动检测并配置：Claude Code · Cursor · Windsurf · VS Code + Cline · Zed · OpenCode · Hermes · Codex · OpenClaw。

---

## 📦 MCP 服务器

安装后可使用 5 个专业 MCP 服务器：

| 服务器 | 功能 |
|--------|------|
| `accounting` | 财务报表、凭证、账簿、科目管理 |
| `hr` | 员工管理、薪资计算、合同 |
| `ai` | 智能记账、OCR 票据识别 |
| `legal` | 合同审查、催款函生成 |
| `core` | 认证、CRUD、工作区管理 |

---

## 🛠️ 项目结构

```
├── cli/            # CLI 命令行工具
├── mcp-suite/      # MCP 服务器套件
├── skills/         # Claude Skills
├── chatbot/        # AI 聊天（预留）
└── web/            # Web 界面（预留）
```

## 🛠️ 开发工作流

### 修改 MCP 服务器

```bash
cd mcp-suite/packages/<module>
# 修改 src/ 中的代码
npm run build
# 或使用 watch 模式
npm run watch
```

### 修改 CLI 命令

```bash
cd cli
# 修改 src/commands/ 中的代码
npm run build
# 或使用 watch 模式
npm run watch
```

### 测试流程

```bash
# 1. 本地测试 CLI 命令
ssos --help
ssos doctor

# 2. 测试 MCP 服务器（需要重启 Claude Code）
# 修改代码 → npm run build → 重启 Claude Code

# 3. 运行单元测试（待实现）
npm test
```

## 📦 发布流程

### 发布 CLI 到 NPM

**前置步骤**: 确保 MCP Suite 已构建并复制到 `cli/mcp-servers/`

```bash
cd cli

# 1. 确保 mcp-servers/ 目录存在且包含所有 5 个包
ls -la mcp-servers/
# 应该看到: core, accounting, hr, ai, legal, shared, accounting-utils

# 2. 更新版本号
npm version patch  # 或 minor, major

# 3. 构建
npm run build

# 4. 测试打包内容
npm pack --dry-run
# 确认输出包含 128 个文件

# 5. 发布到 NPM
npm publish

# 6. 验证发布
npm view @xaiverdeng/ssos
npx @xaiverdeng/ssos@latest doctor
```

### 同步 MCP 服务器到 CLI

当 MCP Suite 有更新时，需要重新复制到 CLI：

```bash
# 从项目根目录运行
cd ai-tools

# 1. 构建 MCP Suite
cd mcp-suite && npm run build

# 2. 删除旧的捆绑文件
rm -rf ../cli/mcp-servers

# 3. 复制所有 dist 文件到 cli/mcp-servers/
mkdir -p ../cli/mcp-servers
for pkg in core accounting hr ai legal; do
  cp -r packages/$pkg/dist/* ../cli/mcp-servers/$pkg/
done

# 复制共享库
cp -r packages/shared/dist/* ../cli/mcp-servers/shared/

# 4. 发布新版本 CLI（见上面步骤）
```

## 🏗️ 架构设计

详见 [ARCHITECTURE.md](./ARCHITECTURE.md)

## 📚 模块说明

### CLI (`cli/`)

**功能**: 服务端命令行工具，51 个命令（v2.0 三层架构）

**三层架构**:
- **CRUD 层** (90%): 统一接口管理 127 种资源
- **业务层** (8%): 会计报表、税务计算、发票操作
- **AI 层** (2%): 智能记账、OCR 识别、合规问答

**主要模块**:
- `crud` - 通用 CRUD（7 actions × 127 资源）
- `accounting` - 会计报表（7 个报表命令）
- `tax` - 税务管理（6 个税务命令）
- `invoice` - 发票操作（3 个转换命令）
- `ai-bookkeeping` - AI 智能记账（5 个 AI 命令）
- `auth` - 认证管理（3 种认证方式）
- `setup` - 一键安装 MCP + Skills
- `doctor` - 健康检查
- `users` - 用户管理（密码重置）
- `workspace` - 工作区统计

**技术栈**: TypeScript, Commander.js, PostgreSQL

### MCP Suite (`mcp-suite/`)

**功能**: Model Context Protocol 服务器，为 AI IDE 提供工具和资源

**5 个服务器**:

| 服务器 | 工具数 | 主要功能 |
|--------|--------|----------|
| `core` | 13 | 认证、工作区、通用 CRUD（127 资源）|
| `accounting` | 41 | 报表、凭证、账簿、期末处理 |
| `hr` | 10 | 员工、薪资、合同管理 |
| `ai` | 4 | 智能记账、OCR 识别 |
| `legal` | 13 | 合同审查、风险评分、催款函 |

**技术栈**: TypeScript, @modelcontextprotocol/sdk

### Skills (`skills/`)

**功能**: Claude Code 工作流技能

**包含**:
- `ssos-cli-v2.md` - CLI v2.0 命令使用说明（三层架构）

## 🔧 故障排除

### MCP 服务器未显示在 AI IDE

```bash
# 1. 检查配置文件
cat ~/.claude.json | grep startupos

# 2. 确认文件存在
ls -lh ~/.npm/_npx/*/node_modules/@xaiverdeng/ssos/mcp-servers/core/index.js

# 3. 重新安装
npx @xaiverdeng/ssos setup --mcp

# 4. 重启 AI IDE
```

### CLI 命令找不到

```bash
# 如果使用 npm link
npm unlink @xaiverdeng/ssos
cd cli && npm link

# 如果使用 npx
npx clear-npx-cache
npx @xaiverdeng/ssos@latest --help
```

### 构建失败

```bash
# 清理并重新安装
rm -rf node_modules package-lock.json
npm install
npm run build
```

### MCP 服务器路径错误

确保 `cli/mcp-servers/` 包含所有文件：
```bash
cd cli
ls -la mcp-servers/
# 应该看到: core, accounting, hr, ai, legal, shared, accounting-utils
```

## 📖 相关文档

### v2.0 文档
- [CLI 使用指南](./CLI_USAGE_GUIDE.md) - 完整的 CLI v2.0 命令参考（51 个命令）
- [v2.0 发布报告](./RELEASE_V2.0.0.md) - v2.0.0 发布完成总结
- [变更日志](./CHANGELOG.md) - 版本变更记录和迁移指南
- [架构设计](./ARCHITECTURE.md) - 三层架构详细设计

### 技术文档
- [CLI 模块文档](./cli/README.md) - CLI 源码和开发指南
- [MCP Suite 开发指南](./mcp-suite/README.md) - MCP 服务器开发
- [对齐分析](./ALIGNMENT_ANALYSIS.md) - CLI 与 MCP 功能对齐
- [覆盖率分析](./COVERAGE_ANALYSIS.md) - 功能覆盖率分析
- [认证统一分析](./AUTH_UNIFICATION_ANALYSIS.md) - 认证系统设计

## 🔗 外部链接

- [NPM 包](https://www.npmjs.com/package/@xaiverdeng/ssos)
- [GitHub 仓库](https://github.com/Xaiver03/startupos-ai-tools)
- [StartupOS 主项目](https://finlaw.cloud)
- [API 文档](https://api.finlaw.cloud)

---

**维护者**: Finlaw Team  
**许可证**: MIT
