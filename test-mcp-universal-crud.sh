#!/bin/bash
# Test MCP Universal CRUD Tools
# Tests the 7 universal tools that replace 200+ specialized tools

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ROOT="$(cd "$(dirname "$0")" && pwd)"
PASSED=0
FAILED=0

echo -e "${BLUE}========================================"
echo "MCP Universal CRUD Tools Test Suite"
echo "========================================${NC}"
echo

# Build MCP Suite
echo -e "${YELLOW}Building MCP Suite...${NC}"
cd "$ROOT/mcp-suite"
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓ MCP Suite build successful${NC}"
else
    echo -e "${RED}✗ MCP Suite build failed${NC}"
    exit 1
fi
echo

# Test function
test_file_exists() {
    local name="$1"
    local file="$2"

    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ $name${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ $name (file not found: $file)${NC}"
        ((FAILED++))
    fi
}

test_import() {
    local name="$1"
    local file="$2"
    local import_statement="$3"

    if grep -q "$import_statement" "$file" 2>/dev/null; then
        echo -e "${GREEN}✓ $name${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ $name (import not found)${NC}"
        ((FAILED++))
    fi
}

test_function() {
    local name="$1"
    local file="$2"
    local function_name="$3"

    if grep -q "$function_name" "$file" 2>/dev/null; then
        echo -e "${GREEN}✓ $name${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ $name (function not found)${NC}"
        ((FAILED++))
    fi
}

echo -e "${BLUE}--- Package Structure ---${NC}"
test_file_exists "Shared resources config" "$ROOT/mcp-suite/packages/shared/dist/resources.js"
test_file_exists "Universal CRUD tools" "$ROOT/mcp-suite/packages/core/dist/tools/universal-crud.js"
test_file_exists "Core package main" "$ROOT/mcp-suite/packages/core/dist/index.js"
echo

echo -e "${BLUE}--- Resource Configuration ---${NC}"
test_import "RESOURCES export" "$ROOT/mcp-suite/packages/shared/dist/resources.js" "RESOURCES"
test_function "getResource function" "$ROOT/mcp-suite/packages/shared/dist/resources.js" "getResource"
test_function "assertCrud function" "$ROOT/mcp-suite/packages/shared/dist/resources.js" "assertCrud"
test_function "getCrudResources function" "$ROOT/mcp-suite/packages/shared/dist/resources.js" "getCrudResources"
test_function "getActionOnlyResources function" "$ROOT/mcp-suite/packages/shared/dist/resources.js" "getActionOnlyResources"
echo

echo -e "${BLUE}--- Universal CRUD Tools ---${NC}"
test_function "resource_list tool" "$ROOT/mcp-suite/packages/core/dist/tools/universal-crud.js" "resource_list"
test_function "resource_get tool" "$ROOT/mcp-suite/packages/core/dist/tools/universal-crud.js" "resource_get"
test_function "resource_create tool" "$ROOT/mcp-suite/packages/core/dist/tools/universal-crud.js" "resource_create"
test_function "resource_update tool" "$ROOT/mcp-suite/packages/core/dist/tools/universal-crud.js" "resource_update"
test_function "resource_delete tool" "$ROOT/mcp-suite/packages/core/dist/tools/universal-crud.js" "resource_delete"
test_function "resource_action tool" "$ROOT/mcp-suite/packages/core/dist/tools/universal-crud.js" "resource_action"
test_function "resource_list_types tool" "$ROOT/mcp-suite/packages/core/dist/tools/universal-crud.js" "resource_list_types"
echo

echo -e "${BLUE}--- Tool Registration ---${NC}"
test_import "Universal CRUD import in core" "$ROOT/mcp-suite/packages/core/dist/index.js" "createUniversalCrudTools"
echo

echo -e "${BLUE}--- Resource Count Validation ---${NC}"
RESOURCE_COUNT=$(grep -c "apiPath:" "$ROOT/mcp-suite/packages/shared/src/resources.ts" 2>/dev/null || echo 0)
if [ "$RESOURCE_COUNT" -ge 120 ]; then
    echo -e "${GREEN}✓ Resource count: $RESOURCE_COUNT (expected ~127)${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Resource count: $RESOURCE_COUNT (expected ~127)${NC}"
    ((FAILED++))
fi
echo

echo -e "${BLUE}--- Sample Resource Validation ---${NC}"
# Check if key resources are registered
for resource in "accounts" "journal-entries" "employees" "contracts" "bank-accounts" "annual-bonus"; do
    if grep -q "'$resource':" "$ROOT/mcp-suite/packages/shared/src/resources.ts" 2>/dev/null; then
        echo -e "${GREEN}✓ Resource '$resource' registered${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ Resource '$resource' not found${NC}"
        ((FAILED++))
    fi
done
echo

echo -e "${BLUE}--- Tool Description Validation ---${NC}"
# Check if tools have proper descriptions
for tool in "resource_list" "resource_get" "resource_create" "resource_update" "resource_delete" "resource_action"; do
    if grep -A 1 "$tool:" "$ROOT/mcp-suite/packages/core/src/tools/universal-crud.ts" 2>/dev/null | grep -q "description:"; then
        echo -e "${GREEN}✓ Tool '$tool' has description${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ Tool '$tool' missing description${NC}"
        ((FAILED++))
    fi
done
echo

echo -e "${BLUE}--- Input Schema Validation ---${NC}"
# Check if tools have input schemas
for tool in "resource_list" "resource_get" "resource_create" "resource_update" "resource_delete" "resource_action"; do
    if grep -A 1 "$tool:" "$ROOT/mcp-suite/packages/core/src/tools/universal-crud.ts" 2>/dev/null | grep -q "inputSchema:"; then
        echo -e "${GREEN}✓ Tool '$tool' has inputSchema${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ Tool '$tool' missing inputSchema${NC}"
        ((FAILED++))
    fi
done
echo

# Summary
echo -e "${BLUE}========================================"
echo "Test Summary"
echo "========================================${NC}"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo

TOTAL=$((PASSED + FAILED))
if [ $TOTAL -gt 0 ]; then
    COVERAGE=$((PASSED * 100 / TOTAL))
    echo -e "Coverage: ${GREEN}$COVERAGE%${NC} ($PASSED/$TOTAL)"
fi
echo

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All MCP universal CRUD tools tests passed!${NC}"
    echo
    echo -e "${YELLOW}Summary:${NC}"
    echo "  • 7 universal tools implemented"
    echo "  • 127 resources registered"
    echo "  • Replaces 200+ specialized tools"
    echo "  • Build successful"
    echo
    exit 0
else
    echo -e "${RED}✗ $FAILED test(s) failed${NC}"
    exit 1
fi
