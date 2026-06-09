#!/usr/bin/env node
import { Command } from 'commander';
import { config } from 'dotenv';
import chalk from 'chalk';
import { createDbCommand } from './commands/db.js';
import { createUsersCommand } from './commands/users.js';
import { createWorkspaceCommand } from './commands/workspace.js';
import { createFilesCommand } from './commands/files.js';
import { createImportExportCommand, createExportCommand } from './commands/import-export.js';
import { createAICommand } from './commands/ai.js';
import { createLogsCommand, createPM2Command } from './commands/logs.js';
import { createAccountingCommand } from './commands/accounting.js';
import { createTaxCommand } from './commands/tax.js';
import { createInvoiceCommand } from './commands/invoice.js';
import { createAIBookkeepingCommand } from './commands/ai-bookkeeping.js';
import { createPeriodCommand } from './commands/period.js';
import { createAuthCommand } from './commands/auth.js';
import { createWorkspaceApiCommand } from './commands/workspace-api.js';
import { createApiKeyCommand } from './commands/api-key.js';
import { createAdminCommand } from './commands/admin.js';
import { createMyCommand } from './commands/my.js';
import { createCrudCommand } from './commands/crud.js';
import { createApiCommand } from './commands/api.js';
import { registerSetupCommand } from './commands/setup.js';

// Load environment variables
config();

const program = new Command();

program
  .name('startupos-cli')
  .description('Startup OS (创业OS) 财务管理系统 CLI 工具 - AI Native\n\n' +
    '🚀 一键安装 AI 工具：\n' +
    '  setup                                安装 MCP + Skill\n' +
    '  setup --mcp                          仅安装 MCP 服务器\n' +
    '  setup --skill                        仅安装 Claude Skill\n' +
    '  doctor                               检查工具健康状态\n\n' +
    '📦 数据操作统一使用 crud 命令：\n' +
    '  crud list <resource-type>           列出资源\n' +
    '  crud get <resource-type> <id>       获取单个资源\n' +
    '  crud create <resource-type>         创建资源\n' +
    '  crud update <resource-type> <id>    更新资源\n' +
    '  crud delete <resource-type> <id>    删除资源\n' +
    '  crud action <resource-type> <id> <action>  执行操作\n' +
    '  crud list-types                     查看所有 127 种资源类型\n\n' +
    '💼 业务逻辑使用专用命令：accounting, tax, invoice, period')
  .version('1.0.0');

// Add commands
program.addCommand(createDbCommand());
program.addCommand(createUsersCommand());
program.addCommand(createWorkspaceCommand());
program.addCommand(createFilesCommand());
program.addCommand(createImportExportCommand());
program.addCommand(createExportCommand());
program.addCommand(createAICommand());
program.addCommand(createLogsCommand());
program.addCommand(createPM2Command());
program.addCommand(createAccountingCommand());
program.addCommand(createTaxCommand());
program.addCommand(createInvoiceCommand());
program.addCommand(createAIBookkeepingCommand());
program.addCommand(createPeriodCommand());
program.addCommand(createAuthCommand());
program.addCommand(createWorkspaceApiCommand());
program.addCommand(createApiKeyCommand());
program.addCommand(createAdminCommand());
program.addCommand(createMyCommand());
program.addCommand(createCrudCommand());
program.addCommand(createApiCommand());

// AI Native setup commands
registerSetupCommand(program);

// Health check
program
  .command('health')
  .description('Check system health')
  .action(async () => {
    console.log(chalk.bold('Startup OS System Health Check\n'));

    // Check database connection
    try {
      const { query } = await import('./db.js');
      await query('SELECT 1');
      console.log(chalk.green('✓ Database: Connected'));
    } catch (error) {
      console.log(chalk.red('✗ Database: Disconnected'));
      console.error(chalk.gray(error instanceof Error ? error.message : String(error)));
    }

    // Check backend API
    try {
      const apiUrl = process.env.API_URL || 'https://api.finlaw.cloud';
      const response = await fetch(`${apiUrl}/health`);
      if (response.ok) {
        console.log(chalk.green(`✓ Backend API: Online (${apiUrl})`));
      } else {
        console.log(chalk.yellow(`⚠ Backend API: Returned ${response.status}`));
      }
    } catch (error) {
      console.log(chalk.red('✗ Backend API: Offline'));
    }

    // Check PM2
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      const { stdout } = await execAsync('pm2 jlist');
      const processes = JSON.parse(stdout);
      const ssosBackend = processes.find((p: any) => p.name === 'ssos-backend' || p.name === 'startupos-backend');

      if (ssosBackend && ssosBackend.pm2_env.status === 'online') {
        console.log(chalk.green(`✓ PM2: ${ssosBackend.name} is online`));
      } else {
        console.log(chalk.yellow('⚠ PM2: ssos-backend is not running'));
      }
    } catch (error) {
      console.log(chalk.gray('⚠ PM2: Not available or not configured'));
    }

    console.log();
  });

// Version info
program
  .command('info')
  .description('Show system information')
  .action(() => {
    console.log(chalk.bold('Startup OS System Information\n'));
    console.log(`${chalk.bold('CLI Version:')} 1.0.0`);
    console.log(`${chalk.bold('Node Version:')} ${process.version}`);
    console.log(`${chalk.bold('Platform:')} ${process.platform}`);
    console.log(`${chalk.bold('Database Host:')} ${process.env.DB_HOST || 'localhost'}`);
    console.log(`${chalk.bold('Database Name:')} ${process.env.DB_NAME || 'ssos'}`);
    console.log(`${chalk.bold('API URL:')} ${process.env.API_URL || 'https://api.finlaw.cloud'}`);
    console.log();
  });

program.parse();
