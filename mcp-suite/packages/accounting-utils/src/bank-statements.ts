/**
 * 银行流水统一工具
 * 支持工商银行、招商银行、支付宝等多种格式
 */

import * as XLSX from 'xlsx';

export interface BankTransaction {
  date: Date; // 交易时间
  amount: number; // 交易金额（收入为正，支出为负）
  direction: 'income' | 'expense'; // 方向
  counterparty: string; // 对方名称（付款方/收款方）
  bank: string; // 银行名称
  accountNumber?: string; // 账号
  balance?: number; // 余额
  description?: string; // 摘要/说明
  originalFile?: string; // 原始文件名
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
  content: Buffer | string; // Excel 文件内容
  bank: 'icbc' | 'cmb' | 'alipay'; // 银行类型
  companyName?: string; // 公司名称（用于判断收入/支出）
}

/**
 * 统一银行流水格式
 *
 * @param files - 银行流水文件数组
 * @returns 统一后的交易记录
 */
export async function unifyBankStatements(
  files: BankFileInput[]
): Promise<UnifyBankStatementsResult> {
  const allTransactions: BankTransaction[] = [];

  for (const file of files) {
    let transactions: BankTransaction[] = [];

    switch (file.bank) {
      case 'icbc':
        transactions = parseICBCStatement(file);
        break;
      case 'cmb':
        transactions = parseCMBStatement(file);
        break;
      case 'alipay':
        transactions = parseAlipayStatement(file);
        break;
    }

    allTransactions.push(...transactions);
  }

  // 去重（按时间+金额+银行）
  const beforeDedup = allTransactions.length;
  const dedupedTransactions = deduplicateTransactions(allTransactions);
  const duplicatesRemoved = beforeDedup - dedupedTransactions.length;

  // 按时间排序
  dedupedTransactions.sort((a, b) => a.date.getTime() - b.date.getTime());

  // 计算汇总信息
  const incomeTransactions = dedupedTransactions.filter(t => t.direction === 'income');
  const expenseTransactions = dedupedTransactions.filter(t => t.direction === 'expense');

  return {
    transactions: dedupedTransactions,
    summary: {
      totalCount: dedupedTransactions.length,
      duplicatesRemoved,
      incomeCount: incomeTransactions.length,
      expenseCount: expenseTransactions.length,
      totalIncome: incomeTransactions.reduce((sum, t) => sum + t.amount, 0),
      totalExpense: Math.abs(expenseTransactions.reduce((sum, t) => sum + t.amount, 0)),
    },
  };
}

/**
 * 解析工商银行流水
 */
