import { Command } from 'commander';
import chalk from 'chalk';
import { apiPost } from '../lib/api-helpers.js';

/**
 * Invoice module - 发票业务逻辑
 *
 * 本模块提供 3 个发票业务命令。
 * 发票数据操作请使用 'crud' 命令：
 *   crud list business-vat-invoices
 *   crud create business-vat-invoices
 *   crud list partners
 */

interface ReversalResult {
  id?: string;
  reversed_invoice_id?: string;
}

interface EntryResult {
  id?: string;
  journal_entry_id?: string;
}

interface BatchResult {
  success_count?: number;
  fail_count?: number;
}

export function createInvoiceCommand() {
  const invoiceCmd = new Command('invoice')
    .description('发票业务逻辑 | 数据操作用 crud 命令');

  // Reverse VAT invoice
  invoiceCmd
    .command('reverse')
    .description('Reverse (red-ink) a VAT invoice')
    .argument('<id>', 'Invoice ID')
    .requiredOption('--reason <reason>', 'Reversal reason: sales_return | invoice_error | service_termination | price_adjustment | duplicate_invoice')
    .option('--type <type>', 'Reversal type: full | partial', 'full')
    .option('--detail <text>', 'Reason detail')
    .option('--partial-excl-tax <amount>', 'Partial amount (excl. tax)')
    .option('--partial-tax <amount>', 'Partial tax amount')
    .option('--partial-incl-tax <amount>', 'Partial amount (incl. tax)')
    .option('--confirm', 'Requires 72h confirmation')
    .option('--json', 'Output as JSON')
    .action(async (id: string, options) => {
      const body: Record<string, unknown> = {
        reversal_type: options.type || 'full',
        reversal_reason: options.reason,
      };
      if (options.detail) body.reason_detail = options.detail;
      if (options.type === 'partial') {
        if (options.partialExclTax) body.partial_amount_excl_tax = Number(options.partialExclTax);
        if (options.partialTax) body.partial_tax_amount = Number(options.partialTax);
        if (options.partialInclTax) body.partial_amount_incl_tax = Number(options.partialInclTax);
      }
      if (options.confirm) body.requires_confirmation = true;

      await apiPost<{ data: ReversalResult }>(
        `/api/business-vat-invoices/${id}/reverse`,
        body,
        'Reversing invoice...',
        {
          json: options.json,
          onSuccess: (data) => {
            const r = (data.data || data) as ReversalResult;
            console.log(`${chalk.bold('冲红记录 ID:')} ${r.id || '-'}`);
            if (r.reversed_invoice_id) console.log(`${chalk.bold('已冲红发票:')} ${r.reversed_invoice_id}`);
          },
        }
      );
    });

  // Create journal entry from invoice
  invoiceCmd
    .command('create-entry')
    .description('Create a journal entry from a VAT invoice')
    .argument('<id>', 'Invoice ID')
    .option('--json', 'Output as JSON')
    .action(async (id: string, options) => {
      await apiPost<{ data: EntryResult }>(
        `/api/business-vat-invoices/${id}/create-entry`,
        {},
        'Creating journal entry from invoice...',
        {
          json: options.json,
          onSuccess: (data) => {
            const r = (data.data || data) as EntryResult;
            console.log(`${chalk.bold('凭证 ID:')} ${r.id || r.journal_entry_id || '-'}`);
          },
        }
      );
    });

  // Batch create journal entries from invoices
  invoiceCmd
    .command('batch-create-entries')
    .description('Batch create journal entries from VAT invoices')
    .requiredOption('--ids <json>', 'JSON array of invoice IDs')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const invoice_ids = JSON.parse(options.ids) as string[];

      await apiPost<{ data: BatchResult }>(
        '/api/business-vat-invoices/batch-create-entries',
        { invoice_ids },
        'Batch creating journal entries...',
        {
          json: options.json,
          onSuccess: (data) => {
            const r = (data.data || data) as BatchResult;
            if (r.success_count !== undefined) console.log(`${chalk.bold('成功:')} ${r.success_count}`);
            if (r.fail_count !== undefined) console.log(`${chalk.bold('失败:')} ${r.fail_count}`);
          },
        }
      );
    });

  return invoiceCmd;
}
