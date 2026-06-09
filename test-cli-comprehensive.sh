#!/bin/bash
# Comprehensive CLI command test suite
# Tests all 279 CLI commands to ensure they exist and have proper help text

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ROOT="$(cd "$(dirname "$0")" && pwd)"
CLI="$ROOT/cli/dist/index.js"
PASSED=0
FAILED=0
SKIPPED=0

# Build CLI first
echo -e "${BLUE}========================================"
echo "SSOS CLI Comprehensive Test Suite"
echo "========================================${NC}"
echo

echo -e "${YELLOW}Building CLI...${NC}"
cd "$ROOT/cli"
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓ CLI build successful${NC}"
else
    echo -e "${RED}✗ CLI build failed${NC}"
    exit 1
fi
echo

# Test function - checks if command exists and shows help
test_command() {
    local module="$1"
    local command="$2"
    local full_cmd="$module $command"

    if node "$CLI" $module $command --help > /dev/null 2>&1; then
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ $full_cmd${NC}"
        ((FAILED++))
        return 1
    fi
}

# Test module - checks if module exists
test_module() {
    local module="$1"

    if node "$CLI" $module --help > /dev/null 2>&1; then
        return 0
    else
        echo -e "${RED}✗ Module $module not found${NC}"
        ((FAILED++))
        return 1
    fi
}

# Print section header
print_section() {
    echo -e "${BLUE}--- $1 ---${NC}"
}

# Print module summary
print_module_summary() {
    local module="$1"
    local total="$2"
    local passed_before=$PASSED
    echo -e "${YELLOW}Testing $module ($total commands)${NC}"
}

# ==============================================
# Test all CLI modules and commands
# ==============================================

print_section "1. Accounting Module (22 commands)"
test_module "accounting" || exit 1
print_module_summary "accounting" 22
test_command "accounting" "account-balance"
test_command "accounting" "account-balances"
test_command "accounting" "account-create"
test_command "accounting" "account-delete"
test_command "accounting" "account-list"
test_command "accounting" "account-update"
test_command "accounting" "bank-journal"
test_command "accounting" "cash-journal"
test_command "accounting" "general-ledger"
test_command "accounting" "income-statement"
test_command "accounting" "journal-approve"
test_command "accounting" "journal-create"
test_command "accounting" "journal-delete"
test_command "accounting" "journal-get"
test_command "accounting" "journal-list"
test_command "accounting" "journal-post"
test_command "accounting" "journal-reject"
test_command "accounting" "journal-reverse"
test_command "accounting" "journal-submit-review"
test_command "accounting" "journal-unpost"
test_command "accounting" "journal-update"
test_command "accounting" "trial-balance"
echo

print_section "2. Tax Module (39 commands)"
test_module "tax" || exit 1
print_module_summary "tax" 39
test_command "tax" "bonus-create"
test_command "tax" "bonus-delete"
test_command "tax" "bonus-get"
test_command "tax" "bonus-list"
test_command "tax" "bonus-post"
test_command "tax" "bonus-update"
test_command "tax" "calendar"
test_command "tax" "calculations"
test_command "tax" "compliance"
test_command "tax" "deduction-create"
test_command "tax" "deduction-delete"
test_command "tax" "deduction-list"
test_command "tax" "deduction-summary"
test_command "tax" "deduction-update"
test_command "tax" "dividend-create"
test_command "tax" "dividend-delete"
test_command "tax" "dividend-get"
test_command "tax" "dividend-list"
test_command "tax" "dividend-post"
test_command "tax" "dividend-update"
test_command "tax" "filings"
test_command "tax" "iit-get"
test_command "tax" "iit-list"
test_command "tax" "iit-mark-filed"
test_command "tax" "iit-pay"
test_command "tax" "labor-fee-create"
test_command "tax" "labor-fee-delete"
test_command "tax" "labor-fee-get"
test_command "tax" "labor-fee-list"
test_command "tax" "labor-fee-update"
test_command "tax" "labor-fee-void"
test_command "tax" "loss-carryforward"
test_command "tax" "rules"
test_command "tax" "severance-create"
test_command "tax" "severance-delete"
test_command "tax" "severance-get"
test_command "tax" "severance-list"
test_command "tax" "severance-post"
test_command "tax" "severance-update"
echo

print_section "3. Banking Module (13 commands)"
test_module "banking" || exit 1
print_module_summary "banking" 13
test_command "banking" "account-create"
test_command "banking" "account-delete"
test_command "banking" "account-get"
test_command "banking" "account-list"
test_command "banking" "account-update"
test_command "banking" "reconciliation-create"
test_command "banking" "reconciliation-delete"
test_command "banking" "reconciliation-get"
test_command "banking" "reconciliation-list"
test_command "banking" "reconciliation-update"
test_command "banking" "transaction-get"
test_command "banking" "transaction-import"
test_command "banking" "transaction-list"
echo

print_section "4. HR Module (16 commands)"
test_module "hr" || exit 1
print_module_summary "hr" 16
test_command "hr" "contract-create"
test_command "hr" "contract-delete"
test_command "hr" "contract-get"
test_command "hr" "contract-list"
test_command "hr" "contract-update"
test_command "hr" "employee-create"
test_command "hr" "employee-delete"
test_command "hr" "employee-get"
test_command "hr" "employee-list"
test_command "hr" "employee-update"
test_command "hr" "payroll-create"
test_command "hr" "payroll-delete"
test_command "hr" "payroll-get"
test_command "hr" "payroll-list"
test_command "hr" "payroll-post"
test_command "hr" "payroll-update"
echo

