import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { loadAuth, saveAuth, clearAuth, getApiUrl, getAuthMethod, getAuthHeaders } from '../lib/api-client.js';

export function createAuthCommand() {
  const authCmd = new Command('auth')
    .description('Authentication management');

  // Login
  authCmd
    .command('login')
    .description('Authenticate with SSOS')
    .option('--api-key <key>', 'API Key (sk_live_...) — workspace-scoped access')
    .option('--email <email>', 'Email for password login')
    .option('--password <password>', 'Password')
    .option('--token <jwt>', 'JWT access token — for admin-level access')
    .action(async (options) => {
      if (options.token) {
        // JWT token — validate by calling admin permissions endpoint
        const spinner = ora('Validating JWT token...').start();
        try {
          const apiUrl = getApiUrl();
          const response = await fetch(`${apiUrl}/api/admin/me/permissions`, {
            headers: { 'Authorization': `Bearer ${options.token}` },
          });

          if (!response.ok) {
            const errText = await response.text().catch(() => 'Unknown error');
            throw new Error(`Invalid or insufficient JWT token: ${response.status} ${errText}`);
          }

          const data = await response.json() as Record<string, unknown>;
          const perms = data as { email?: string; is_super_admin?: boolean; roles?: string[]; permissions?: string[] };

          await saveAuth({
            method: 'jwt',
            userId: 'jwt-user',
            email: perms.email || 'jwt',
            accessToken: options.token,
            savedAt: Date.now(),
          });

          spinner.succeed('Authenticated with JWT token');
          if (perms.is_super_admin) {
            console.log(chalk.green('  Role: Super Admin (full access)'));
          } else if (perms.roles?.length) {
            console.log(chalk.blue(`  Roles: ${perms.roles.join(', ')}`));
            console.log(chalk.gray(`  Permissions: ${(perms.permissions || []).length} granted`));
          }
        } catch (error) {
          spinner.fail('Authentication failed');
          console.error(chalk.red(error instanceof Error ? error.message : String(error)));
          process.exit(1);
        }
      } else if (options.apiKey) {
        const spinner = ora('Authenticating with API Key...').start();
        try {
          const apiUrl = getApiUrl();
          const response = await fetch(`${apiUrl}/api/workspaces`, {
            headers: {
              'Authorization': `Bearer ${options.apiKey}`,
            },
          });

          if (!response.ok) {
            throw new Error('Invalid API Key');
          }

          await saveAuth({
            method: 'api-key',
            userId: 'api-key',
            email: 'api-key',
            apiKey: options.apiKey,
            apiKeyPrefix: options.apiKey.substring(0, 16),
            savedAt: Date.now(),
          });

          spinner.succeed('Authenticated with API Key');
        } catch (error) {
          spinner.fail('Authentication failed');
          console.error(chalk.red(error instanceof Error ? error.message : String(error)));
          process.exit(1);
        }
      } else if (options.email && options.password) {
        const spinner = ora('Authenticating...').start();
        try {
          const apiUrl = getApiUrl();
          const response = await fetch(`${apiUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: options.email, password: options.password }),
          });

          if (!response.ok) {
            throw new Error('Invalid credentials');
          }

          const data = await response.json() as Record<string, unknown>;
          const authData = (data.data || data) as Record<string, unknown>;
          await saveAuth({
            method: 'password',
            userId: (authData.user as Record<string, unknown>)?.id as string || options.email,
            email: options.email,
            accessToken: authData.access_token as string,
            refreshToken: authData.refresh_token as string,
            expiresAt: Date.now() + 50 * 60 * 1000,
            savedAt: Date.now(),
          });

          spinner.succeed(`Authenticated as ${options.email}`);
        } catch (error) {
          spinner.fail('Authentication failed');
          console.error(chalk.red(error instanceof Error ? error.message : String(error)));
          process.exit(1);
        }
      } else {
        console.log(chalk.bold('SSOS Authentication'));
        console.log(chalk.gray('─'.repeat(50)));
        console.log('Usage:');
        console.log('  ssos-cli auth login --api-key sk_live_xxx      (workspace user)');
        console.log('  ssos-cli auth login --email <e> --password <p>  (workspace user)');
        console.log('  ssos-cli auth login --token <jwt>               (admin user)');
        console.log();
        console.log('Or set environment variables:');
        console.log('  export SSOS_API_KEY=sk_live_xxx        (workspace user)');
        console.log('  export SSOS_ACCESS_TOKEN=<jwt>         (admin user)');
      }
    });

  // Logout
  authCmd
    .command('logout')
    .description('Logout and clear saved credentials')
    .action(async () => {
      await clearAuth();
      console.log(chalk.green('✓ Logged out. Credentials cleared.'));
    });

  // Status
  authCmd
    .command('status')
    .description('Show current authentication status')
    .action(async () => {
      const auth = await loadAuth();
      if (!auth) {
        console.log(chalk.yellow('Not authenticated'));
        console.log(chalk.gray('Run "ssos-cli auth login" or set SSOS_API_KEY / SSOS_ACCESS_TOKEN'));
        return;
      }

      console.log(chalk.bold('\nAuthentication Status:'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(`${chalk.bold('Method:')} ${auth.method}`);
      console.log(`${chalk.bold('Email:')} ${auth.email}`);
      if (auth.apiKeyPrefix) {
        console.log(`${chalk.bold('API Key:')} ${auth.apiKeyPrefix}...`);
      }
      console.log(`${chalk.bold('Saved:')} ${new Date(auth.savedAt).toLocaleString()}`);
      if (auth.expiresAt) {
        const expired = Date.now() > auth.expiresAt;
        const color = expired ? chalk.red : chalk.green;
        console.log(`${chalk.bold('Token Expires:')} ${color(new Date(auth.expiresAt).toLocaleString())}`);
      }

      // If using JWT, try to show admin permissions
      if (auth.method === 'jwt' && auth.accessToken) {
        try {
          const apiUrl = getApiUrl();
          const response = await fetch(`${apiUrl}/api/admin/me/permissions`, {
            headers: { 'Authorization': `Bearer ${auth.accessToken}` },
          });
          if (response.ok) {
            const perms = await response.json() as Record<string, unknown>;
            console.log(chalk.gray('─'.repeat(50)));
            if (perms.is_super_admin) {
              console.log(`${chalk.bold('Role:')} ${chalk.green('Super Admin')}`);
              console.log(chalk.gray('  All permissions granted'));
            } else {
              const roles = (perms.roles as string[]) || [];
              const permissions = (perms.permissions as string[]) || [];
              console.log(`${chalk.bold('Roles:')} ${chalk.blue(roles.join(', ') || 'none')}`);
              console.log(`${chalk.bold('Permissions:')} ${permissions.length > 0 ? chalk.green(String(permissions.length)) : chalk.yellow('none')}`);
              if (permissions.length > 0) {
                permissions.slice(0, 10).forEach((p: string) => console.log(chalk.gray(`  - ${p}`)));
                if (permissions.length > 10) console.log(chalk.gray(`  ... and ${permissions.length - 10} more`));
              }
            }
          }
        } catch {
          // Silently ignore — permissions display is best-effort
        }
      }
    });

  return authCmd;
}
