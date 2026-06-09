import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { apiFetch, apiFetchRaw } from '../lib/api-client.js';

export function createApiCommand(): Command {
  const apiCmd = new Command('api')
    .description('Raw HTTP API call — universal escape hatch for any endpoint');

  apiCmd
    .command('call')
    .description('Make a raw API request to any endpoint')
    .argument('<method>', 'HTTP method (GET, POST, PATCH, PUT, DELETE)')
    .argument('<path>', 'API path (e.g., /api/annual-bonus, /api/admin/users)')
    .option('--data <json>', 'Request body as JSON string')
    .option('--query <string>', 'Query string (e.g., workspace_id=xxx&page=1)')
    .option('-w, --workspace <id>', 'Workspace ID (sets x-workspace-id header)')
    .option('--raw', 'Output raw response body (for binary: Excel, file downloads)')
    .action(async (method: string, path: string, options) => {
      const spinner = ora(`${method} ${path}...`).start();
      try {
        let url = path;
        if (options.query) url += (path.includes('?') ? '&' : '?') + options.query;

        const headers: Record<string, string> = {};
        if (options.workspace) {
          headers['x-workspace-id'] = options.workspace;
        }

        const fetchOpts: RequestInit = { method: method.toUpperCase() };
        if (options.data) {
          const body = JSON.parse(options.data);
          if (options.workspace && !body.workspace_id) {
            body.workspace_id = options.workspace;
          }
          fetchOpts.body = JSON.stringify(body);
        }
        if (Object.keys(headers).length > 0) {
          fetchOpts.headers = headers;
        }

        if (options.raw) {
          const result = await apiFetchRaw(url, fetchOpts);
          spinner.stop();
          process.stdout.write(result.body);
        } else {
          const data = await apiFetch(url, fetchOpts);
          spinner.stop();
          console.log(JSON.stringify(data, null, 2));
        }
      } catch (error) {
        spinner.fail('Failed');
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  // Shortcut: api get <path>
  apiCmd
    .command('get')
    .description('Shortcut for GET request')
    .argument('<path>', 'API path')
    .option('--query <string>', 'Query string')
    .option('-w, --workspace <id>', 'Workspace ID (sets x-workspace-id header)')
    .option('--raw', 'Output raw response body (for binary: Excel, file downloads)')
    .action(async (path: string, options) => {
      const spinner = ora(`GET ${path}...`).start();
      try {
        let url = path;
        if (options.query) url += (path.includes('?') ? '&' : '?') + options.query;

        const headers: Record<string, string> = {};
        if (options.workspace) {
          headers['x-workspace-id'] = options.workspace;
        }

        if (options.raw) {
          const result = await apiFetchRaw(url, { headers: Object.keys(headers).length > 0 ? headers : undefined });
          spinner.stop();
          process.stdout.write(result.body);
        } else {
          const data = await apiFetch(url, { headers: Object.keys(headers).length > 0 ? headers : undefined });
          spinner.stop();
          console.log(JSON.stringify(data, null, 2));
        }
      } catch (error) {
        spinner.fail('Failed');
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  // Shortcut: api post <path>
  apiCmd
    .command('post')
    .description('Shortcut for POST request')
    .argument('<path>', 'API path')
    .requiredOption('--data <json>', 'Request body as JSON')
    .option('--query <string>', 'Query string')
    .option('-w, --workspace <id>', 'Workspace ID (sets x-workspace-id header)')
    .action(async (path: string, options) => {
      const spinner = ora(`POST ${path}...`).start();
      try {
        let url = path;
        if (options.query) url += (path.includes('?') ? '&' : '?') + options.query;

        const headers: Record<string, string> = {};
        if (options.workspace) {
          headers['x-workspace-id'] = options.workspace;
        }

        const body = JSON.parse(options.data);
        if (options.workspace && !body.workspace_id) {
          body.workspace_id = options.workspace;
        }

        const data = await apiFetch(url, {
          method: 'POST',
          body: JSON.stringify(body),
          headers: Object.keys(headers).length > 0 ? headers : undefined,
        });
        spinner.stop();
        console.log(JSON.stringify(data, null, 2));
      } catch (error) {
        spinner.fail('Failed');
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  return apiCmd;
}
