#!/bin/bash
set -e

echo "🚀 Installing StartupOS AI Tools..."

# Check dependencies
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed. Aborting."; exit 1; }

# Install CLI
echo "📦 Installing CLI..."
cd cli
npm install
npm run build
npm link
cd ..

# Install MCP Suite
echo "📦 Installing MCP Suite..."
cd mcp-suite
npm install
npm run build
cd ..

# Install Skills
echo "📦 Installing Skills..."
mkdir -p ~/.claude/skills
ln -sf "$(pwd)/skills/ssos-cli.md" ~/.claude/skills/ssos-cli.md

echo "✅ Installation complete!"
echo ""
echo "Available commands:"
echo "  ssos-cli --help          # CLI usage"
echo "  /ssos-cli               # In Claude Code"
echo ""
echo "MCP servers installed at:"
echo "  $(pwd)/mcp-suite/packages/*/dist/index.js"
