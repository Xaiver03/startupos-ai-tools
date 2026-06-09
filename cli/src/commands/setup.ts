import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import {
  detectInstalledIDEs,
  addMCPServersToIDE,
  getMCPServerConfigs,
  getIDESkillPath,
  type IDEConfig,
} from '../lib/ide-adapter.js';

/**
 * Setup command - AI Native tooling installation
 *
 * One-line setup for CLI, MCP servers, and Claude Skills
 * Automatically detects and configures all AI IDEs
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

interface SetupOptions {
  all?: boolean;
  mcp?: boolean;
  skill?: boolean;
  yes?: boolean;
}

function log(message: string, color: keyof typeof COLORS = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function getClaudeConfigPath(): string {
  return path.join(os.homedir(), '.claude.json');
}

function getClaudeSkillsPath(): string {
  return path.join(os.homedir(), '.claude', 'skills', 'startupos');
}

function getMcpPackagePath(): string {
  // Assume MCP packages are built in the same repo
  const cliDir = path.dirname(path.dirname(__dirname)); // ai-tools/cli
  return path.join(path.dirname(cliDir), 'mcp-suite'); // ai-tools/mcp-suite
}

async function setupMcpServers(): Promise<void> {
  log('\n🔧 Setting up Startup OS MCP Servers...', 'blue');

  const mcpSuitePath = getMcpPackagePath();

  // Check if MCP suite is built
  const mcpPackages = [
    'core',
    'accounting',
    'hr',
    'ai',
    'legal',
  ];

  const missingPackages: string[] = [];
  for (const pkg of mcpPackages) {
    const distPath = path.join(mcpSuitePath, 'packages', pkg, 'dist', 'index.js');
    if (!fs.existsSync(distPath)) {
      missingPackages.push(pkg);
    }
  }

  if (missingPackages.length > 0) {
    log(`⚠️  MCP packages not built: ${missingPackages.join(', ')}`, 'yellow');
    log('Building MCP suite...', 'blue');
    try {
      execSync('npm run build', { cwd: mcpSuitePath, stdio: 'inherit' });
      log('✓ MCP suite built successfully', 'green');
    } catch (error) {
      log('✗ Failed to build MCP suite', 'red');
      throw error;
    }
  }

  // Detect installed AI IDEs
  log('\n🔍 Detecting AI IDEs...', 'blue');
  const detectedIDEs = detectInstalledIDEs();

  if (detectedIDEs.length === 0) {
    log('⚠️  No AI IDEs detected', 'yellow');
    log('Supported IDEs: Claude Code, Cursor, Windsurf, VS Code + Cline, Zed', 'reset');
    return;
  }

  log(`\n✓ Found ${detectedIDEs.length} AI IDE(s):`, 'green');
  for (const ide of detectedIDEs) {
    const status = ide.detected ? '✓ configured' : '○ installed (not configured)';
    log(`  ${status} - ${ide.displayName}`, ide.detected ? 'green' : 'yellow');
  }

  // Get MCP server configs
  const mcpServers = getMCPServerConfigs(mcpSuitePath);

  // Install to each detected IDE
  log('\n📦 Installing MCP servers to AI IDEs...', 'blue');
  let totalAdded = 0;
  let totalSkipped = 0;

  for (const ide of detectedIDEs) {
    log(`\n  ${ide.displayName}:`, 'blue');

    // Ensure config path exists for non-detected IDEs
    if (!ide.detected && ide.configPath) {
      const dir = path.dirname(ide.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        log(`    Created config directory`, 'green');
      }
    }

    const result = addMCPServersToIDE(ide, mcpServers);

    if (result.errors.length > 0) {
      for (const error of result.errors) {
        log(`    ✗ ${error}`, 'red');
      }
    } else {
      if (result.added > 0) {
        log(`    ✓ Added ${result.added} MCP server(s)`, 'green');
        totalAdded += result.added;
      }
      if (result.skipped > 0) {
        log(`    ○ ${result.skipped} already configured`, 'yellow');
        totalSkipped += result.skipped;
      }
    }
  }

  log('\n📋 MCP Servers:', 'blue');
  log('  • startupos-core (13 tools, 127 resources)', 'reset');
  log('  • startupos-accounting (41 tools)', 'reset');
  log('  • startupos-hr (10 tools)', 'reset');
  log('  • startupos-ai (4 tools)', 'reset');
  log('  • startupos-legal (13 tools)', 'reset');

  log(`\n✓ Installed to ${detectedIDEs.length} AI IDE(s)`, 'green');
  log(`  ${totalAdded} added, ${totalSkipped} skipped`, 'reset');
  log('\n⚠️  Restart your AI IDE to load MCP servers', 'yellow');
}

async function setupSkill(): Promise<void> {
  log('\n🎯 Setting up Startup OS CLI Skill...', 'blue');

  // Detect IDEs that support skills
  const detectedIDEs = detectInstalledIDEs();
  const skillIDEs = detectedIDEs.filter(ide => ide.name === 'claude-code');

  if (skillIDEs.length === 0) {
    log('⚠️  Claude Code not detected (only IDE that supports skills)', 'yellow');
    return;
  }

  let installed = 0;

  for (const ide of skillIDEs) {
    const skillPath = getIDESkillPath(ide);
    if (!skillPath) {
      continue;
    }

    const skillDir = path.dirname(skillPath);

    // Create .claude/skills directory if not exists
    if (!fs.existsSync(skillDir)) {
      fs.mkdirSync(skillDir, { recursive: true });
      log(`  ✓ Created ${skillDir}`, 'green');
    }

    // Copy skill file
    const sourceSkillPath = path.join(__dirname, '..', '..', '..', 'skills', 'ssos-cli.md');

    if (!fs.existsSync(sourceSkillPath)) {
      log(`⚠️  Skill file not found: ${sourceSkillPath}`, 'yellow');
      log('Creating skill file from template...', 'blue');

      const skillContent = `# startupos-cli

Server-side CLI tool for Startup OS (创业OS) — AI-powered financial management for Chinese startups.

## When to use

Use this skill when:
- Managing Startup OS resources via command line
- Performing bulk operations on financial data
- Integrating Startup OS into automation workflows
- Testing API endpoints
- Administrative tasks

## Installation

\`\`\`bash
npm install -g @startupos/cli
# or
npx @startupos/cli
\`\`\`

## Authentication

Three methods:
1. API Key: \`startupos-cli auth api-key <key>\`
2. Email/Password: \`startupos-cli auth login\`
3. JWT Token: Set \`STARTUPOS_JWT_TOKEN\` env var

## Core Commands

### Universal CRUD (127 resources)
\`\`\`bash
startupos-cli get <resource> [id]
startupos-cli create <resource> <json>
startupos-cli update <resource> <id> <json>
startupos-cli delete <resource> <id>
startupos-cli list <resource> [--workspace-id=<uuid>]
\`\`\`

### Business Logic
- \`accounting\`: Batch journal entries, period closing
- \`tax\`: VAT, income tax calculations
- \`invoice\`: VAT invoice management
- \`ai-bookkeeping\`: AI-powered bookkeeping

## AI Native Features

All commands support:
- Natural language descriptions
- Batch processing with JSON arrays
- Workspace context auto-detection
- Rich error messages

## Examples

\`\`\`bash
# Create journal entry
startupos-cli accounting add-batch entries.json

# Calculate tax
startupos-cli tax calculate-vat --start=2024-01-01 --end=2024-03-31

# AI bookkeeping
startupos-cli ai-bookkeeping scan "购买办公用品500元"
\`\`\`

---

**Startup OS** - AI 驱动的创业公司财务管理系统
`;

      fs.writeFileSync(skillPath, skillContent, 'utf-8');
      log(`  ✓ Created skill at ${skillPath}`, 'green');
    } else {
      fs.copyFileSync(sourceSkillPath, skillPath);
      log(`  ✓ Installed skill at ${skillPath}`, 'green');
    }

    installed++;
  }

  if (installed > 0) {
    log(`\n✓ Skill installed to ${installed} IDE(s)`, 'green');
    log('⚠️  Restart Claude Code to load the skill', 'yellow');
  }
}

async function checkDoctor(): Promise<void> {
  log('\n🏥 Startup OS AI Tools Health Check', 'blue');
  log('═'.repeat(50), 'blue');

  // Check CLI
  log('\n📦 CLI', 'blue');
  const cliPackageJson = path.join(__dirname, '..', '..', 'package.json');
  if (fs.existsSync(cliPackageJson)) {
    const pkg = JSON.parse(fs.readFileSync(cliPackageJson, 'utf-8'));
    log(`  ✓ Version: ${pkg.version}`, 'green');
    log(`  ✓ Package: ${pkg.name}`, 'green');
  } else {
    log('  ✗ CLI package.json not found', 'red');
  }

  // Detect AI IDEs
  log('\n🤖 AI IDEs', 'blue');
  const detectedIDEs = detectInstalledIDEs();

  if (detectedIDEs.length === 0) {
    log('  ○ No AI IDEs detected', 'yellow');
    log('  Supported: Claude Code, Cursor, Windsurf, VS Code + Cline, Zed', 'reset');
  } else {
    for (const ide of detectedIDEs) {
      if (ide.detected) {
        log(`  ✓ ${ide.displayName} - configured`, 'green');
      } else {
        log(`  ○ ${ide.displayName} - installed (not configured)`, 'yellow');
      }
    }
  }

  // Check MCP
  log('\n🔧 MCP Servers', 'blue');
  const mcpSuitePath = getMcpPackagePath();
  const mcpPackages = ['core', 'accounting', 'hr', 'ai', 'legal'];
  let mcpBuilt = 0;

  for (const pkg of mcpPackages) {
    const distPath = path.join(mcpSuitePath, 'packages', pkg, 'dist', 'index.js');
    if (fs.existsSync(distPath)) {
      log(`  ✓ startupos-${pkg} built`, 'green');
      mcpBuilt++;
    } else {
      log(`  ✗ startupos-${pkg} not built`, 'red');
    }
  }

  // Check if MCP servers are configured in any IDE
  const mcpServers = getMCPServerConfigs(mcpSuitePath);
  let totalConfigured = 0;

  for (const ide of detectedIDEs) {
    if (ide.detected && ide.configPath) {
      try {
        const content = fs.readFileSync(ide.configPath, 'utf-8');
        const config = JSON.parse(content);

        // Navigate to MCP servers key
        const keys = ide.mcpKey.split('.');
        let current = config;
        for (const key of keys) {
          if (!current[key]) break;
          current = current[key];
        }

        const installedServers = Object.keys(mcpServers).filter(name => current && current[name]);
        if (installedServers.length > 0) {
          totalConfigured += installedServers.length;
        }
      } catch (error) {
        // Ignore parse errors
      }
    }
  }

  if (totalConfigured > 0) {
    log(`  ✓ ${totalConfigured} server(s) configured in AI IDEs`, 'green');
  } else {
    log(`  ○ Not configured in any IDE`, 'yellow');
    log('    Run: startupos-cli setup --mcp', 'reset');
  }

  // Check Skill
  log('\n🎯 Claude Skills', 'blue');
  const claudeIDEs = detectedIDEs.filter(ide => ide.name === 'claude-code');

  if (claudeIDEs.length === 0) {
    log('  ○ Claude Code not installed', 'yellow');
  } else {
    let skillInstalled = false;
    for (const ide of claudeIDEs) {
      const skillPath = getIDESkillPath(ide);
      if (skillPath && fs.existsSync(skillPath)) {
        log(`  ✓ Skill installed`, 'green');
        skillInstalled = true;
        break;
      }
    }

    if (!skillInstalled) {
      log('  ○ Skill not installed', 'yellow');
      log('    Run: startupos-cli setup --skill', 'reset');
    }
  }

  // Check Auth
  log('\n🔐 Authentication', 'blue');
  const authPath = path.join(os.homedir(), '.startupos-cli', 'auth.json');
  if (fs.existsSync(authPath)) {
    const auth = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
    if (auth.apiKey) {
      log('  ✓ API Key configured', 'green');
    } else if (auth.accessToken) {
      log('  ✓ JWT Token configured', 'green');
    } else {
      log('  ○ Auth file exists but no credentials', 'yellow');
    }
  } else {
    log('  ○ Not authenticated', 'yellow');
    log('    Run: startupos-cli auth login', 'reset');
  }

  log('\n' + '═'.repeat(50), 'blue');
  log('✓ Health check complete', 'green');
}

export function registerSetupCommand(program: Command) {
  const setup = program
    .command('setup')
    .description('🚀 AI Native setup - Install Startup OS AI tools in one command')
    .option('--all', 'Install everything (MCP + Skill)')
    .option('--mcp', 'Install MCP servers only')
    .option('--skill', 'Install Claude Skill only')
    .option('-y, --yes', 'Skip confirmation prompts')
    .action(async (options: SetupOptions) => {
      try {
        log('\n🚀 Startup OS AI Native Setup', 'blue');
        log('═'.repeat(50), 'blue');

        const installMcp = options.all || options.mcp;
        const installSkill = options.all || options.skill;

        if (!installMcp && !installSkill) {
          // Default: install everything
          await setupMcpServers();
          await setupSkill();
        } else {
          if (installMcp) {
            await setupMcpServers();
          }
          if (installSkill) {
            await setupSkill();
          }
        }

        log('\n' + '═'.repeat(50), 'blue');
        log('✓ Setup complete!', 'green');
        log('\n💡 Next steps:', 'blue');
        log('  1. Restart Claude Code', 'reset');
        log('  2. Authenticate: startupos-cli auth login', 'reset');
        log('  3. Check status: startupos-cli doctor', 'reset');
        log('\n🎉 Welcome to AI Native financial management!', 'green');
      } catch (error) {
        log(`\n✗ Setup failed: ${error}`, 'red');
        process.exit(1);
      }
    });

  // Doctor command
  program
    .command('doctor')
    .description('🏥 Check Startup OS AI tools health')
    .action(checkDoctor);
}
