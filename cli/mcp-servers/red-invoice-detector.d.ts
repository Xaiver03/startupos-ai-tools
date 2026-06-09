/**
 * 红字发票检测工具
 * 从增值税发票 XML 文件中检测红字发票
 */
export interface InvoiceInfo {
    invoiceNumber: string;
    invoiceCode?: string;
    type: 'blue' | 'red';
    amount: number;
    amountWithoutTax: number;
    taxAmount: number;
    customer: string;
    date: string;
    isReversed?: boolean;
    reversedBy?: string;
    originalInvoice?: string;
    creditNoteNumber?: string;
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
export declare function parseInvoiceXML(xmlContent: string): Promise<InvoiceInfo | null>;
/**
 * 检测红字发票
 * 从多个 XML 文件中检测蓝字和红字发票，并标记被冲红的发票
 *
 * @param xmlFiles - XML 文件数组 { name: string, content: string }
 * @returns 检测结果
 */
export declare function detectRedInvoices(xmlFiles: Array<{
    name: string;
    content: string;
}>): Promise<RedInvoiceDetectionResult>;
/**
 * 检查发票是否为红字发票（简单版本）
 * 通过多种方式判断
 *
 * @param xmlContent - XML 文件内容
 * @returns 是否为红字发票
 */
export declare function isRedInvoice(xmlContent: string): Promise<boolean>;
//# sourceMappingURL=red-invoice-detector.d.ts.map