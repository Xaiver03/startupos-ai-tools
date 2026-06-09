/**
 * SSOS MCP Accounting Utils
 * 财务数据处理工具库
 *
 * @packageDocumentation
 */

// 名称标准化
export {
  normalizeCompanyName,
  extractKeywords,
  matchCompanyName,
} from './name-normalizer.js';

// 银行流水统一
export {
  unifyBankStatements,
  type BankTransaction,
  type BankFileInput,
  type UnifyBankStatementsResult,
} from './bank-statements.js';

// 发票对账
export {
  reconcileInvoices,
  matchByAmount,
  filterByDateRange,
  type Invoice,
  type ReconciliationResult,
  type InvoiceReconciliationResult,
  type MatchMethod,
  type MatchedTransaction,
} from './invoice-reconciliation.js';

// 红字发票检测
export {
  parseInvoiceXML,
  detectRedInvoices,
  isRedInvoice,
  type InvoiceInfo,
  type RedInvoiceDetectionResult,
} from './red-invoice-detector.js';