function parseICBCStatement(file: BankFileInput): BankTransaction[] {
  const transactions: BankTransaction[] = [];

  try {
    const workbook = XLSX.read(file.content, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // 跳过第一行标题，从第二行开始（header）
    const headers = data[1];

    for (let i = 2; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      try {
        // 处理千分位格式
        const debitStr = String(row[5] || '').replace(/,/g, '').trim();
        const creditStr = String(row[6] || '').replace(/,/g, '').trim();

        const debit = debitStr && debitStr !== 'nan' ? parseFloat(debitStr) : 0;
        const credit = creditStr && creditStr !== 'nan' ? parseFloat(creditStr) : 0;

        if (debit === 0 && credit === 0) continue;

        const direction = credit > 0 ? 'income' : 'expense';
        const amount = credit > 0 ? credit : -debit;

        // 兼容不同列名：对方单位名称 或 对方户名
        const counterparty = String(row[9] || '').trim();

        const transaction: BankTransaction = {
          date: parseDate(row[3]),
          amount,
          direction,
          counterparty,
          bank: '工商银行',
          accountNumber: '0200095709200450880',
          balance: parseFloat(String(row[7] || '0').replace(/,/g, '')),
          description: String(row[8] || ''),
          originalFile: file.name,
        };

        transactions.push(transaction);
      } catch (error) {
        // 跳过解析失败的行
        continue;
      }
    }
  } catch (error) {
    console.error(`Failed to parse ICBC statement: ${file.name}`, error);
  }

  return transactions;
}

/**
 * 解析招商银行流水
 */
function parseCMBStatement(file: BankFileInput): BankTransaction[] {
  const transactions: BankTransaction[] = [];

  try {
    const workbook = XLSX.read(file.content, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    // 招商银行需要跳过第一行（header=1）
    const data: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // 第二行是表头
    for (let i = 2; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      try {
        const companyName = file.companyName || '晓黎创意';
        const payerName = String(row[0] || '').trim();
        const receiverName = String(row[4] || '').trim();

        let direction: 'income' | 'expense';
        let counterparty: string;

        // 判断收入/支出
        if (receiverName.includes(companyName)) {
          direction = 'income';
          counterparty = payerName;
        } else if (payerName.includes(companyName)) {
          direction = 'expense';
          counterparty = receiverName;
        } else {
          continue; // 不是本公司的交易
        }

        let amount = parseFloat(String(row[8] || '0').replace(/,/g, ''));
        if (direction === 'expense') {
          amount = -Math.abs(amount);
        }

        const transaction: BankTransaction = {
          date: parseDate(row[10]),
          amount,
          direction,
          counterparty,
          bank: '招商银行',
          accountNumber: '110963153910001',
          balance: parseFloat(String(row[11] || '0').replace(/,/g, '')),
          originalFile: file.name,
        };

        transactions.push(transaction);
      } catch (error) {
        continue;
      }
    }
  } catch (error) {
    console.error(`Failed to parse CMB statement: ${file.name}`, error);
  }

  return transactions;
}

/**
 * 解析支付宝流水
 */
function parseAlipayStatement(file: BankFileInput): BankTransaction[] {
  const transactions: BankTransaction[] = [];

  try {
    const workbook = XLSX.read(file.content, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data: any[] = XLSX.utils.sheet_to_json(sheet);

    for (const row of data) {
      try {
        const amountStr = String(row['金额'] || row['Amount'] || '0');
        const amount = parseFloat(amountStr.replace(/,/g, ''));

        if (amount === 0) continue;

        const direction = amount > 0 ? 'income' : 'expense';
        const counterparty = String(row['交易对方'] || row['Counterparty'] || '');

        const transaction: BankTransaction = {
          date: parseDate(row['交易时间'] || row['Time']),
          amount,
          direction,
          counterparty,
          bank: '支付宝',
          description: String(row['商品说明'] || row['Description'] || ''),
          originalFile: file.name,
        };

        transactions.push(transaction);
      } catch (error) {
        continue;
      }
    }
  } catch (error) {
    console.error(`Failed to parse Alipay statement: ${file.name}`, error);
  }

  return transactions;
}

/**
 * 去重交易记录
 * 按时间+金额+银行去重
 */
function deduplicateTransactions(transactions: BankTransaction[]): BankTransaction[] {
  const seen = new Set<string>();
  const deduped: BankTransaction[] = [];

  for (const transaction of transactions) {
    const key = `${transaction.date.toISOString()}_${transaction.amount}_${transaction.bank}`;

    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(transaction);
    }
  }

  return deduped;
}

/**
 * 解析日期
 * 支持多种格式
 */
function parseDate(dateValue: any): Date {
  if (!dateValue) return new Date();

  // 如果已经是 Date 对象
  if (dateValue instanceof Date) return dateValue;

  // 如果是 Excel 日期数字
  if (typeof dateValue === 'number') {
    return XLSX.SSF.parse_date_code(dateValue);
  }

  // 如果是字符串
  const str = String(dateValue).trim();
  const date = new Date(str);

  if (!isNaN(date.getTime())) {
    return date;
  }

  // 默认返回当前日期
  return new Date();
}
