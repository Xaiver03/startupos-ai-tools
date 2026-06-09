/**
 * SSOS MCP Accounting Utils
 * 财务数据处理工具库
 *
 * @packageDocumentation
 */
// 名称标准化
export { normalizeCompanyName, extractKeywords, matchCompanyName, } from './name-normalizer.js';
// 银行流水统一
export { unifyBankStatements, } from './bank-statements.js';
// 发票对账
export { reconcileInvoices, matchByAmount, filterByDateRange, } from './invoice-reconciliation.js';
// 红字发票检测
export { parseInvoiceXML, detectRedInvoices, isRedInvoice, } from './red-invoice-detector.js';
//# sourceMappingURL=index.js.map