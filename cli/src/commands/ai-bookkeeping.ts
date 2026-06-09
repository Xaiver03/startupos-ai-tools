import { Command } from 'commander';
import { table } from 'table';
import chalk from 'chalk';
import ora from 'ora';
import { apiFetch, getAuthHeaders, getApiUrl } from '../lib/api-client.js';
import { readFile } from 'fs/promises';
import { basename } from 'path';


export function createAIBookkeepingCommand() {
  const aiCmd = new Command('ai-bookkeeping')
    .description('AI bookkeeping operations');

  // File upload (P4: bridge local ↔ server)
  aiCmd
    .command('file-upload')
    .description('Upload a file (PDF, Excel, image) to SSOS for OCR/bookkeeping')
    .requiredOption('--file <path>', 'Local file path')
    .option('-w, --workspace <id>', 'Workspace ID')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const spinner = ora(`Uploading ${basename(options.file)}...`).start();
      try {
        const fileBuffer = await readFile(options.file);
        const fileName = basename(options.file);
        const ext = fileName.split('.').pop()?.toLowerCase();

        const mimeMap: Record<string, string> = {
          pdf: 'application/pdf',
          xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          xls: 'application/vnd.ms-excel',
          png: 'image/png',
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          webp: 'image/webp',
        };
        const mimeType = mimeMap[ext || ''] || 'application/octet-stream';

        const formData = new FormData();
        formData.append('file', new Blob([fileBuffer], { type: mimeType }), fileName);
        if (options.workspace) formData.append('workspace_id', options.workspace);

        const response = await fetch(`${getApiUrl()}/api/upload`, {
          method: 'POST',
          headers: { Authorization: getAuthHeaders().Authorization },
          body: formData,
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Upload failed (${response.status}): ${errText}`);
        }

        const data = await response.json() as Record<string, unknown>;
        spinner.succeed('Upload complete');

        if (options.json) {
          console.log(JSON.stringify(data.data || data, null, 2));
        } else {
          const result = (data.data || data) as Record<string, unknown>;
          console.log(chalk.bold('\nUpload Success:'));
          console.log(`${chalk.bold('File ID:')} ${result.id || result.file_id}`);
          console.log(`${chalk.bold('URL:')} ${(result.url as string) || '-'}`);
          console.log(`${chalk.bold('Filename:')} ${fileName}`);
          console.log(`${chalk.bold('Size:')} ${(fileBuffer.length / 1024).toFixed(1)} KB`);
          console.log(chalk.gray('\nUse this file ID with:'));
          console.log(chalk.gray(`  ssos-cli ai-bookkeeping ocr --file-url <url>`));
        }
      } catch (error) {
        spinner.fail('Failed');
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  // AI bookkeeping
  aiCmd
    .command('book')
    .description('AI automatic bookkeeping from text description')
    .requiredOption('-w, --workspace <id>', 'Workspace ID')
    .requiredOption('-t, --text <text>', 'Transaction description (e.g., "收到客户A货款10000元")')
    .option('--mode <mode>', 'Input mode (text|document|text_with_document)', 'text')
    .option('--conversation <id>', 'Conversation ID for multi-turn dialogue')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const spinner = ora('AI analyzing transaction...').start();
      try {
        const body: Record<string, unknown> = {
          workspace_id: options.workspace,
          text: options.text,
          input_mode: options.mode,
        };
        if (options.conversation) body.conversation_id = options.conversation;

        const data = await apiFetch('/api/ai/bookkeeping', {
          method: 'POST',
          body: JSON.stringify(body),
        });

        spinner.succeed('AI bookkeeping completed');

        if (options.json) {
          console.log(JSON.stringify(data.data || data, null, 2));
          return;
        }

        const result = (data.data || data) as Record<string, unknown>;
        console.log(chalk.bold('\nAI Bookkeeping Result:'));
        console.log(chalk.gray('─'.repeat(60)));
        console.log(`${chalk.bold('Description:')} ${(result.description as string) || options.text}`);
        console.log(`${chalk.bold('Confidence:')} ${(result.confidence as string) || '-'}`);

        const entry = result.suggested_entry as Record<string, unknown> | undefined;
        if (entry) {
          console.log(`\n${chalk.bold('Suggested Journal Entry:')}`);
          console.log(`Date: ${entry.entry_date}`);
          console.log(`Description: ${entry.description}`);
          console.log(`\n${chalk.bold('Line Items:')}`);
          const lineItems = entry.line_items as Array<Record<string, unknown>>;
          const lines = [
            ['Account', 'Description', 'Debit', 'Credit'],
            ...lineItems.map((item: Record<string, unknown>) => [
              (item.account_code as string) || '-',
              (item.description as string)?.substring(0, 25) || '-',
              item.debit_amount || '-',
              item.credit_amount || '-',
            ]),
          ];
          console.log(table(lines));
        }

        if (result.conversation_id) {
          console.log(chalk.gray(`\nConversation ID: ${result.conversation_id}`));
        }
      } catch (error) {
        spinner.fail('Failed');
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  // List AI conversations
  aiCmd
    .command('conversations')
    .description('List AI bookkeeping conversation history')
    .option('-w, --workspace <id>', 'Workspace ID (required)')
    .option('--type <type>', 'Conversation type (bookkeeping|invoice_detection)')
    .option('-l, --limit <n>', 'Limit results', '20')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      if (!options.workspace) {
        console.error(chalk.red('Error: --workspace is required'));
        process.exit(1);
      }

      const spinner = ora('Fetching conversations...').start();
      try {
        const params = new URLSearchParams();
        params.append('workspace_id', options.workspace);
        if (options.type) params.append('type', options.type);
        params.append('limit', options.limit);

        const data = await apiFetch(`/api/ai/conversations?${params.toString()}`);
        spinner.stop();

        if (options.json) {
          console.log(JSON.stringify(data.data || data, null, 2));
          return;
        }

        const conversations = (Array.isArray(data) ? data : (data.data as Array<Record<string, unknown>>) || []) as Array<Record<string, unknown>>;
        if (conversations.length === 0) {
          console.log(chalk.yellow('No conversations found'));
          return;
        }

        const rows = [
          ['ID', 'Type', 'Status', 'Created', 'Turns'],
          ...conversations.map((c: Record<string, unknown>) => [
            c.id,
            (c.conversation_type as string) || '-',
            (c.status as string) || '-',
            new Date(c.created_at as string).toLocaleDateString(),
            c.turn_count || '-',
          ]),
        ];

        console.log(chalk.bold('\nAI Conversations'));
        console.log(table(rows));
        console.log(chalk.gray(`\nTotal: ${conversations.length} conversations`));
      } catch (error) {
        spinner.fail('Failed');
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  // OCR invoice
  aiCmd
    .command('ocr')
    .description('OCR recognition for invoice or bank statement')
    .requiredOption('-w, --workspace <id>', 'Workspace ID')
    .requiredOption('--doc-type <type>', 'Document type (invoice|bank_statement)')
    .option('--file-url <url>', 'File URL (already uploaded to SSOS)')
    .option('--image-url <url>', 'External image URL')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const spinner = ora('OCR processing...').start();
      try {
        const body: Record<string, unknown> = {
          workspace_id: options.workspace,
          document_type: options.docType,
        };
        if (options.fileUrl) body.file_url = options.fileUrl;
        if (options.imageUrl) body.image_url = options.imageUrl;

        const data = await apiFetch('/api/ocr', {
          method: 'POST',
          body: JSON.stringify(body),
        });

        spinner.succeed('OCR completed');

        if (options.json) {
          console.log(JSON.stringify(data.data || data, null, 2));
          return;
        }

        const result = (data.data || data) as Record<string, unknown>;
        console.log(chalk.bold('\nOCR Result:'));
        console.log(chalk.gray('─'.repeat(60)));
        console.log(`${chalk.bold('Document Type:')} ${(result.document_type as string) || '-'}`);
        console.log(`${chalk.bold('Confidence:')} ${(result.confidence as string) || '-'}`);

        const extracted = result.extracted_data as Record<string, unknown> | undefined;
        if (extracted) {
          console.log(`\n${chalk.bold('Extracted Data:')}`);
          Object.entries(extracted).forEach(([key, value]) => {
            console.log(`  ${key}: ${value}`);
          });
        }

        const rawText = result.raw_text as string | undefined;
        if (rawText) {
          console.log(`\n${chalk.bold('Raw Text:')}`);
          console.log(rawText.substring(0, 500) + (rawText.length > 500 ? '...' : ''));
        }
      } catch (error) {
        spinner.fail('Failed');
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  // Compliance Q&A
  aiCmd
    .command('compliance')
    .description('Ask compliance or accounting regulation questions')
    .requiredOption('-w, --workspace <id>', 'Workspace ID')
    .requiredOption('-q, --question <text>', 'Question to ask')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const spinner = ora('Getting compliance answer...').start();
      try {
        const body = {
          workspace_id: options.workspace,
          question: options.question,
        };

        const data = await apiFetch('/api/compliance-qa', {
          method: 'POST',
          body: JSON.stringify(body),
        });

        spinner.succeed('Answer received');

        if (options.json) {
          console.log(JSON.stringify(data.data || data, null, 2));
          return;
        }

        const result = (data.data || data) as Record<string, unknown>;
        console.log(chalk.bold('\nCompliance Q&A:'));
        console.log(chalk.gray('─'.repeat(60)));
        console.log(`${chalk.bold('Question:')} ${options.question}`);
        console.log(`\n${chalk.bold('Answer:')}`);
        console.log((result.answer as string) || '-');

        const refs = result.references as Array<Record<string, unknown>> | undefined;
        if (refs && refs.length > 0) {
          console.log(`\n${chalk.bold('References:')}`);
          refs.forEach((ref: Record<string, unknown>, i: number) => {
            console.log(`  ${i + 1}. ${(ref.title as string) || ref}`);
          });
        }

        if (result.confidence) {
          console.log(chalk.gray(`\nConfidence: ${result.confidence}`));
        }
      } catch (error) {
        spinner.fail('Failed');
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  return aiCmd;
}
