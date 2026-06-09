# CLI 精简进度报告

## 已完成

### ✅ Accounting Module
- **删除前**: 22 个命令
- **删除后**: 7 个命令（-68%）
- **删除的命令**: journal-*, account-* 等 15 个 CRUD 重复命令
- **保留的命令**: 
  - trial-balance
  - income-statement
  - general-ledger
  - bank-journal
  - cash-journal
  - account-balances
  - account-balance

## 待处理（按优先级）

### Tax Module (39 → ~7 命令)
**删除**：bonus-*, dividend-*, labor-fee-*, severance-*, deduction-*, iit-* 等 32 个 CRUD
**保留**：calendar, rules, calculations, compliance, filings, loss-carryforward

### Banking Module (13 → 0 命令)
**删除**：全部（account-*, transaction-*, reconciliation-*）
**理由**：全部是 CRUD，用 `crud` 命令代替

### HR Module (16 → 0 命令)
**删除**：全部（employee-*, payroll-*, contract-*）
**理由**：全部是 CRUD

### Legal Module (16 → 0 命令)
**删除**：全部（contract-*, demand-*）
**理由**：全部是 CRUD

### Expense Module (17 → 0 命令)
**删除**：全部（create, list, approve, department-*, project-*）
**理由**：全部是 CRUD 或 action

### Invoice Module (13 → 3 命令)
**删除**：create, list, get, update, delete, partner-*
**保留**：create-entry, batch-create-entries, reverse（业务逻辑）

## 预计结果

- **当前**: 279 个命令
- **删除**: accounting 已完成 -15
- **待删除**: ~185 个
- **最终**: ~79 个命令

继续？
