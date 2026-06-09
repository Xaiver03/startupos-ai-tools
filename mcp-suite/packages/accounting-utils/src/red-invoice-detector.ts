/**
 * 红字发票检测工具
 * 从增值税发票 XML 文件中检测红字发票
 */

import { parseStringPromise } from 'xml2js';

export interface InvoiceInfo {
  invoiceNumber: string;
  invoiceCode?: string;
  type: 'blue' | 'red'; // 蓝字或红字
  amount: number; // 价税合计
  amountWithoutTax: number; // 不含税金额
  taxAmount: number; // 税额
  customer: string; // 客户名称
  date: string; // 开票日期
  isReversed?: boolean; // 是否被冲红（仅蓝字发票）
  reversedBy?: string; // 冲红发票号（仅被冲红的蓝字发票）
  originalInvoice?: string; // 原蓝字发票号（仅红字发票）
  creditNoteNumber?: string; // 红字确认单号（仅红字发票）
}

export interface RedInvoiceDetectionResult {
  blueInvoices: InvoiceInfo[];
  redInvoices: InvoiceInfo[];
  summary: {
    totalBlue: number;
    totalRed: number;
    netAmount: number;
    reversedCount: number;
  };
}

/**
 * 解析增值税发票 XML 文件
 *
 * @param xmlContent - XML 文件内容
 * @returns 发票信息
 */
export async function parseInvoiceXML(xmlContent: string): Promise<InvoiceInfo | null> {
  try {
    const result = await parseStringPromise(xmlContent, {
      explicitArray: false,
      ignoreAttrs: false,
      trim: true,
    });

    // 根节点可能是 Invoice 或其他
    const root = result.Invoice || result;

    // 检查是否蓝字发票
    const labelCode = root.InIssuType?.LabelCode || 'Y';
    const isBlue = labelCode === 'Y';

    // 提取金额信息
    const basicInfo = root.BasicInformation || {};
    const amountStr = basicInfo['TotalTax-includedAmount'] || basicInfo.TotalTaxIncludedAmount || '0';
    const amount = parseFloat(String(amountStr).replace(/,/g, ''));
    const amountWithoutTax = parseFloat(String(basicInfo.TotalAmWithoutTax || '0').replace(/,/g, ''));
    const taxAmount = parseFloat(String(basicInfo.TotalTaxAm || '0').replace(/,/g, ''));

    // 提取发票号码
    const invoiceNumber = basicInfo.InvoiceNum || basicInfo.InvoiceNumber || '';
    const invoiceCode = basicInfo.InvoiceCode || '';

    // 提取客户名称
    const buyerInfo = root.PurchaserInformation || root.Purchaser || {};
    const customer = buyerInfo.Name || buyerInfo.PurchaserName || '';

    // 提取开票日期
    const date = basicInfo.InvoiceDate || basicInfo.IssueDate || '';

    // 红字发票特有信息
    let originalInvoice: string | undefined;
    let creditNoteNumber: string | undefined;

    if (!isBlue) {
      const redInfo = root.SpecificInformation?.RedEInvoice || root.RedEInvoice || {};
      originalInvoice = redInfo.OriginalInvoiceCode || redInfo.OriginalInvoiceNumber || '';
      creditNoteNumber = redInfo.CreditNoteNumber || '';
    }

    const invoice: InvoiceInfo = {
      invoiceNumber,
      invoiceCode,
      type: isBlue ? 'blue' : 'red',
      amount,
      amountWithoutTax,
      taxAmount,
      customer,
      date,
    };

    if (!isBlue) {
      invoice.originalInvoice = originalInvoice;
      invoice.creditNoteNumber = creditNoteNumber;
    }

    return invoice;
  } catch (error) {
    console.error('Failed to parse invoice XML:', error);
    return null;
  }
}

/**
 * 检测红字发票
 * 从多个 XML 文件中检测蓝字和红字发票，并标记被冲红的发票
 *
 * @param xmlFiles - XML 文件数组 { name: string, content: string }
 * @returns 检测结果
 */
export async function detectRedInvoices(
  xmlFiles: Array<{ name: string; content: string }>
): Promise<RedInvoiceDetectionResult> {
  const blueInvoices: InvoiceInfo[] = [];
  const redInvoices: InvoiceInfo[] = [];

  // 解析所有 XML 文件
  for (const file of xmlFiles) {
    const invoice = await parseInvoiceXML(file.content);
    if (!invoice) continue;

    if (invoice.type === 'blue') {
      blueInvoices.push(invoice);
    } else {
      redInvoices.push(invoice);
    }
  }

  // 标记被冲红的蓝字发票
  for (const redInvoice of redInvoices) {
    if (redInvoice.originalInvoice) {
      const originalBlue = blueInvoices.find(
        b => b.invoiceNumber === redInvoice.originalInvoice ||
             b.invoiceCode === redInvoice.originalInvoice
      );
      if (originalBlue) {
        originalBlue.isReversed = true;
        originalBlue.reversedBy = redInvoice.invoiceNumber;
      }
    }
  }

  // 计算汇总信息
  const totalBlue = blueInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalRed = redInvoices.reduce((sum, inv) => sum + inv.amount, 0); // 负数
  const netAmount = totalBlue + totalRed;
  const reversedCount = blueInvoices.filter(inv => inv.isReversed).length;

  return {
    blueInvoices,
    redInvoices,
    summary: {
      totalBlue,
      totalRed,
      netAmount,
      reversedCount,
    },
  };
}

/**
 * 检查发票是否为红字发票（简单版本）
 * 通过多种方式判断
 *
 * @param xmlContent - XML 文件内容
 * @returns 是否为红字发票
 */
export async function isRedInvoice(xmlContent: string): Promise<boolean> {
  try {
    const invoice = await parseInvoiceXML(xmlContent);
    if (!invoice) return false;

    // 方法1：检查 LabelCode
    if (invoice.type === 'red') return true;

    // 方法2：检查金额是否为负数
    if (invoice.amount < 0) return true;

    // 方法3：检查是否有原发票信息
    if (invoice.originalInvoice) return true;

    return false;
  } catch {
    return false;
  }
}
