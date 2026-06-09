import { Command } from 'commander';
import chalk from 'chalk';
import { apiPost } from '../lib/api-helpers.js';
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
        .action(async (id, options) => {
        const body = {
            reversal_type: options.type || 'full',
            reversal_reason: options.reason,
        };
        if (options.detail)
            body.reason_detail = options.detail;
        if (options.type === 'partial') {
            if (options.partialExclTax)
                body.partial_amount_excl_tax = Number(options.partialExclTax);
            if (options.partialTax)
                body.partial_tax_amount = Number(options.partialTax);
            if (options.partialInclTax)
                body.partial_amount_incl_tax = Number(options.partialInclTax);
        }
        if (options.confirm)
            body.requires_confirmation = true;
        await apiPost(`/api/business-vat-invoices/${id}/reverse`, body, 'Reversing invoice...', {
            json: options.json,
            onSuccess: (data) => {
                const r = (data.data || data);
                console.log(`${chalk.bold('冲红记录 ID:')} ${r.id || '-'}`);
                if (r.reversed_invoice_id)
                    console.log(`${chalk.bold('已冲红发票:')} ${r.reversed_invoice_id}`);
            },
        });
    });
    // Create journal entry from invoice
    invoiceCmd
        .command('create-entry')
        .description('Create a journal entry from a VAT invoice')
        .argument('<id>', 'Invoice ID')
        .option('--json', 'Output as JSON')
        .action(async (id, options) => {
        await apiPost(`/api/business-vat-invoices/${id}/create-entry`, {}, 'Creating journal entry from invoice...', {
            json: options.json,
            onSuccess: (data) => {
                const r = (data.data || data);
                console.log(`${chalk.bold('凭证 ID:')} ${r.id || r.journal_entry_id || '-'}`);
            },
        });
    });
    // Batch create journal entries from invoices
    invoiceCmd
        .command('batch-create-entries')
        .description('Batch create journal entries from VAT invoices')
        .requiredOption('--ids <json>', 'JSON array of invoice IDs')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        const invoice_ids = JSON.parse(options.ids);
        await apiPost('/api/business-vat-invoices/batch-create-entries', { invoice_ids }, 'Batch creating journal entries...', {
            json: options.json,
            onSuccess: (data) => {
                const r = (data.data || data);
                if (r.success_count !== undefined)
                    console.log(`${chalk.bold('成功:')} ${r.success_count}`);
                if (r.fail_count !== undefined)
                    console.log(`${chalk.bold('失败:')} ${r.fail_count}`);
            },
        });
    });
    return invoiceCmd;
}
