# Git Submodules 方案 - SSOS AI Tools 独立仓库管理

**目标**: 将 `ai-tools/mcp-suite` 和 `ai-tools/cli` 拆分为独立的 GitHub 仓库，同时保持在主仓库中的引用。

---

## 🎯 方案：Git Submodules

### 什么是 Git Submodules？

Git Submodules 允许你在一个 Git 仓库中引用另一个 Git 仓库，解决"仓库嵌套"的问题。

**优点**:
- ✅ 每个工具有独立的 Git 历史
- ✅ 可以独立发布版本和 Release
- ✅ 不同团队可以独立维护
- ✅ 主仓库中只存储引用（commit hash），不重复存储代码
- ✅ 支持独立的 CI/CD 流程

**缺点**:
- ⚠️ 需要额外的命令来更新 submodules
- ⚠️ 克隆主仓库时需要 `--recurse-submodules` 参数

---

## 📊 架构对比

### 🔴 当前架构（有问题）

```
ssos/                          # Git 仓库
├── .git/
├── ai-tools/
│   ├── mcp-suite/            # 想要独立管理，但被主仓库跟踪
│   │   ├── packages/
│   │   └── README.md
│   └── cli/                  # 想要独立管理，但被主仓库跟踪
│       ├── src/
│       └── README.md
```

**问题**: `mcp-suite` 和 `cli` 被主仓库跟踪，无法独立发布到 GitHub。

---

### ✅ 目标架构（Submodules）

```
ssos/                          # 主仓库 (ssos)
├── .git/
├── .gitmodules               # Submodule 配置文件
├── src/
├── backend/
└── ai-tools/
    ├── mcp-suite/  → Submodule → github.com/YOUR_USERNAME/ssos-mcp-suite
    │   ├── .git/             # 独立的 Git 仓库
    │   └── packages/
    └── cli/        → Submodule → github.com/YOUR_USERNAME/ssos-cli
        ├── .git/             # 独立的 Git 仓库
        └── src/
```

**效果**:
- `ssos-mcp-suite` 有自己的 GitHub 仓库
- `ssos-cli` 有自己的 GitHub 仓库
- 主仓库 `ssos` 通过 submodule 引用它们

---

## 🚀 实施步骤

### Phase 1: 创建独立仓库

#### 1.1 在 GitHub 上创建仓库

登录 GitHub，创建两个新仓库：

1. **仓库名**: `ssos-mcp-suite`
   - Description: "SSOS MCP Suite - 5 specialized MCP servers for financial management"
   - Public/Private: 根据需求选择
   - 不要勾选 "Initialize with README"（因为我们已有代码）

2. **仓库名**: `ssos-cli`
   - Description: "SSOS CLI - Command-line tool for SSOS financial management system"
   - Public/Private: 根据需求选择
   - 不要勾选 "Initialize with README"

#### 1.2 初始化本地 Git 仓库

运行脚本：

```bash
cd ~/Desktop/All\ in\ one\ Data/01_PROJECTS/ssos/ai-tools
chmod +x split-to-submodules.sh
./split-to-submodules.sh
```

或者手动执行：

```bash
# MCP Suite
cd ~/Desktop/All\ in\ one\ Data/01_PROJECTS/ssos/ai-tools/mcp-suite
git init
git add .
git commit -m "chore: initial commit - SSOS MCP Suite"

# CLI
cd ~/Desktop/All\ in\ one\ Data/01_PROJECTS/ssos/ai-tools/cli
git init
git add .
git commit -m "chore: initial commit - SSOS CLI"
```

#### 1.3 推送到 GitHub

```bash
# MCP Suite
cd ~/Desktop/All\ in\ one\ Data/01_PROJECTS/ssos/ai-tools/mcp-suite
git remote add origin git@github.com:YOUR_USERNAME/ssos-mcp-suite.git
git branch -M main
git push -u origin main

# CLI
cd ~/Desktop/All\ in\ one\ Data/01_PROJECTS/ssos/ai-tools/cli
git remote add origin git@github.com:YOUR_USERNAME/ssos-cli.git
git branch -M main
git push -u origin main
```

**替换 `YOUR_USERNAME`** 为你的 GitHub 用户名！

---

### Phase 2: 从主仓库移除并添加为 Submodules

#### 2.1 从主仓库移除跟踪

```bash
cd ~/Desktop/All\ in\ one\ Data/01_PROJECTS/ssos

# 从 Git 跟踪中移除（但保留本地文件）
git rm --cached -r ai-tools/mcp-suite
git rm --cached -r ai-tools/cli

# 提交移除
git commit -m "chore: remove ai-tools from main repo (preparing for submodules)"
```

#### 2.2 删除本地目录（备份后）

```bash
# 备份（可选，如果不放心）
mv ai-tools/mcp-suite /tmp/mcp-suite-backup
mv ai-tools/cli /tmp/cli-backup
```

#### 2.3 添加为 Submodules

```bash
cd ~/Desktop/All\ in\ one\ Data/01_PROJECTS/ssos

# 添加 MCP Suite 作为 submodule
git submodule add git@github.com:YOUR_USERNAME/ssos-mcp-suite.git ai-tools/mcp-suite

# 添加 CLI 作为 submodule
git submodule add git@github.com:YOUR_USERNAME/ssos-cli.git ai-tools/cli

# 提交 submodule 配置
git commit -m "chore: add ai-tools as git submodules

- ssos-mcp-suite: 5 MCP servers (core, accounting, hr, ai, legal)
- ssos-cli: CLI tool with CRUD and business logic commands"
```

#### 2.4 推送到主仓库

```bash
git push origin main
```

---

## 📖 日常使用

