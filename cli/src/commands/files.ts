import { Command } from 'commander';
import { query } from '../db.js';
import { table } from 'table';
import chalk from 'chalk';
import ora from 'ora';
import { readFile, writeFile } from 'fs/promises';
import { basename } from 'path';

export function createFilesCommand() {
  const filesCmd = new Command('files')
    .description('File management');

  // List files
  filesCmd
    .command('list')
    .description('List all uploaded files')
    .option('-w, --workspace <id>', 'Filter by workspace ID')
    .option('-t, --type <type>', 'Filter by file type (invoice|contract|bank_statement|attachment|other)')
    .option('-l, --limit <number>', 'Limit results', '50')
    .action(async (options) => {
      try {
        const params: Array<string | number> = [];
        let paramCount = 1;

        // Query across known file-referencing tables since no centralized file_uploads table exists
        let sql = `
          SELECT id, filename, file_type, file_size, workspace_id, table_source, file_url, uploaded_at FROM (
            SELECT id, SPLIT_PART(file_url,'/', array_length(STRING_TO_ARRAY(file_url,'/'),1)) as filename, 'contract' as file_type, NULL::bigint as file_size, workspace_id, 'contracts' as table_source, file_url, created_at as uploaded_at FROM contracts WHERE file_url IS NOT NULL
            UNION ALL
            SELECT id, SPLIT_PART(file_url,'/', array_length(STRING_TO_ARRAY(file_url,'/'),1)) as filename, 'demand_letter' as file_type, NULL::bigint as file_size, workspace_id, 'demand_letters' as table_source, file_url, created_at as uploaded_at FROM demand_letters WHERE file_url IS NOT NULL
          ) AS all_files
          WHERE 1=1
        `;

        if (options.workspace) {
          sql += ` AND workspace_id = $${paramCount++}`;
          params.push(options.workspace);
        }

        if (options.type) {
          sql += ` AND file_type = $${paramCount++}`;
          params.push(options.type);
        }

        sql += ` ORDER BY uploaded_at DESC LIMIT $${paramCount}`;
        params.push(parseInt(options.limit));

        const result = await query(sql, params);

        if (result.rows.length === 0) {
          console.log(chalk.yellow('No files found'));
          return;
        }

        const data = [
          ['ID', 'Filename', 'Type', 'Source Table', 'Uploaded'],
          ...result.rows.map(row => [
            row.id,
            (row.filename as string)?.length > 30
              ? (row.filename as string).substring(0, 27) + '...'
              : row.filename,
            row.file_type,
            row.table_source,
            new Date(row.uploaded_at).toLocaleDateString()
          ])
        ];

        console.log(table(data));
        console.log(chalk.gray(`\nTotal files: ${result.rows.length}`));
      } catch (error) {
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  // Get file details
  filesCmd
    .command('get')
    .description('Get file details by ID')
    .argument('<file-id>', 'File ID')
    .action(async (fileId: string) => {
      try {
        // Search across all file-referencing tables
        const result = await query(`
          SELECT * FROM (
            SELECT id, file_url, 'contracts' as table_source, workspace_id, created_at as uploaded_at FROM contracts WHERE id = $1 AND file_url IS NOT NULL
            UNION ALL
            SELECT id, file_url, 'demand_letters' as table_source, workspace_id, created_at as uploaded_at FROM demand_letters WHERE id = $1 AND file_url IS NOT NULL
          ) AS all_files
          LIMIT 1
        `, [fileId]);

        if (result.rows.length === 0) {
          console.log(chalk.yellow('File not found'));
          return;
        }

        const file = result.rows[0];
        const filename = (file.file_url as string)?.split('/').pop() || '-';
        console.log(chalk.bold('\nFile Details:'));
        console.log(chalk.gray('─'.repeat(50)));
        console.log(`${chalk.bold('ID:')} ${file.id}`);
        console.log(`${chalk.bold('Filename:')} ${filename}`);
        console.log(`${chalk.bold('URL:')} ${file.file_url}`);
        console.log(`${chalk.bold('Source Table:')} ${file.table_source}`);
        console.log(`${chalk.bold('Uploaded:')} ${new Date(file.uploaded_at).toLocaleString()}`);
      } catch (error) {
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  // Delete file
  filesCmd
    .command('delete')
    .description('Delete a file by ID')
    .argument('<file-id>', 'File ID')
    .action(async (fileId: string) => {
      const spinner = ora('Deleting file...').start();
      try {
        // First find the file across all tables
        const fileResult = await query(`
          SELECT * FROM (
            SELECT id, file_url FROM contracts WHERE id = $1 AND file_url IS NOT NULL
            UNION ALL
            SELECT id, file_url FROM demand_letters WHERE id = $1 AND file_url IS NOT NULL
          ) AS all_files
          LIMIT 1
        `, [fileId]);

        if (fileResult.rows.length === 0) {
          spinner.fail('File not found');
          return;
        }

        const fileUrl = fileResult.rows[0].file_url as string;
        const filename = fileUrl.split('/').pop() || '';
        const apiUrl = process.env.API_URL || 'https://api.finlaw.cloud';

        // Delete via API
        const response = await fetch(`${apiUrl}/api/storage/file?filename=${encodeURIComponent(filename)}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${process.env.SSOS_API_KEY || ''}` },
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error((errData as Record<string, unknown>).error as string || `Delete failed: ${response.status}`);
        }

        spinner.succeed(`File deleted: ${filename}`);
        console.log(chalk.gray('Note: Database reference may still exist. Remove the parent record to fully clean up.'));
      } catch (error) {
        spinner.fail('Delete failed');
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  // Upload file (requires API URL)
  filesCmd
    .command('upload')
    .description('Upload a file to server')
    .argument('<file-path>', 'Local file path')
    .option('-w, --workspace <id>', 'Workspace ID (required)')
    .option('-t, --type <type>', 'File type (invoice|contract|bank_statement|attachment|other)', 'other')
    .option('-d, --description <text>', 'File description')
    .action(async (filePath: string, options) => {
      if (!options.workspace) {
        console.error(chalk.red('Error: --workspace option is required'));
        process.exit(1);
      }

      const spinner = ora('Uploading file...').start();
      try {
        const fileBuffer = await readFile(filePath);
        const fileName = basename(filePath);
        const apiUrl = process.env.API_URL || 'https://api.finlaw.cloud';

        // Create FormData
        const formData = new FormData();
        formData.append('file', new Blob([fileBuffer]), fileName);
        formData.append('file_type', options.type);
        formData.append('workspace_id', options.workspace);
        if (options.description) {
          formData.append('description', options.description);
        }

        // Upload via API
        const token = process.env.SSOS_API_KEY || process.env.API_TOKEN || process.env.SSOS_ACCESS_TOKEN;
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        if (options.workspace) headers['x-workspace-id'] = options.workspace;
        const response = await fetch(`${apiUrl}/api/storage/upload`, {
          method: 'POST',
          headers,
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json() as Record<string, unknown>;
        spinner.succeed('File uploaded successfully');
        console.log(chalk.bold('\nUpload Details:'));
        console.log(`${chalk.bold('Filename:')} ${result.filename || fileName}`);
        console.log(`${chalk.bold('Size:')} ${formatFileSize(fileBuffer.length)}`);
        console.log(`${chalk.bold('URL:')} ${result.url}`);
      } catch (error) {
        spinner.fail('Upload failed');
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  // Download file
  filesCmd
    .command('download')
    .description('Download a file by ID')
    .argument('<file-id>', 'File ID')
    .option('-o, --output <path>', 'Output file path (default: original filename)')
    .action(async (fileId: string, options) => {
      const spinner = ora('Downloading file...').start();
      try {
        // Find file URL across all tables
        const result = await query(`
          SELECT file_url FROM (
            SELECT id, file_url FROM contracts WHERE id = $1 AND file_url IS NOT NULL
            UNION ALL
            SELECT id, file_url FROM demand_letters WHERE id = $1 AND file_url IS NOT NULL
          ) AS all_files
          LIMIT 1
        `, [fileId]);

        if (result.rows.length === 0) {
          spinner.fail('File not found');
          return;
        }

        const fileUrl = result.rows[0].file_url as string;
        const apiUrl = process.env.API_URL || 'https://api.finlaw.cloud';

        // Download file via its URL
        const downloadUrl = fileUrl.startsWith('http') ? fileUrl : `${apiUrl}${fileUrl}`;
        const response = await fetch(downloadUrl);
        if (!response.ok) {
          throw new Error(`Download failed: ${response.status} ${response.statusText}`);
        }

        const buffer = await response.arrayBuffer();
        const filename = fileUrl.split('/').pop() || 'download';
        const outputPath = options.output || filename;

        await writeFile(outputPath, Buffer.from(buffer));

        spinner.succeed(`File downloaded: ${outputPath}`);
        console.log(chalk.gray(`Size: ${formatFileSize(buffer.byteLength)}`));
      } catch (error) {
        spinner.fail('Download failed');
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  return filesCmd;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}
