import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { readFile, writeFile } from 'fs/promises';
import { basename } from 'path';
export function createImportExportCommand() {
    const importExportCmd = new Command('import')
        .description('Import data from files');
    // Import journal entries
    importExportCmd
        .command('journal-entries')
        .description('Import journal entries from CSV/Excel')
        .argument('<file-path>', 'CSV or Excel file path')
        .option('-w, --workspace <id>', 'Workspace ID (required)')
        .option('-s, --sheet <name>', 'Excel sheet name (default: first sheet)')
        .option('-p, --post', 'Auto-post entries after import', false)
        .action(async (filePath, options) => {
        if (!options.workspace) {
            console.error(chalk.red('Error: --workspace option is required'));
            process.exit(1);
        }
        const spinner = ora('Importing journal entries...').start();
        try {
            const fileBuffer = await readFile(filePath);
            const fileName = basename(filePath);
            const apiUrl = process.env.API_URL || 'https://api.finlaw.cloud';
            const formData = new FormData();
            formData.append('file', new Blob([fileBuffer]), fileName);
            formData.append('workspace_id', options.workspace);
            if (options.sheet) {
                formData.append('sheet_name', options.sheet);
            }
            if (options.post) {
                formData.append('auto_post', 'true');
            }
            const response = await fetch(`${apiUrl}/api/journal-entries/import`, {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) {
                throw new Error(`Import failed: ${response.status} ${response.statusText}`);
            }
            const result = await response.json();
            spinner.succeed('Import completed');
            console.log(chalk.bold('\nImport Summary:'));
            console.log(chalk.gray('─'.repeat(50)));
            console.log(`${chalk.bold('Total:')} ${result.total}`);
            console.log(`${chalk.green('✓ Success:')} ${result.success}`);
            console.log(`${chalk.red('✗ Failed:')} ${result.failed}`);
            const errors = result.errors;
            if (errors && errors.length > 0) {
                console.log(chalk.bold('\nErrors:'));
                errors.slice(0, 10).forEach((err) => {
                    console.log(chalk.red(`  Row ${err.row}: ${err.message}`));
                });
                if (errors.length > 10) {
                    console.log(chalk.gray(`  ... and ${errors.length - 10} more errors`));
                }
            }
        }
        catch (error) {
            spinner.fail('Import failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    return importExportCmd;
}
export function createExportCommand() {
    const exportCmd = new Command('export')
        .description('Export financial reports');
    // Export balance sheet
    exportCmd
        .command('balance-sheet')
        .description('Export balance sheet')
        .argument('<workspace-id>', 'Workspace ID')
        .option('-y, --year <year>', 'Year (YYYY)', String(new Date().getFullYear()))
        .option('-m, --month <month>', 'Month (1-12), omit for annual report')
        .option('-f, --format <format>', 'Output format (json|csv|xlsx)', 'json')
        .option('-o, --output <path>', 'Output file path')
        .action(async (workspaceId, options) => {
        const spinner = ora('Generating balance sheet...').start();
        try {
            const apiUrl = process.env.API_URL || 'https://api.finlaw.cloud';
            const params = new URLSearchParams({
                workspace_id: workspaceId,
                year: options.year,
            });
            if (options.month) {
                params.append('month', options.month);
            }
            const endpoint = options.format === 'json'
                ? `/api/reports/balance-sheet?${params.toString()}`
                : `/api/reports/balance-sheet/export?${params.toString()}&format=${options.format}`;
            const response = await fetch(`${apiUrl}${endpoint}`);
            if (!response.ok) {
                throw new Error(`Export failed: ${response.status} ${response.statusText}`);
            }
            if (options.format === 'json') {
                const data = await response.json();
                const outputPath = options.output || `balance-sheet-${options.year}${options.month ? '-' + options.month : ''}.json`;
                await writeFile(outputPath, JSON.stringify(data, null, 2));
                spinner.succeed(`Balance sheet exported: ${outputPath}`);
            }
            else {
                const buffer = await response.arrayBuffer();
                const ext = options.format === 'csv' ? 'csv' : 'xlsx';
                const outputPath = options.output || `balance-sheet-${options.year}${options.month ? '-' + options.month : ''}.${ext}`;
                await writeFile(outputPath, Buffer.from(buffer));
                spinner.succeed(`Balance sheet exported: ${outputPath}`);
            }
        }
        catch (error) {
            spinner.fail('Export failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Export income statement
    exportCmd
        .command('income-statement')
        .description('Export income statement (profit & loss)')
        .argument('<workspace-id>', 'Workspace ID')
        .option('-y, --year <year>', 'Year (YYYY)', String(new Date().getFullYear()))
        .option('-m, --month <month>', 'Month (1-12), omit for annual report')
        .option('-f, --format <format>', 'Output format (json|csv|xlsx)', 'json')
        .option('-o, --output <path>', 'Output file path')
        .action(async (workspaceId, options) => {
        const spinner = ora('Generating income statement...').start();
        try {
            const apiUrl = process.env.API_URL || 'https://api.finlaw.cloud';
            const params = new URLSearchParams({
                workspace_id: workspaceId,
                year: options.year,
            });
            if (options.month) {
                params.append('month', options.month);
            }
            const endpoint = options.format === 'json'
                ? `/api/reports/income-statement?${params.toString()}`
                : `/api/reports/income-statement/export?${params.toString()}&format=${options.format}`;
            const response = await fetch(`${apiUrl}${endpoint}`);
            if (!response.ok) {
                throw new Error(`Export failed: ${response.status} ${response.statusText}`);
            }
            if (options.format === 'json') {
                const data = await response.json();
                const outputPath = options.output || `income-statement-${options.year}${options.month ? '-' + options.month : ''}.json`;
                await writeFile(outputPath, JSON.stringify(data, null, 2));
                spinner.succeed(`Income statement exported: ${outputPath}`);
            }
            else {
                const buffer = await response.arrayBuffer();
                const ext = options.format === 'csv' ? 'csv' : 'xlsx';
                const outputPath = options.output || `income-statement-${options.year}${options.month ? '-' + options.month : ''}.${ext}`;
                await writeFile(outputPath, Buffer.from(buffer));
                spinner.succeed(`Income statement exported: ${outputPath}`);
            }
        }
        catch (error) {
            spinner.fail('Export failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Export cash flow statement
    exportCmd
        .command('cash-flow')
        .description('Export cash flow statement')
        .argument('<workspace-id>', 'Workspace ID')
        .option('-y, --year <year>', 'Year (YYYY)', String(new Date().getFullYear()))
        .option('-m, --month <month>', 'Month (1-12), omit for annual report')
        .option('-f, --format <format>', 'Output format (json|csv|xlsx)', 'json')
        .option('-o, --output <path>', 'Output file path')
        .action(async (workspaceId, options) => {
        const spinner = ora('Generating cash flow statement...').start();
        try {
            const apiUrl = process.env.API_URL || 'https://api.finlaw.cloud';
            const params = new URLSearchParams({
                workspace_id: workspaceId,
                year: options.year,
            });
            if (options.month) {
                params.append('month', options.month);
            }
            const endpoint = options.format === 'json'
                ? `/api/reports/cash-flow?${params.toString()}`
                : `/api/reports/cash-flow/export?${params.toString()}&format=${options.format}`;
            const response = await fetch(`${apiUrl}${endpoint}`);
            if (!response.ok) {
                throw new Error(`Export failed: ${response.status} ${response.statusText}`);
            }
            if (options.format === 'json') {
                const data = await response.json();
                const outputPath = options.output || `cash-flow-${options.year}${options.month ? '-' + options.month : ''}.json`;
                await writeFile(outputPath, JSON.stringify(data, null, 2));
                spinner.succeed(`Cash flow statement exported: ${outputPath}`);
            }
            else {
                const buffer = await response.arrayBuffer();
                const ext = options.format === 'csv' ? 'csv' : 'xlsx';
                const outputPath = options.output || `cash-flow-${options.year}${options.month ? '-' + options.month : ''}.${ext}`;
                await writeFile(outputPath, Buffer.from(buffer));
                spinner.succeed(`Cash flow statement exported: ${outputPath}`);
            }
        }
        catch (error) {
            spinner.fail('Export failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    return exportCmd;
}
