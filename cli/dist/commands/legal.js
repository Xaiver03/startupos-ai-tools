import { Command } from 'commander';
import { table } from 'table';
import chalk from 'chalk';
import ora from 'ora';
import { readFile } from 'fs/promises';
import { apiFetch } from '../lib/api-client.js';
export function createLegalCommand() {
    const legalCmd = new Command('legal')
        .description('Legal operations (contracts, reviews, demand letters)');
    // List contracts
    legalCmd
        .command('contract-list')
        .description('List contracts')
        .option('--status <status>', 'Filter by status (active|expired|terminated|draft)')
        .option('--type <type>', 'Filter by type (purchase|sales|service|rental|labor|loan|nda|equity|consultant|other)')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        const spinner = ora('Fetching contracts...').start();
        try {
            const params = new URLSearchParams();
            if (options.status)
                params.append('status', options.status);
            if (options.type)
                params.append('contract_type', options.type);
            const data = await apiFetch(`/api/contracts?${params.toString()}`);
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
                return;
            }
            const contracts = (data.data || data.contracts) || [];
            if (contracts.length === 0) {
                console.log(chalk.yellow('No contracts found'));
                return;
            }
            const rows = [
                ['ID', 'Title', 'Type', 'Party A', 'Party B', 'Amount', 'Status'],
                ...contracts.map((c) => [
                    c.id,
                    c.title?.substring(0, 20) || '-',
                    c.contract_type || '-',
                    c.party_a?.substring(0, 12) || '-',
                    c.party_b?.substring(0, 12) || '-',
                    c.amount ? `${c.amount} ${c.currency || 'CNY'}` : '-',
                    c.status || '-',
                ]),
            ];
            console.log(chalk.bold('\nContracts'));
            console.log(table(rows));
            console.log(chalk.gray(`\nTotal: ${contracts.length} contracts`));
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Get contract
    legalCmd
        .command('contract-get')
        .description('Get contract details')
        .argument('<id>', 'Contract ID')
        .option('--json', 'Output as JSON')
        .action(async (id, options) => {
        const spinner = ora('Fetching contract...').start();
        try {
            const data = await apiFetch(`/api/contracts/${id}`);
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
                return;
            }
            const contract = (data.data || data);
            console.log(chalk.bold('\nContract Details:'));
            console.log(chalk.gray('─'.repeat(60)));
            console.log(`${chalk.bold('ID:')} ${contract.id}`);
            console.log(`${chalk.bold('Title:')} ${contract.title}`);
            console.log(`${chalk.bold('Type:')} ${contract.contract_type}`);
            console.log(`${chalk.bold('Party A:')} ${contract.party_a}`);
            console.log(`${chalk.bold('Party B:')} ${contract.party_b}`);
            console.log(`${chalk.bold('Amount:')} ${contract.amount || '-'} ${contract.currency || ''}`);
            console.log(`${chalk.bold('Signed Date:')} ${contract.signed_date || '-'}`);
            console.log(`${chalk.bold('Effective Date:')} ${contract.effective_date || '-'}`);
            console.log(`${chalk.bold('Expiry Date:')} ${contract.expiry_date || '-'}`);
            console.log(`${chalk.bold('Status:')} ${contract.status}`);
            const contractContent = contract.content;
            if (contractContent) {
                console.log(`\n${chalk.bold('Content:')}`);
                console.log(contractContent.substring(0, 500) + (contractContent.length > 500 ? '...' : ''));
            }
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Create contract
    legalCmd
        .command('contract-create')
        .description('Create a new contract')
        .requiredOption('--title <title>', 'Contract title')
        .requiredOption('--party-a <name>', 'Party A name')
        .requiredOption('--party-b <name>', 'Party B name')
        .option('--type <type>', 'Contract type', 'other')
        .option('--amount <amount>', 'Contract amount')
        .option('--currency <currency>', 'Currency', 'CNY')
        .option('--signed-date <date>', 'Signed date (YYYY-MM-DD)')
        .option('--effective-date <date>', 'Effective date (YYYY-MM-DD)')
        .option('--expiry-date <date>', 'Expiry date (YYYY-MM-DD)')
        .option('--status <status>', 'Status', 'active')
        .option('--content <text>', 'Contract content text')
        .option('--content-file <path>', 'Contract content file path')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        const spinner = ora('Creating contract...').start();
        try {
            let content = options.content;
            if (options.contentFile) {
                content = await readFile(options.contentFile, 'utf-8');
            }
            const body = {
                title: options.title,
                contract_type: options.type,
                party_a: options.partyA,
                party_b: options.partyB,
                status: options.status,
            };
            if (options.amount)
                body.amount = parseFloat(options.amount);
            if (options.currency)
                body.currency = options.currency;
            if (options.signedDate)
                body.signed_date = options.signedDate;
            if (options.effectiveDate)
                body.effective_date = options.effectiveDate;
            if (options.expiryDate)
                body.expiry_date = options.expiryDate;
            if (content)
                body.content = content;
            const data = await apiFetch('/api/contracts', {
                method: 'POST',
                body: JSON.stringify(body),
            });
            spinner.succeed('Contract created');
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
            }
            else {
                console.log(chalk.bold('\nCreated Contract:'));
                const createdContract = (data.data || data);
                console.log(`ID: ${createdContract.id}`);
                console.log(`Title: ${createdContract.title}`);
                console.log(`Type: ${createdContract.contract_type}`);
            }
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // AI generate contract
    legalCmd
        .command('contract-generate')
        .description('AI generate contract from template')
        .requiredOption('--type <type>', 'Contract type')
        .requiredOption('--party-a <name>', 'Party A name')
        .requiredOption('--party-b <name>', 'Party B name')
        .option('--amount <amount>', 'Contract amount')
        .option('--currency <currency>', 'Currency', 'CNY')
        .option('--term <months>', 'Contract term in months')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        const spinner = ora('Generating contract...').start();
        try {
            const body = {
                contract_type: options.type,
                party_a: options.partyA,
                party_b: options.partyB,
            };
            if (options.amount)
                body.amount = parseFloat(options.amount);
            if (options.currency)
                body.currency = options.currency;
            if (options.term)
                body.term_months = parseInt(options.term);
            const data = await apiFetch('/api/contracts/generate', {
                method: 'POST',
                body: JSON.stringify(body),
            });
            spinner.succeed('Contract generated');
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
            }
            else {
                console.log(chalk.bold('\nGenerated Contract:'));
                const genContract = (data.data || data);
                console.log(`Title: ${genContract.title}`);
                console.log(`\n${chalk.bold('Content:')}`);
                console.log(genContract.content || '-');
            }
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Review contract
    legalCmd
        .command('contract-review')
        .description('AI review contract text')
        .requiredOption('--text <text>', 'Contract text to review')
        .option('--perspective <perspective>', 'Review perspective (party_a|party_b|neutral)', 'neutral')
        .option('--prompt <text>', 'Custom review instructions')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        const spinner = ora('Reviewing contract...').start();
        try {
            const body = {
                contract_text: options.text,
                perspective: options.perspective,
            };
            if (options.prompt)
                body.custom_prompt = options.prompt;
            const data = await apiFetch('/api/contract-reviews/text', {
                method: 'POST',
                body: JSON.stringify(body),
            });
            spinner.succeed('Contract review submitted');
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
            }
            else {
                console.log(chalk.bold('\nReview Submitted:'));
                const reviewData = (data.data || data);
                console.log(`Review ID: ${reviewData.review_id}`);
                console.log(chalk.gray('Use "legal review-get <review-id>" to get results'));
            }
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Get review result
    legalCmd
        .command('review-get')
        .description('Get contract review result')
        .argument('<id>', 'Review ID')
        .option('--json', 'Output as JSON')
        .action(async (id, options) => {
        const spinner = ora('Fetching review...').start();
        try {
            const data = await apiFetch(`/api/contract-reviews/${id}`);
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
                return;
            }
            const review = (data.data || data);
            console.log(chalk.bold('\nContract Review:'));
            console.log(chalk.gray('─'.repeat(60)));
            console.log(`${chalk.bold('ID:')} ${review.id}`);
            console.log(`${chalk.bold('Status:')} ${review.status}`);
            console.log(`${chalk.bold('Perspective:')} ${review.perspective}`);
            console.log(`${chalk.bold('Risk Score:')} ${review.risk_score || '-'}/100`);
            const risks = review.risks;
            if (risks && risks.length > 0) {
                console.log(`\n${chalk.bold('Risks:')}`);
                risks.forEach((risk) => {
                    const sev = risk.severity;
                    const color = sev === 'high' ? chalk.red : sev === 'medium' ? chalk.yellow : chalk.gray;
                    console.log(color(`  [${sev.toUpperCase()}] ${risk.description}`));
                });
            }
            const recs = review.recommendations;
            if (recs && recs.length > 0) {
                console.log(`\n${chalk.bold('Recommendations:')}`);
                recs.forEach((rec, i) => {
                    console.log(`  ${i + 1}. ${rec}`);
                });
            }
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // List demand letters
    legalCmd
        .command('demand-list')
        .description('List demand letters (催款函)')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        const spinner = ora('Fetching demand letters...').start();
        try {
            const data = await apiFetch('/api/demand-letters');
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
                return;
            }
            const letters = (Array.isArray(data) ? data : (data.items || data.data) || []);
            if (letters.length === 0) {
                console.log(chalk.yellow('No demand letters found'));
                return;
            }
            const rows = [
                ['ID', 'Debtor', 'Creditor', 'Amount', 'Due Date', 'Status'],
                ...letters.map((l) => [
                    l.id,
                    l.debtor_name?.substring(0, 15) || '-',
                    l.creditor_name?.substring(0, 15) || '-',
                    l.amount,
                    l.due_date || '-',
                    l.status || '-',
                ]),
            ];
            console.log(chalk.bold('\nDemand Letters'));
            console.log(table(rows));
            console.log(chalk.gray(`\nTotal: ${letters.length} letters`));
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Generate demand letter
    legalCmd
        .command('demand-generate')
        .description('Generate demand letter')
        .requiredOption('--debtor <name>', 'Debtor name')
        .requiredOption('--creditor <name>', 'Creditor name')
        .requiredOption('--amount <amount>', 'Outstanding amount')
        .option('--contract <number>', 'Related contract number')
        .option('--due-date <date>', 'Payment due date (YYYY-MM-DD)')
        .option('--deadline <date>', 'Final payment deadline (YYYY-MM-DD)')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        const spinner = ora('Generating demand letter...').start();
        try {
            const body = {
                debtor_name: options.debtor,
                creditor_name: options.creditor,
                amount: parseFloat(options.amount),
            };
            if (options.contract)
                body.contract_number = options.contract;
            if (options.dueDate)
                body.due_date = options.dueDate;
            if (options.deadline)
                body.payment_deadline = options.deadline;
            const data = await apiFetch('/api/demand-letters/generate', {
                method: 'POST',
                body: JSON.stringify(body),
            });
            spinner.succeed('Demand letter generated');
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
            }
            else {
                console.log(chalk.bold('\nGenerated Demand Letter:'));
                const genLetter = (data.data || data);
                console.log(genLetter.letter_content || '-');
            }
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Get legal path recommendation
    legalCmd
        .command('legal-path')
        .description('Get recommended legal action based on amount')
        .argument('<amount>', 'Debt amount')
        .option('--json', 'Output as JSON')
        .action(async (amount, options) => {
        const spinner = ora('Getting recommendation...').start();
        try {
            const data = await apiFetch(`/api/demand-letters/legal-path?amount=${amount}`);
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
                return;
            }
            const rec = (data.data || data);
            const recommendation = (rec.recommendation || rec);
            const limitation = rec.limitation_info;
            console.log(chalk.bold('\nLegal Path Recommendation:'));
            console.log(chalk.gray('─'.repeat(60)));
            console.log(`${chalk.bold('Amount:')} ${amount}`);
            console.log(`${chalk.bold('Path:')} ${recommendation.path || '-'}`);
            console.log(`${chalk.bold('Title:')} ${recommendation.title || '-'}`);
            console.log(`${chalk.bold('Description:')} ${recommendation.description || '-'}`);
            console.log(`${chalk.bold('Estimated Cost:')} ${recommendation.cost || '-'}`);
            if (limitation) {
                console.log(`\n${chalk.bold('Limitation Info:')}`);
                console.log(`${chalk.bold('Years:')} ${limitation.years || '-'}`);
                console.log(`${chalk.bold('Reminder:')} ${limitation.reminder || '-'}`);
            }
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Update contract
    legalCmd
        .command('contract-update')
        .description('Update a contract')
        .argument('<id>', 'Contract ID')
        .option('--title <title>', 'Contract title')
        .option('--status <status>', 'Status (active|expired|terminated|draft)')
        .option('--amount <amount>', 'Contract amount')
        .option('--signed-date <date>', 'Signed date (YYYY-MM-DD)')
        .option('--effective-date <date>', 'Effective date (YYYY-MM-DD)')
        .option('--expiry-date <date>', 'Expiry date (YYYY-MM-DD)')
        .option('--json', 'Output as JSON')
        .action(async (id, options) => {
        const spinner = ora('Updating contract...').start();
        try {
            const body = {};
            if (options.title)
                body.title = options.title;
            if (options.status)
                body.status = options.status;
            if (options.amount)
                body.amount = parseFloat(options.amount);
            if (options.signedDate)
                body.signed_date = options.signedDate;
            if (options.effectiveDate)
                body.effective_date = options.effectiveDate;
            if (options.expiryDate)
                body.expiry_date = options.expiryDate;
            const data = await apiFetch(`/api/contracts/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(body),
            });
            spinner.succeed('Contract updated');
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
            }
            else {
                console.log(chalk.bold('\nUpdated Contract:'));
                const updatedContract = (data.data || data);
                console.log(`ID: ${updatedContract.id}`);
                console.log(`Title: ${updatedContract.title}`);
                console.log(`Status: ${updatedContract.status}`);
            }
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Save demand letter
    legalCmd
        .command('demand-save')
        .description('Save a demand letter record')
        .requiredOption('--debtor <name>', 'Debtor name')
        .requiredOption('--creditor <name>', 'Creditor name')
        .requiredOption('--amount <amount>', 'Outstanding amount')
        .requiredOption('--content <text>', 'Letter content')
        .option('--contract <number>', 'Related contract number')
        .option('--due-date <date>', 'Payment due date (YYYY-MM-DD)')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        const spinner = ora('Saving demand letter...').start();
        try {
            const body = {
                debtor_name: options.debtor,
                creditor_name: options.creditor,
                amount: parseFloat(options.amount),
                letter_content: options.content,
            };
            if (options.contract)
                body.contract_number = options.contract;
            if (options.dueDate)
                body.due_date = options.dueDate;
            const data = await apiFetch('/api/demand-letters', {
                method: 'POST',
                body: JSON.stringify(body),
            });
            spinner.succeed('Demand letter saved');
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
            }
            else {
                console.log(chalk.bold('\nSaved Demand Letter:'));
                const savedLetter = (data.data || data);
                console.log(`ID: ${savedLetter.id}`);
                console.log(`Debtor: ${savedLetter.debtor_name}`);
                console.log(`Amount: ${savedLetter.amount}`);
            }
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Delete contract
    legalCmd
        .command('contract-delete')
        .description('Delete a contract')
        .argument('<id>', 'Contract ID')
        .action(async (id) => {
        const spinner = ora('Deleting contract...').start();
        try {
            await apiFetch(`/api/contracts/${id}`, { method: 'DELETE' });
            spinner.succeed('Contract deleted');
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Get demand letter
    legalCmd
        .command('demand-get')
        .description('Get demand letter details')
        .argument('<id>', 'Demand letter ID')
        .option('--json', 'Output as JSON')
        .action(async (id, options) => {
        const spinner = ora('Fetching demand letter...').start();
        try {
            const data = await apiFetch(`/api/demand-letters/${id}`);
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
                return;
            }
            const letter = (data.data || data);
            console.log(chalk.bold('\nDemand Letter Details:'));
            console.log(chalk.gray('─'.repeat(60)));
            console.log(`${chalk.bold('ID:')} ${letter.id}`);
            console.log(`${chalk.bold('Debtor:')} ${letter.debtor_name}`);
            console.log(`${chalk.bold('Creditor:')} ${letter.creditor_name}`);
            console.log(`${chalk.bold('Amount:')} ${letter.amount}`);
            console.log(`${chalk.bold('Due Date:')} ${letter.due_date || '-'}`);
            console.log(`${chalk.bold('Status:')} ${letter.status}`);
            const letterContent = letter.letter_content;
            if (letterContent) {
                console.log(`\n${chalk.bold('Content:')}`);
                console.log(letterContent.substring(0, 500) + (letterContent.length > 500 ? '...' : ''));
            }
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Update demand letter
    legalCmd
        .command('demand-update')
        .description('Update a demand letter')
        .argument('<id>', 'Demand letter ID')
        .option('--debtor <name>', 'Debtor name')
        .option('--creditor <name>', 'Creditor name')
        .option('--amount <amount>', 'Outstanding amount')
        .option('--due-date <date>', 'Payment due date (YYYY-MM-DD)')
        .option('--status <status>', 'Status')
        .option('--json', 'Output as JSON')
        .action(async (id, options) => {
        const spinner = ora('Updating demand letter...').start();
        try {
            const body = {};
            if (options.debtor)
                body.debtor_name = options.debtor;
            if (options.creditor)
                body.creditor_name = options.creditor;
            if (options.amount)
                body.amount = parseFloat(options.amount);
            if (options.dueDate)
                body.due_date = options.dueDate;
            if (options.status)
                body.status = options.status;
            const data = await apiFetch(`/api/demand-letters/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(body),
            });
            spinner.succeed('Demand letter updated');
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
            }
            else {
                console.log(chalk.bold('\nUpdated Demand Letter:'));
                const updatedLetter = (data.data || data);
                console.log(`ID: ${updatedLetter.id}`);
                console.log(`Debtor: ${updatedLetter.debtor_name}`);
            }
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Delete demand letter
    legalCmd
        .command('demand-delete')
        .description('Delete a demand letter')
        .argument('<id>', 'Demand letter ID')
        .action(async (id) => {
        const spinner = ora('Deleting demand letter...').start();
        try {
            await apiFetch(`/api/demand-letters/${id}`, { method: 'DELETE' });
            spinner.succeed('Demand letter deleted');
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // Ask contract question
    legalCmd
        .command('review-ask')
        .description('Ask follow-up question about a contract review')
        .requiredOption('--review <id>', 'Review ID')
        .requiredOption('-q, --question <text>', 'Question to ask')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        const spinner = ora('Sending question...').start();
        try {
            const body = {
                question: options.question,
            };
            const data = await apiFetch(`/api/contract-reviews/${options.review}/ask`, {
                method: 'POST',
                body: JSON.stringify(body),
            });
            spinner.succeed('Answer received');
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
                return;
            }
            const result = (data.data || data);
            console.log(chalk.bold('\nQuestion:'));
            console.log(options.question);
            console.log(chalk.bold('\nAnswer:'));
            console.log(result.answer || '-');
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    return legalCmd;
}
