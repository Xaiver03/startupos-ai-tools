/**
 * 发票对账工具
 * 使用多重匹配算法（精确、模糊、关键词、字符拆分）
 */
import { normalizeCompanyName, extractKeywords, matchCompanyName } from './name-normalizer.js';
/**
 * 发票对账主函数
 * 按客户汇总发票，然后使用多重匹配算法查找收款
 *
 * @param invoices - 发票列表
 * @param transactions - 银行交易列表（仅收入）
 * @param matchMethods - 匹配方法（默认全部）
 * @returns 对账结果
 */
export function reconcileInvoices(invoices, transactions, matchMethods = ['exact', 'fuzzy', 'keyword', 'split']) {
    // 1. 按客户汇总发票
    const customerInvoices = groupInvoicesByCustomer(invoices);
    // 2. 筛选收入交易
    const incomeTransactions = transactions.filter(t => t.direction === 'income');
    // 3. 对每个客户进行多重匹配
    const results = [];
    for (const [customerName, customerData] of customerInvoices.entries()) {
        const { invoices: customerInvs, totalAmount } = customerData;
        // 使用多重匹配查找收款
        const matchResult = multiMatchPayment(customerName, incomeTransactions, totalAmount, matchMethods);
        const receivedAmount = matchResult.totalReceived;
        const unpaidAmount = totalAmount - receivedAmount;
        let status;
        if (Math.abs(unpaidAmount) < 1) {
            status = 'paid';
        }
        else if (receivedAmount > 0) {
            status = 'partial';
        }
        else {
            status = 'unpaid';
        }
        results.push({
            customerName,
            invoiceCount: customerInvs.length,
            totalAmount,
            receivedAmount,
            unpaidAmount,
            status,
            matchedTransactions: matchResult.transactions,
        });
    }
    // 4. 计算汇总信息
    const paidCustomers = results.filter(r => r.status === 'paid').length;
    const partialCustomers = results.filter(r => r.status === 'partial').length;
    const unpaidCustomers = results.filter(r => r.status === 'unpaid').length;
    const totalInvoiced = results.reduce((sum, r) => sum + r.totalAmount, 0);
    const totalReceived = results.reduce((sum, r) => sum + r.receivedAmount, 0);
    const collectionRate = totalInvoiced > 0 ? (totalReceived / totalInvoiced) * 100 : 0;
    return {
        results,
        summary: {
            totalCustomers: results.length,
            paidCustomers,
            partialCustomers,
            unpaidCustomers,
            collectionRate: Math.round(collectionRate * 10) / 10,
        },
    };
}
/**
 * 按客户汇总发票
 */
function groupInvoicesByCustomer(invoices) {
    const groups = new Map();
    for (const invoice of invoices) {
        const normalized = normalizeCompanyName(invoice.customerName);
        if (!groups.has(normalized)) {
            groups.set(normalized, { invoices: [], totalAmount: 0 });
        }
        const group = groups.get(normalized);
        group.invoices.push(invoice);
        group.totalAmount += invoice.amount;
    }
    return groups;
}
/**
 * 多重匹配算法
 * 使用多种方法查找客户的所有收款记录
 */
function multiMatchPayment(customerName, transactions, expectedAmount, methods) {
    const matched = [];
    const usedTransactionIndices = new Set();
    // 1. 精确匹配
    if (methods.includes('exact')) {
        for (let i = 0; i < transactions.length; i++) {
            if (usedTransactionIndices.has(i))
                continue;
            const t = transactions[i];
            if (matchCompanyName(customerName, t.counterparty, 'exact')) {
                matched.push({
                    date: t.date.toISOString().split('T')[0],
                    amount: t.amount,
                    matchMethod: 'exact',
                });
                usedTransactionIndices.add(i);
            }
        }
    }
    // 2. 模糊匹配（包含）
    if (methods.includes('fuzzy') && matched.length === 0) {
        for (let i = 0; i < transactions.length; i++) {
            if (usedTransactionIndices.has(i))
                continue;
            const t = transactions[i];
            if (matchCompanyName(customerName, t.counterparty, 'fuzzy')) {
                matched.push({
                    date: t.date.toISOString().split('T')[0],
                    amount: t.amount,
                    matchMethod: 'fuzzy',
                });
                usedTransactionIndices.add(i);
            }
        }
    }
    // 3. 关键词匹配
    if (methods.includes('keyword') && matched.length === 0) {
        const keywords = extractKeywords(customerName);
        for (let i = 0; i < transactions.length; i++) {
            if (usedTransactionIndices.has(i))
                continue;
            const t = transactions[i];
            const counterpartyNormalized = normalizeCompanyName(t.counterparty);
            for (const keyword of keywords) {
                if (counterpartyNormalized.includes(keyword)) {
                    matched.push({
                        date: t.date.toISOString().split('T')[0],
                        amount: t.amount,
                        matchMethod: 'keyword',
                    });
                    usedTransactionIndices.add(i);
                    break;
                }
            }
        }
    }
    // 4. 拆分支付匹配
    // 尝试找到多笔交易相加等于发票金额
    if (methods.includes('split') && matched.length === 0) {
        const splitMatch = findSplitPayments(expectedAmount, transactions.filter((_, i) => !usedTransactionIndices.has(i)));
        if (splitMatch) {
            for (const t of splitMatch) {
                matched.push({
                    date: t.date.toISOString().split('T')[0],
                    amount: t.amount,
                    matchMethod: 'split',
                });
            }
        }
    }
    const totalReceived = matched.reduce((sum, m) => sum + m.amount, 0);
    return {
        totalReceived,
        transactions: matched,
    };
}
/**
 * 查找拆分支付
 * 尝试找到2-5笔交易相加等于目标金额
 */
function findSplitPayments(targetAmount, transactions, maxSplits = 5) {
    // 尝试2笔组合
    for (let i = 0; i < transactions.length; i++) {
        for (let j = i + 1; j < transactions.length; j++) {
            const sum = transactions[i].amount + transactions[j].amount;
            if (Math.abs(sum - targetAmount) < 1) {
                return [transactions[i], transactions[j]];
            }
        }
    }
    // 尝试3笔组合
    if (maxSplits >= 3) {
        for (let i = 0; i < transactions.length; i++) {
            for (let j = i + 1; j < transactions.length; j++) {
                for (let k = j + 1; k < transactions.length; k++) {
                    const sum = transactions[i].amount + transactions[j].amount + transactions[k].amount;
                    if (Math.abs(sum - targetAmount) < 1) {
                        return [transactions[i], transactions[j], transactions[k]];
                    }
                }
            }
        }
    }
    // 更多组合（4-5笔）可以继续添加，但会增加复杂度
    // 这里简化处理，只支持2-3笔
    return null;
}
/**
 * 按金额匹配（辅助函数）
 * 用于查找金额完全匹配的交易
 */
export function matchByAmount(amount, transactions, tolerance = 1) {
    return transactions.filter(t => Math.abs(t.amount - amount) < tolerance);
}
/**
 * 按日期范围筛选交易（辅助函数）
 */
export function filterByDateRange(transactions, startDate, endDate) {
    return transactions.filter(t => t.date >= startDate && t.date <= endDate);
}
//# sourceMappingURL=invoice-reconciliation.js.map