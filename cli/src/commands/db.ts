import { Command } from 'commander';
import { query, pool } from '../db.js';
import { table } from 'table';
import chalk from 'chalk';
import ora from 'ora';
import { readFile, writeFile } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export function createDbCommand() {
  const dbCmd = new Command('db')
    .description('Database operations');

  // Query command
  dbCmd
    .command('query')
    .description('Execute a SQL query')
    .argument('<sql>', 'SQL query to execute')
    .option('-f, --format <type>', 'Output format (table|json)', 'table')
    .action(async (sql: string, options) => {
      const spinner = ora('Executing query...').start();
      try {
        const result = await query(sql);
        spinner.succeed('Query executed successfully');

        if (result.rows.length === 0) {
          console.log(chalk.yellow('No rows returned'));
          return;
        }

        if (options.format === 'json') {
          console.log(JSON.stringify(result.rows, null, 2));
        } else {
          const headers = Object.keys(result.rows[0]);
          const data = [
            headers,
            ...result.rows.map(row => headers.map(h => String(row[h] ?? '')))
          ];
          console.log(table(data));
        }

        console.log(chalk.gray(`\nRows: ${result.rows.length}`));
      } catch (error) {
        spinner.fail('Query failed');
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  // Backup command
  dbCmd
    .command('backup')
    .description('Create database backup')
    .option('-o, --output <path>', 'Output file path', `backup-${Date.now()}.sql`)
    .action(async (options) => {
      const spinner = ora('Creating backup...').start();
      try {
        const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = process.env;

        const cmd = `PGPASSWORD="${DB_PASSWORD}" pg_dump -h ${DB_HOST || 'localhost'} -p ${DB_PORT || '5432'} -U ${DB_USER || 'ssos_user'} -d ${DB_NAME || 'ssos'} -F p -f ${options.output}`;

        await execAsync(cmd);
        spinner.succeed(`Backup created: ${options.output}`);
      } catch (error) {
        spinner.fail('Backup failed');
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  // Restore command
  dbCmd
    .command('restore')
    .description('Restore database from backup')
    .argument('<file>', 'Backup file path')
    .action(async (file: string) => {
      const spinner = ora('Restoring database...').start();
      try {
        const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = process.env;

        const cmd = `PGPASSWORD="${DB_PASSWORD}" psql -h ${DB_HOST || 'localhost'} -p ${DB_PORT || '5432'} -U ${DB_USER || 'ssos_user'} -d ${DB_NAME || 'ssos'} -f ${file}`;

        await execAsync(cmd);
        spinner.succeed('Database restored successfully');
      } catch (error) {
        spinner.fail('Restore failed');
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  // Stats command
  dbCmd
    .command('stats')
    .description('Show database statistics')
    .action(async () => {
      const spinner = ora('Fetching stats...').start();
      try {
        const stats = await query(`
          SELECT
            schemaname,
            relname as tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) AS size,
            n_live_tup AS rows
          FROM pg_stat_user_tables
          ORDER BY pg_total_relation_size(schemaname||'.'||relname) DESC
          LIMIT 20
        `);

        spinner.succeed('Database statistics');

        const data = [
          ['Schema', 'Table', 'Size', 'Rows'],
          ...stats.rows.map(row => [
            row.schemaname,
            row.tablename,
            row.size,
            String(row.rows)
          ])
        ];

        console.log(table(data));
      } catch (error) {
        spinner.fail('Failed to fetch stats');
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  // Connections command
  dbCmd
    .command('connections')
    .description('Show active database connections')
    .action(async () => {
      try {
        const result = await query(`
          SELECT
            pid,
            usename,
            application_name,
            client_addr,
            state,
            query_start,
            state_change
          FROM pg_stat_activity
          WHERE datname = current_database()
          ORDER BY query_start DESC
        `);

        const data = [
          ['PID', 'User', 'App', 'Client', 'State', 'Query Start'],
          ...result.rows.map(row => [
            String(row.pid),
            row.usename,
            row.application_name,
            row.client_addr || 'local',
            row.state,
            new Date(row.query_start).toLocaleString()
          ])
        ];

        console.log(table(data));
        console.log(chalk.gray(`\nTotal connections: ${result.rows.length}`));
      } catch (error) {
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  return dbCmd;
}
