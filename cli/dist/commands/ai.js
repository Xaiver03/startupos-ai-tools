import { Command } from 'commander';
import { query } from '../db.js';
import chalk from 'chalk';
import ora from 'ora';
export function createAICommand() {
    const aiCmd = new Command('ai')
        .description('AI service management');
    // Test AI connection
    aiCmd
        .command('test-connection')
        .description('Test connection to AI Ping API')
        .action(async () => {
        const spinner = ora('Testing AI connection...').start();
        try {
            const apiKey = process.env.AI_PING_API_KEY || process.env.AI_API_KEY;
            if (!apiKey) {
                spinner.fail('AI API key not configured');
                console.log(chalk.yellow('\nSet AI_PING_API_KEY in .env file'));
                return;
            }
            const response = await fetch('https://api.aiping.cn/v1/models', {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                },
            });
            if (!response.ok) {
                throw new Error(`API returned ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            spinner.succeed('AI connection successful');
            console.log(chalk.bold('\nAvailable Models:'));
            console.log(chalk.gray('─'.repeat(50)));
            if (data.data && Array.isArray(data.data)) {
                data.data.forEach((model) => {
                    console.log(`  • ${model.id}`);
                });
            }
            else {
                console.log(chalk.gray('  (Model list not available)'));
            }
        }
        catch (error) {
            spinner.fail('Connection failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // AI usage statistics
    aiCmd
        .command('usage-stats')
        .description('Show AI usage statistics')
        .option('-w, --workspace <id>', 'Filter by workspace ID')
        .option('-d, --days <number>', 'Show stats for last N days', '30')
        .action(async (options) => {
        const spinner = ora('Fetching AI usage stats...').start();
        try {
            let sql = `
          SELECT
            DATE(created_at) as date,
            COUNT(*) as total_conversations,
            COUNT(DISTINCT user_id) as unique_users,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors
          FROM ai_conversations
          WHERE created_at >= NOW() - INTERVAL '${parseInt(options.days)} days'
        `;
            const params = [];
            if (options.workspace) {
                sql += ' AND workspace_id = $1';
                params.push(options.workspace);
            }
            sql += ' GROUP BY DATE(created_at) ORDER BY date DESC';
            const result = await query(sql, params);
            spinner.succeed('AI usage statistics');
            if (result.rows.length === 0) {
                console.log(chalk.yellow('\nNo AI usage data found'));
                return;
            }
            console.log(chalk.bold('\nAI Usage (Last ' + options.days + ' Days):'));
            console.log(chalk.gray('─'.repeat(70)));
            let totalConversations = 0;
            let totalCompleted = 0;
            let totalErrors = 0;
            result.rows.forEach(row => {
                const date = new Date(row.date).toLocaleDateString();
                const total = parseInt(row.total_conversations);
                const completed = parseInt(row.completed);
                const errors = parseInt(row.errors);
                const successRate = ((completed / total) * 100).toFixed(1);
                totalConversations += total;
                totalCompleted += completed;
                totalErrors += errors;
                console.log(`${date.padEnd(12)} | ` +
                    `${String(total).padStart(4)} conversations | ` +
                    `${String(completed).padStart(4)} completed | ` +
                    `${String(errors).padStart(4)} errors | ` +
                    `${successRate}% success`);
            });
            console.log(chalk.gray('─'.repeat(70)));
            console.log(chalk.bold('Total:'));
            console.log(`  Conversations: ${totalConversations}`);
            console.log(`  Completed: ${totalCompleted}`);
            console.log(`  Errors: ${totalErrors}`);
            console.log(`  Success Rate: ${((totalCompleted / totalConversations) * 100).toFixed(1)}%`);
        }
        catch (error) {
            spinner.fail('Failed to fetch stats');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Test AI prompt
    aiCmd
        .command('prompt')
        .description('Test an AI prompt')
        .argument('<prompt>', 'Prompt to test')
        .option('-m, --model <model>', 'Model to use', 'gpt-4o')
        .action(async (promptText, options) => {
        const spinner = ora('Sending prompt to AI...').start();
        try {
            const apiKey = process.env.AI_PING_API_KEY || process.env.AI_API_KEY;
            if (!apiKey) {
                spinner.fail('AI API key not configured');
                console.log(chalk.yellow('\nSet AI_PING_API_KEY in .env file'));
                return;
            }
            const response = await fetch('https://api.aiping.cn/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: options.model,
                    messages: [
                        {
                            role: 'user',
                            content: promptText,
                        },
                    ],
                    temperature: 0.7,
                    max_tokens: 1000,
                }),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API returned ${response.status}: ${errorText}`);
            }
            const data = await response.json();
            spinner.succeed('AI response received');
            console.log(chalk.bold('\nPrompt:'));
            console.log(chalk.gray(promptText));
            console.log(chalk.bold('\nResponse:'));
            const choices = data.choices;
            console.log(choices[0].message.content);
            console.log(chalk.gray('\nUsage:'));
            const usage = data.usage;
            console.log(`  Tokens: ${usage.total_tokens} (prompt: ${usage.prompt_tokens}, completion: ${usage.completion_tokens})`);
            console.log(`  Model: ${data.model}`);
        }
        catch (error) {
            spinner.fail('Prompt test failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    return aiCmd;
}