### 克隆主仓库（包含 submodules）

```bash
# 新克隆时，同时拉取 submodules
git clone --recurse-submodules git@github.com:YOUR_USERNAME/ssos.git

# 或者先克隆，再初始化 submodules
git clone git@github.com:YOUR_USERNAME/ssos.git
cd ssos
git submodule init
git submodule update
```

### 更新 Submodules

```bash
cd ~/Desktop/All\ in\ one\ Data/01_PROJECTS/ssos

# 更新所有 submodules 到最新版本
git submodule update --remote

# 或者进入 submodule 目录手动拉取
cd ai-tools/mcp-suite
git pull origin main

cd ../cli
git pull origin main
```

### 在 Submodule 中工作

```bash
# 进入 submodule 目录
cd ai-tools/mcp-suite

# 创建分支、修改代码、提交
git checkout -b feature/new-tool
# ... 修改代码 ...
git add .
git commit -m "feat: add new tool"
git push origin feature/new-tool

# 回到主仓库
cd ../..

# 主仓库会检测到 submodule 的 commit hash 变化
git status
# Changes not staged for commit:
#   modified:   ai-tools/mcp-suite (new commits)

# 提交 submodule 的新 commit hash
git add ai-tools/mcp-suite
git commit -m "chore(mcp-suite): update to latest version"
git push
```

### 常用命令速查

```bash
# 查看 submodules 状态
git submodule status

# 更新所有 submodules
git submodule update --remote --merge

# 在所有 submodules 中执行命令
git submodule foreach 'git pull origin main'

# 删除 submodule
git submodule deinit ai-tools/mcp-suite
git rm ai-tools/mcp-suite
```

---

## 🎨 最佳实践

### 1. README 和文档

每个独立仓库都应该有自己的 README：

**ssos-mcp-suite/README.md**:
```markdown
# SSOS MCP Suite

5 specialized MCP servers for SSOS financial management platform.

## Servers
- ssos-core (13 tools)
- ssos-accounting (41 tools)
- ssos-hr (10 tools)
- ssos-ai (4 tools)
- ssos-legal (13 tools)

## Installation
...
```

**ssos-cli/README.md**:
```markdown
# SSOS CLI

Command-line tool for SSOS financial management system.

## Features
- Universal CRUD for 127 resources
- Business logic commands
- Authentication management

## Installation
...
```

### 2. 版本管理

每个独立仓库可以有自己的版本号和 Release：

```bash
# 在 MCP Suite 中
cd ai-tools/mcp-suite
git tag v1.0.0
git push origin v1.0.0

# 在 GitHub 上创建 Release
gh release create v1.0.0 --title "v1.0.0" --notes "Initial release"
```

### 3. CI/CD

每个独立仓库可以有自己的 GitHub Actions：

**ssos-mcp-suite/.github/workflows/ci.yml**:
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm test
```

### 4. NPM 发布

如果要发布到 NPM，每个仓库都可以独立发布：

```bash
# 在 MCP Suite 中
cd ai-tools/mcp-suite
npm publish --access public

# 在 CLI 中
cd ai-tools/cli
npm publish --access public
```

---

## 🔄 迁移检查清单

- [ ] 1. 在 GitHub 创建 `ssos-mcp-suite` 仓库
- [ ] 2. 在 GitHub 创建 `ssos-cli` 仓库
- [ ] 3. 本地初始化 `mcp-suite` Git 仓库
- [ ] 4. 本地初始化 `cli` Git 仓库
- [ ] 5. 推送 `mcp-suite` 到 GitHub
- [ ] 6. 推送 `cli` 到 GitHub
- [ ] 7. 从主仓库移除 `ai-tools/*` 的 Git 跟踪
- [ ] 8. 删除主仓库中的 `ai-tools/mcp-suite` 和 `ai-tools/cli` 目录
- [ ] 9. 添加 `mcp-suite` 为 submodule
- [ ] 10. 添加 `cli` 为 submodule
- [ ] 11. 提交主仓库的 `.gitmodules` 变更
- [ ] 12. 推送主仓库到 GitHub
- [ ] 13. 测试克隆主仓库（with `--recurse-submodules`）
- [ ] 14. 更新 README 和文档，说明 submodules 的使用

---

## 📚 参考资料

- [Git Submodules 官方文档](https://git-scm.com/book/en/v2/Git-Tools-Submodules)
- [GitHub Submodules 指南](https://github.blog/2016-02-01-working-with-submodules/)

---

## ❓ 常见问题

### Q1: 为什么不用 Monorepo（单一仓库）？

**A**: Monorepo 适合所有代码都紧密相关的项目。但 MCP Suite 和 CLI 是独立的工具，有不同的:
- 发布周期
- 版本号
- 依赖关系
- 维护团队

独立仓库更灵活。

### Q2: 为什么不用 Git Subtree？

**A**: Git Subtree 会把子仓库的代码直接合并到主仓库，历史记录会混在一起。Submodules 保持独立性更好。

### Q3: Submodule 的 commit hash 总是过时怎么办？

**A**: 这是正常的。主仓库存储的是 submodule 的特定 commit hash。当 submodule 更新时，需要在主仓库中提交新的 commit hash：

```bash
cd ai-tools/mcp-suite
git pull origin main
cd ../..
git add ai-tools/mcp-suite
git commit -m "chore: update mcp-suite to latest"
```

### Q4: 能不能让主仓库自动跟踪 submodule 的最新版本？

**A**: 不建议。明确指定 commit hash 保证了可重现性。如果真的需要，可以用 `git submodule update --remote` 手动更新。

---

**准备好了吗？运行 `./split-to-submodules.sh` 开始迁移！** 🚀
