# 发布 @startupos/cli 到 NPM

## 📦 发布前准备

### 1. 确保 package.json 配置正确

```json
{
  "name": "@startupos/cli",
  "version": "1.0.0",
  "description": "Startup OS CLI — AI Native command line tool",
  "type": "module",
  "bin": {
    "startupos-cli": "./dist/index.js"
  },
  "files": [
    "dist/",
    "README.md"
  ],
  "keywords": [
    "startupos",
    "startup-os",
    "创业os",
    "financial-management",
    "accounting",
    "cli",
    "ai-native"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR_USERNAME/startupos-cli.git"
  },
  "author": "Finlaw",
  "license": "MIT"
}
```

### 2. 编译

```bash
cd ai-tools/cli
npm run build
```

确认 `dist/` 目录存在且包含编译后的 `.js` 文件。

## 🚀 发布到 NPM

### 首次发布

```bash
# 1. 登录 NPM（如果还没登录）
npm login

# 2. 发布（scoped package 需要 --access public）
npm publish --access public
```

### 更新版本

```bash
# 1. 更新版本号
npm version patch   # 1.0.0 → 1.0.1
npm version minor   # 1.0.0 → 1.1.0
npm version major   # 1.0.0 → 2.0.0

# 2. 重新编译
npm run build

# 3. 发布
npm publish
```

## 🎯 用户使用方式

### 方式 1：npx（推荐，无需安装）

```bash
# AI Native 一键安装所有工具
npx @startupos/cli setup

# 仅安装 MCP 服务器
npx @startupos/cli setup --mcp

# 仅安装 Claude Skill
npx @startupos/cli setup --skill

# 健康检查
npx @startupos/cli doctor

# 认证
npx @startupos/cli auth login

# 使用 CRUD
npx @startupos/cli crud list accounts
```

### 方式 2：全局安装

```bash
# 安装
npm install -g @startupos/cli

# 使用（无需 npx 前缀）
startupos-cli setup
startupos-cli doctor
startupos-cli auth login
startupos-cli crud list accounts
```

## 📝 Landing Page 示例

在产品官网或 README 中可以这样展示：

````markdown
# Startup OS (创业OS)

AI 驱动的创业公司财务管理系统

## 🚀 一键安装 AI 工具

```bash
npx @startupos/cli setup
```

这条命令会自动安装：
- ✅ 5 个 MCP 服务器（81 个 AI 工具）
- ✅ Claude Code Skill
- ✅ 自动配置到 `~/.claude.json`

### 支持的 AI IDE

- Claude Code（官方支持）
- Cursor（自动检测配置文件）
- Windsurf（自动检测配置文件）
- VS Code + Cline（自动检测配置文件）

### 验证安装

```bash
npx @startupos/cli doctor
```

### 认证

```bash
npx @startupos/cli auth login
```

### 开始使用

```bash
# 查看所有可用资源类型（127 种）
npx @startupos/cli crud list-types

# 列出账户
npx @startupos/cli crud list accounts

# AI 记账
npx @startupos/cli ai-bookkeeping scan "购买办公用品500元"
```

## 📚 文档

- [完整文档](https://docs.startupos.com)
- [API 参考](https://api-docs.startupos.com)
- [GitHub](https://github.com/YOUR_USERNAME/startupos)

## 🎯 AI Native 特性

- 🤖 自动检测 AI IDE 配置路径
- 🔧 智能安装 MCP 服务器
- 🎯 一键部署 Claude Skills
- 💡 自然语言命令支持
- 🔄 自动更新检查
````

## 🔍 检查发布前清单

- [ ] `npm run build` 成功
- [ ] `dist/` 目录存在
- [ ] `package.json` 中的 `name`、`version`、`description` 正确
- [ ] `bin` 字段指向 `dist/index.js`
- [ ] `files` 字段包含 `dist/`
- [ ] 已添加 `keywords` 便于搜索
- [ ] 已添加 `repository` 链接
- [ ] README.md 包含使用说明
- [ ] 已测试 `npx @startupos/cli --help`

## 📊 发布后验证

```bash
# 查看包信息
npm view @startupos/cli

# 测试安装
npx @startupos/cli@latest --version

# 测试功能
npx @startupos/cli setup --help
npx @startupos/cli doctor
```

## 🌟 后续推广

1. **在 README.md 顶部添加 badge**:
   ```markdown
   [![npm version](https://badge.fury.io/js/@startupos%2Fcli.svg)](https://www.npmjs.com/package/@startupos/cli)
   [![downloads](https://img.shields.io/npm/dm/@startupos/cli.svg)](https://www.npmjs.com/package/@startupos/cli)
   ```

2. **提交到 awesome lists**:
   - awesome-cli
   - awesome-financial-tools
   - awesome-ai-tools

3. **社交媒体分享**:
   ```
   🚀 Startup OS CLI 发布了！
   
   一行命令安装所有 AI 工具：
   npx @startupos/cli setup
   
   ✅ 5 个 MCP 服务器（81 个工具）
   ✅ Claude Skill 自动配置
   ✅ 支持 127 种资源 CRUD
   
   #AI #CLI #FinTech #创业
   ```
