import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile } from 'fs/promises';

const execAsync = promisify(exec);

export function createLogsCommand() {
  const logsCmd = new Command('logs')
    .description('View system logs')
    .option('-n, --tail <lines>', 'Number of lines to show', '100')
    .option('-f, --follow', 'Follow log output (like tail -f)', false)
    .option('-s, --source <source>', 'Log source (pm2|nginx|postgres|all)', 'pm2')
    .action(async (options) => {
      try {
        const lines = parseInt(options.tail);

        if (options.source === 'pm2' || options.source === 'all') {
          console.log(chalk.bold('\n=== PM2 Logs (ssos-backend) ===\n'));

          if (options.follow) {
            console.log(chalk.gray('Following logs... (Press Ctrl+C to exit)\n'));
            const child = exec('pm2 logs ssos-backend');

            child.stdout?.on('data', (data) => {
              process.stdout.write(data);
            });

            child.stderr?.on('data', (data) => {
              process.stderr.write(chalk.red(data));
            });

            // Keep process alive
            await new Promise(() => {});
          } else {
            const { stdout } = await execAsync(`pm2 logs ssos-backend --lines ${lines} --nostream`);
            console.log(stdout);
          }
        }

        if (options.source === 'nginx' || options.source === 'all') {
          console.log(chalk.bold('\n=== Nginx Access Log ===\n'));
          try {
            const { stdout } = await execAsync(`tail -n ${lines} /var/log/nginx/access.log 2>/dev/null || echo "Access log not found or no permission"`);
            console.log(stdout);
          } catch (error) {
            console.log(chalk.yellow('Nginx logs not accessible (permission denied or not found)'));
          }
        }

        if (options.source === 'postgres' || options.source === 'all') {
          console.log(chalk.bold('\n=== PostgreSQL Log ===\n'));
          try {
            const { stdout } = await execAsync(`tail -n ${lines} /var/log/postgresql/postgresql-*.log 2>/dev/null || echo "PostgreSQL log not found or no permission"`);
            console.log(stdout);
          } catch (error) {
            console.log(chalk.yellow('PostgreSQL logs not accessible (permission denied or not found)'));
          }
        }
      } catch (error) {
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  return logsCmd;
}

export function createPM2Command() {
  const pm2Cmd = new Command('pm2')
    .description('PM2 process management');

  // PM2 status
  pm2Cmd
    .command('status')
    .description('Show PM2 process status')
    .action(async () => {
      try {
        const { stdout } = await execAsync('pm2 jlist');
        const processes: Array<Record<string, unknown>> = JSON.parse(stdout) as Array<Record<string, unknown>>;

        if (processes.length === 0) {
          console.log(chalk.yellow('No PM2 processes running'));
          return;
        }

        console.log(chalk.bold('\nPM2 Process Status:\n'));
        console.log(chalk.gray('─'.repeat(100)));

        (processes as Array<Record<string, unknown>>).forEach((proc: Record<string, unknown>) => {
          const pm2env = proc.pm2_env as Record<string, unknown>;
          const status = pm2env.status as string;
          const statusColor = status === 'online' ? chalk.green : chalk.red;
          const monit = proc.monit as Record<string, unknown>;
          const memory = ((monit.memory as number) / 1024 / 1024).toFixed(0);
          const cpu = monit.cpu as number;
          const uptime = formatUptime(pm2env.pm_uptime as number);
          const restarts = pm2env.restart_time as number;

          console.log(
            `${(proc.name as string).padEnd(20)} | ` +
            `${statusColor(status.padEnd(10))} | ` +
            `PID: ${String(proc.pid).padEnd(8)} | ` +
            `Memory: ${String(memory + 'MB').padEnd(10)} | ` +
            `CPU: ${String(cpu + '%').padEnd(8)} | ` +
            `Uptime: ${uptime.padEnd(12)} | ` +
            `Restarts: ${restarts}`
          );
        });

        console.log(chalk.gray('─'.repeat(100)));
        console.log(chalk.gray(`\nTotal processes: ${processes.length}`));
      } catch (error) {
        console.error(chalk.red('Failed to get PM2 status'));
        console.error(chalk.gray('Make sure PM2 is installed and running'));
        process.exit(1);
      }
    });

  // PM2 restart
  pm2Cmd
    .command('restart')
    .description('Restart PM2 process')
    .argument('<name>', 'Process name')
    .action(async (name: string) => {
      const spinner = ora(`Restarting ${name}...`).start();
      try {
        await execAsync(`pm2 restart ${name}`);
        spinner.succeed(`Process restarted: ${name}`);
      } catch (error) {
        spinner.fail('Restart failed');
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  // PM2 stop
  pm2Cmd
    .command('stop')
    .description('Stop PM2 process')
    .argument('<name>', 'Process name')
    .action(async (name: string) => {
      const spinner = ora(`Stopping ${name}...`).start();
      try {
        await execAsync(`pm2 stop ${name}`);
        spinner.succeed(`Process stopped: ${name}`);
      } catch (error) {
        spinner.fail('Stop failed');
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  // PM2 start
  pm2Cmd
    .command('start')
    .description('Start PM2 process')
    .argument('<name>', 'Process name')
    .action(async (name: string) => {
      const spinner = ora(`Starting ${name}...`).start();
      try {
        await execAsync(`pm2 start ${name}`);
        spinner.succeed(`Process started: ${name}`);
      } catch (error) {
        spinner.fail('Start failed');
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  return pm2Cmd;
}

function formatUptime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}