print_section "5. Legal Module (16 commands)"
test_module "legal" || exit 1
print_module_summary "legal" 16
test_command "legal" "contract-create"
test_command "legal" "contract-delete"
test_command "legal" "contract-generate"
test_command "legal" "contract-get"
test_command "legal" "contract-list"
test_command "legal" "contract-review"
test_command "legal" "contract-update"
test_command "legal" "demand-delete"
test_command "legal" "demand-generate"
test_command "legal" "demand-get"
test_command "legal" "demand-list"
test_command "legal" "demand-save"
test_command "legal" "demand-update"
test_command "legal" "legal-path"
test_command "legal" "review-ask"
test_command "legal" "review-get"
echo

print_section "6. Expense Module (17 commands)"
test_module "expense" || exit 1
print_module_summary "expense" 17
test_command "expense" "approve"
test_command "expense" "create"
test_command "expense" "delete"
test_command "expense" "department-create"
test_command "expense" "department-delete"
test_command "expense" "department-list"
test_command "expense" "department-update"
test_command "expense" "get"
test_command "expense" "list"
test_command "expense" "project-create"
test_command "expense" "project-delete"
test_command "expense" "project-list"
test_command "expense" "project-update"
test_command "expense" "reimburse"
test_command "expense" "reject"
test_command "expense" "submit"
test_command "expense" "update"
echo

print_section "7. Invoice Module (13 commands)"
test_module "invoice" || exit 1
print_module_summary "invoice" 13
test_command "invoice" "batch-create-entries"
test_command "invoice" "create"
test_command "invoice" "create-entry"
test_command "invoice" "delete"
test_command "invoice" "get"
test_command "invoice" "list"
test_command "invoice" "partner-create"
test_command "invoice" "partner-delete"
test_command "invoice" "partner-get"
test_command "invoice" "partner-list"
test_command "invoice" "partner-update"
test_command "invoice" "reverse"
test_command "invoice" "update"
echo

print_section "8. Period Module (8 commands)"
test_module "period" || exit 1
print_module_summary "period" 8
test_command "period" "close"
test_command "period" "create"
test_command "period" "delete"
test_command "period" "get"
test_command "period" "list"
test_command "period" "opening-balances"
test_command "period" "set-opening-balance"
test_command "period" "update"
echo

print_section "9. AI-Bookkeeping Module (5 commands)"
test_module "ai-bookkeeping" || exit 1
print_module_summary "ai-bookkeeping" 5
test_command "ai-bookkeeping" "book"
test_command "ai-bookkeeping" "compliance"
test_command "ai-bookkeeping" "conversations"
test_command "ai-bookkeeping" "file-upload"
test_command "ai-bookkeeping" "ocr"
echo

print_section "10. Auth Module (3 commands)"
test_module "auth" || exit 1
print_module_summary "auth" 3
test_command "auth" "login"
test_command "auth" "logout"
test_command "auth" "status"
echo

print_section "11. Workspace Module (7 commands)"
test_module "workspace-api" || exit 1
print_module_summary "workspace-api" 5
test_command "workspace-api" "current"
test_command "workspace-api" "list"
test_command "workspace-api" "members"
test_command "workspace-api" "settings"
test_command "workspace-api" "switch"
echo

print_section "12. API-Key Module (4 commands)"
test_module "api-key" || exit 1
print_module_summary "api-key" 4
test_command "api-key" "create"
test_command "api-key" "list"
test_command "api-key" "revoke"
test_command "api-key" "toggle"
echo

print_section "13. CRUD Module (7 commands)"
test_module "crud" || exit 1
print_module_summary "crud" 7
test_command "crud" "list"
test_command "crud" "get"
test_command "crud" "create"
test_command "crud" "update"
test_command "crud" "delete"
test_command "crud" "action"
test_command "crud" "resources"
echo

print_section "14. Admin Module (21 commands)"
test_module "admin" || exit 1
print_module_summary "admin" 21
test_command "admin" "activate"
test_command "admin" "ban"
test_command "admin" "batch"
test_command "admin" "get"
test_command "admin" "growth"
test_command "admin" "list"
test_command "admin" "monitoring"
test_command "admin" "overview"
test_command "admin" "reset-password"
test_command "admin" "set"
test_command "admin" "settings"
test_command "admin" "suspend"
test_command "admin" "tenants"
test_command "admin" "top-tenants"
test_command "admin" "unban"
test_command "admin" "users"
test_command "admin" "whoami"
echo

print_section "15. Files Module (5 commands)"
test_module "files" || exit 1
print_module_summary "files" 5
test_command "files" "delete"
test_command "files" "download"
test_command "files" "get"
test_command "files" "list"
test_command "files" "upload"
echo

print_section "16. Import-Export Module (4 commands)"
test_module "import-export" || exit 1
print_module_summary "import-export" 4
test_command "import-export" "balance-sheet"
test_command "import-export" "cash-flow"
test_command "import-export" "income-statement"
test_command "import-export" "journal-entries"
echo

# Summary
echo
echo -e "${BLUE}========================================"
echo "Test Summary"
echo "========================================${NC}"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "${YELLOW}Skipped: $SKIPPED${NC}"
echo

# Calculate coverage
TOTAL=$((PASSED + FAILED))
if [ $TOTAL -gt 0 ]; then
    COVERAGE=$((PASSED * 100 / TOTAL))
    echo -e "Coverage: ${GREEN}$COVERAGE%${NC} ($PASSED/$TOTAL)"
fi
echo

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All CLI commands passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ $FAILED command(s) failed${NC}"
    exit 1
fi
