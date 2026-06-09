#!/bin/bash
# 创建独立 Git 仓库的脚本

set -e

echo "🚀 SSOS AI Tools - 拆分为独立 Git 仓库"
echo "========================================"

# 定义路径
SSOS_ROOT="/Users/rocalight/Desktop/All in one Data/01_PROJECTS/ssos"
AI_TOOLS="$SSOS_ROOT/ai-tools"
MCP_DIR="$AI_TOOLS/mcp-suite"
CLI_DIR="$AI_TOOLS/cli"

# 步骤 1: 为 MCP Suite 创建独立仓库
echo ""
echo "📦 Step 1: 创建 ssos-mcp-suite 独立仓库"
echo "----------------------------------------"

cd "$MCP_DIR"

# 检查是否已经是 Git 仓库
if [ ! -d ".git" ]; then
  echo "初始化 Git 仓库..."
  git init

  # 创建 .gitignore
  cat > .gitignore << 'EOF'
node_modules/
dist/
*.log
.DS_Store
.env
.env.local
*.tsbuildinfo
EOF

  # 首次提交
  git add .
  git commit -m "chore: initial commit - SSOS MCP Suite

- 5 MCP servers (core, accounting, hr, ai, legal)
- 81 tools total
- MCP SDK 1.29.0 with instructions support
- Modular monorepo structure with workspaces"

  echo "✅ Git 仓库已初始化"
else
  echo "⚠️ 已存在 .git 目录，跳过初始化"
fi

# 步骤 2: 为 CLI 创建独立仓库
echo ""
echo "🔧 Step 2: 创建 ssos-cli 独立仓库"
echo "----------------------------------------"

cd "$CLI_DIR"

# 检查是否已经是 Git 仓库
if [ ! -d ".git" ]; then
  echo "初始化 Git 仓库..."
  git init

  # 创建 .gitignore
  cat > .gitignore << 'EOF'
node_modules/
dist/
*.log
.DS_Store
.env
.env.local
*.tsbuildinfo
EOF

  # 首次提交
  git add .
  git commit -m "chore: initial commit - SSOS CLI

- Universal CRUD commands (127 resources)
- Business logic commands (accounting, tax, invoice)
- Unified authentication (API Key, Email+Password, JWT)
- Direct database and API access"

  echo "✅ Git 仓库已初始化"
else
  echo "⚠️ 已存在 .git 目录，跳过初始化"
fi

# 步骤 3: 从主仓库中移除这两个目录
echo ""
echo "🗑️ Step 3: 从主仓库中移除 ai-tools/ 的 Git 跟踪"
echo "----------------------------------------"

cd "$SSOS_ROOT"

# 从主仓库的 Git 跟踪中移除（但保留文件）
git rm --cached -r ai-tools/mcp-suite || echo "已移除或不在跟踪中"
git rm --cached -r ai-tools/cli || echo "已移除或不在跟踪中"

# 更新主仓库的 .gitignore
echo ""
echo "# AI Tools - managed as submodules" >> .gitignore
echo "ai-tools/mcp-suite/" >> .gitignore
echo "ai-tools/cli/" >> .gitignore

echo "✅ 已从主仓库移除 AI Tools 的跟踪"

# 步骤 4: 添加为 Submodules
echo ""
echo "🔗 Step 4: 添加为 Git Submodules"
echo "----------------------------------------"
echo ""
echo "⚠️ 注意: 需要先将独立仓库推送到 GitHub!"
echo ""
echo "请执行以下步骤:"
echo ""
echo "1. 在 GitHub 上创建两个仓库:"
echo "   - ssos-mcp-suite"
echo "   - ssos-cli"
echo ""
echo "2. 推送独立仓库到 GitHub:"
echo ""
echo "   cd $MCP_DIR"
echo "   git remote add origin git@github.com:YOUR_USERNAME/ssos-mcp-suite.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "   cd $CLI_DIR"
echo "   git remote add origin git@github.com:YOUR_USERNAME/ssos-cli.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. 在主仓库中添加 Submodules:"
echo ""
echo "   cd $SSOS_ROOT"
echo "   git submodule add git@github.com:YOUR_USERNAME/ssos-mcp-suite.git ai-tools/mcp-suite"
echo "   git submodule add git@github.com:YOUR_USERNAME/ssos-cli.git ai-tools/cli"
echo "   git commit -m \"chore: add AI tools as submodules\""
echo ""
echo "✅ 准备工作完成！请按照上述步骤继续操作。"
