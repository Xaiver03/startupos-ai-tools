/**
 * 发票对账工具
 * 使用多重匹配算法（精确、模糊、关键词、字符拆分）
 */
export interface Invoice {
    invoiceNumber: string;
    customerName: string;
    amount: number;
    date: string;
}
export interface BankTransaction {
    date: Date;
    amount: number;
    counterparty: string;
    direction: 'income' | 'expense';
}
export interface MatchedTransaction {
    date: string;
    amount: number;
    matchMethod: 'exact' | 'fuzzy' | 'keyword' | 'split';
}
export interface ReconciliationResult {
    customerName: string;
    invoiceCount: number;
    totalAmount: number;
    receivedAmount: number;
    unpaidAmount: number;
    status: 'paid' | 'partial' | 'unpaid';
    matchedTransactions: MatchedTransaction[];
}
export interface InvoiceReconciliationResult {
    results: ReconciliationResult[];
    summary: {
        totalCustomers: number;
        paidCustomers: number;
        partialCustomers: number;
        unpaidCustomers: number;
        collectionRate: number;
    };
}
export type MatchMethod = 'exact' | 'fuzzy' | 'keyword' | 'split';
/**
 * 发票对账主函数
 * 按客户汇总发票，然后使用多重匹配算法查找收款
 *
 * @param invoices - 发票列表
 * @param transactions - 银行交易列表（仅收入）
 * @param matchMethods - 匹配方法（默认全部）
 * @returns 对账结果
 */
export declare function reconcileInvoices(invoices: Invoice[], transactions: BankTransaction[], matchMethods?: MatchMethod[]): InvoiceReconciliationResult;
/**
 * 按金额匹配（辅助函数）
 * 用于查找金额完全匹配的交易
 */
export declare function matchByAmount(amount: number, transactions: BankTransaction[], tolerance?: number): BankTransaction[];
/**
 * 按日期范围筛选交易（辅助函数）
 */
export declare function filterByDateRange(transactions: BankTransaction[], startDate: Date, endDate: Date): BankTransaction[];
//# sourceMappingURL=invoice-reconciliation.d.ts.map