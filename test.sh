#!/bin/bash
# Test all AI tools after update

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ROOT="$(cd "$(dirname "$0")" && pwd)"
PASSED=0
FAILED=0

run_test() {
    local name="$1"
    local cmd="$2"
    echo -e "${YELLOW}Testing: $name${NC}"
    if eval "$cmd" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ $name${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ $name${NC}"
        ((FAILED++))
    fi
    echo
}

echo "========================================"
echo "SSOS AI Tools Test Suite"
echo "========================================"
echo

# Test CLI
echo "--- CLI ---"
cd "$ROOT/cli"
run_test "CLI build" "npm run build"
run_test "CLI help" "node dist/index.js --help"
run_test "CLI info" "node dist/index.js info"

# Test MCP (legacy)
echo "--- MCP (legacy) ---"
cd "$ROOT/mcp"
run_test "MCP build" "npm run build"
run_test "MCP dist exists" "test -f dist/index.js"

# Test MCP Suite
echo "--- MCP Suite ---"
cd "$ROOT/mcp-suite"
run_test "MCP Suite build" "npm run build"
run_test "MCP Core dist" "test -f packages/core/dist/index.js"
run_test "MCP Accounting dist" "test -f packages/accounting/dist/index.js"
run_test "MCP HR dist" "test -f packages/hr/dist/index.js"
run_test "MCP AI dist" "test -f packages/ai/dist/index.js"
run_test "MCP Legal dist" "test -f packages/legal/dist/index.js"
run_test "MCP Shared dist" "test -f packages/shared/dist/index.js"

# Test Skills
echo "--- Skills ---"
run_test "Skills directory" "test -d '$ROOT/skills'"
run_test "organize-finances skill" "test -f '$ROOT/skills/organize-finances.md'"

echo "========================================"
echo "Results: $PASSED passed, $FAILED failed"
echo "========================================"

if [ $FAILED -gt 0 ]; then
    exit 1
fi
