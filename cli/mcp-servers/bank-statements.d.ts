/**
 * 银行流水统一工具
 * 支持工商银行、招商银行、支付宝等多种格式
 */
export interface BankTransaction {
    date: Date;
    amount: number;
    direction: 'income' | 'expense';
    counterparty: string;
    bank: string;
    accountNumber?: string;
    balance?: number;
    description?: string;
    originalFile?: string;
}
export interface UnifyBankStatementsResult {
    transactions: BankTransaction[];
    summary: {
        totalCount: number;
        duplicatesRemoved: number;
        incomeCount: number;
        expenseCount: number;
        totalIncome: number;
        totalExpense: number;
    };
}
export interface BankFileInput {
    name: string;
    content: Buffer | string;
    bank: 'icbc' | 'cmb' | 'alipay';
    companyName?: string;
}
/**
 * 统一银行流水格式
 *
 * @param files - 银行流水文件数组
 * @returns 统一后的交易记录
 */
export declare function unifyBankStatements(files: BankFileInput[]): Promise<UnifyBankStatementsResult>;
//# sourceMappingURL=bank-statements.d.ts.map