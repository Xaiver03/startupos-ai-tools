import { table } from 'table';
import chalk from 'chalk';
import ora from 'ora';
import { apiFetch } from '../lib/api-client.js';
// ═══════════════════════════════════════════════════════════════════════════
// Register all 11 individual tax modules as tax subcommands
// ═══════════════════════════════════════════════════════════════════════════
export function registerTaxModules(taxCmd) {
    // ═══ Pension Deductions (养老保险扣除) ═══
    const pdCmd = taxCmd.command('pension-deduction').description('Pension deduction (养老保险扣除)');
    registerCrud(pdCmd, 'pension-deduction', '/api/pension-deductions', {
        label: '养老保险扣除',
        createFields: [
            { opt: '--employee <id>', field: 'employee_id', type: 'uuid', req: true, desc: 'Employee ID (UUID)' },
            { opt: '--year <year>', field: 'deduction_year', type: 'number', req: true, desc: 'Deduction year' },
            { opt: '--period <YYYY-MM>', field: 'period', type: 'string', req: true, desc: 'Period (YYYY-MM)' },
            { opt: '--amount <amount>', field: 'contribution_amount', type: 'number', req: true, desc: 'Contribution amount' },
            { opt: '--cumulative <amount>', field: 'cumulative_amount', type: 'number', req: true, desc: 'Cumulative amount' },
            { opt: '--voucher <no>', field: 'payment_voucher_no', type: 'string', desc: 'Payment voucher number' },
            { opt: '--pay-date <date>', field: 'payment_date', type: 'date', desc: 'Payment date (YYYY-MM-DD)' },
            { opt: '--account <no>', field: 'pension_account_no', type: 'string', desc: 'Pension account number' },
            { opt: '--remark <text>', field: 'remark', type: 'string', desc: 'Remark' },
        ],
        listCols: [['ID', 'id'], ['Employee', 'employee_name'], ['Year', 'deduction_year'], ['Period', 'period'], ['Amount', 'contribution_amount'], ['Status', 'status']],
        getFields: [['Employee', 'employee_name'], ['Year', 'deduction_year'], ['Period', 'period'], ['Amount', 'contribution_amount'], ['Cumulative', 'cumulative_amount'], ['Status', 'status']],
        hasPost: true,
    });
    // ═══ Pension Payments (养老保险待遇支付) ═══
    const ppCmd = taxCmd.command('pension-payment').description('Pension payment (养老保险待遇支付)');
    registerCrud(ppCmd, 'pension-payment', '/api/pension-payments', {
        label: '养老保险待遇支付',
        createFields: [
            { opt: '--name <name>', field: 'payee_name', type: 'string', req: true, desc: 'Payee name' },
            { opt: '--id-card <number>', field: 'id_card_no', type: 'string', desc: 'ID card number' },
            { opt: '--type <type>', field: 'pension_type', type: 'enum', req: true, desc: 'annuity | deferred_commercial | personal_pension' },
            { opt: '--period <YYYY-MM>', field: 'period', type: 'string', req: true, desc: 'Period (YYYY-MM)' },
            { opt: '--amount <amount>', field: 'monthly_amount', type: 'number', req: true, desc: 'Monthly amount' },
            { opt: '--cumulative <amount>', field: 'cumulative_amount', type: 'number', req: true, desc: 'Cumulative amount' },
            { opt: '--remark <text>', field: 'remark', type: 'string', desc: 'Remark' },
        ],
        listCols: [['ID', 'id'], ['Payee', 'payee_name'], ['Type', 'pension_type'], ['Period', 'period'], ['Amount', 'monthly_amount'], ['Status', 'status']],
        getFields: [['Payee', 'payee_name'], ['Type', 'pension_type'], ['Period', 'period'], ['Amount', 'monthly_amount'], ['Cumulative', 'cumulative_amount'], ['Status', 'status']],
        hasPost: true,
    });
    // ═══ Property Rental (财产租赁所得) ═══
    const prCmd = taxCmd.command('property-rental').description('Property rental income (财产租赁所得)');
    registerCrud(prCmd, 'property-rental', '/api/property-rental', {
        label: '财产租赁所得',
        createFields: [
            { opt: '--name <name>', field: 'tenant_name', type: 'string', req: true, desc: 'Tenant name' },
            { opt: '--id-card <number>', field: 'tenant_id_card', type: 'string', desc: 'Tenant ID card' },
            { opt: '--address <addr>', field: 'property_address', type: 'string', req: true, desc: 'Property address' },
            { opt: '--period <YYYY-MM>', field: 'rental_period', type: 'string', req: true, desc: 'Rental period (YYYY-MM)' },
            { opt: '--amount <amount>', field: 'gross_rental_income', type: 'numericString', req: true, desc: 'Gross rental income' },
            { opt: '--repair <amount>', field: 'repair_cost', type: 'numericString', desc: 'Repair cost' },
            { opt: '--expenses <amount>', field: 'other_expenses', type: 'numericString', desc: 'Other expenses' },
            { opt: '--remark <text>', field: 'remark', type: 'string', desc: 'Remark' },
        ],
        listCols: [['ID', 'id'], ['Tenant', 'tenant_name'], ['Address', 'property_address'], ['Period', 'rental_period'], ['Income', 'gross_rental_income'], ['Status', 'status']],
        getFields: [['Tenant', 'tenant_name'], ['Address', 'property_address'], ['Period', 'rental_period'], ['Income', 'gross_rental_income'], ['Tax', 'income_tax'], ['Net', 'net_rental_income'], ['Status', 'status']],
    });
    // ═══ Property Transfer (财产转让所得) ═══
    const ptCmd = taxCmd.command('property-transfer').description('Property transfer income (财产转让所得)');
    registerCrud(ptCmd, 'property-transfer', '/api/property-transfer', {
        label: '财产转让所得',
        createFields: [
            { opt: '--name <name>', field: 'transferor_name', type: 'string', req: true, desc: 'Transferor name' },
            { opt: '--id-card <number>', field: 'id_card_no', type: 'string', desc: 'ID card number' },
            { opt: '--date <date>', field: 'transfer_date', type: 'date', req: true, desc: 'Transfer date (YYYY-MM-DD)' },
            { opt: '--type <type>', field: 'property_type', type: 'enum', req: true, desc: 'equity | real_estate | other' },
            { opt: '--income <amount>', field: 'transfer_income', type: 'number', req: true, desc: 'Transfer income' },
            { opt: '--original <amount>', field: 'original_value', type: 'number', req: true, desc: 'Original value' },
            { opt: '--expenses <amount>', field: 'reasonable_expenses', type: 'number', desc: 'Reasonable expenses' },
            { opt: '--remark <text>', field: 'remark', type: 'string', desc: 'Remark' },
        ],
        listCols: [['ID', 'id'], ['Transferor', 'transferor_name'], ['Type', 'property_type'], ['Income', 'transfer_income'], ['Tax', 'income_tax'], ['Status', 'status']],
        getFields: [['Transferor', 'transferor_name'], ['Type', 'property_type'], ['Income', 'transfer_income'], ['Original', 'original_value'], ['Tax', 'income_tax'], ['Net', 'net_income'], ['Status', 'status']],
        hasPost: true,
    });
    // ═══ Royalty Income (特许权使用费所得) ═══
    const riCmd = taxCmd.command('royalty-income').description('Royalty income (特许权使用费所得)');
    registerCrud(riCmd, 'royalty-income', '/api/royalty-income', {
        label: '特许权使用费所得',
        createFields: [
            { opt: '--name <name>', field: 'payee_name', type: 'string', req: true, desc: 'Payee name' },
            { opt: '--id-card <number>', field: 'id_card_no', type: 'string', desc: 'ID card number' },
            { opt: '--type <type>', field: 'income_type', type: 'enum', req: true, desc: 'manuscript | royalty' },
            { opt: '--period <YYYY-MM>', field: 'period', type: 'string', req: true, desc: 'Period (YYYY-MM)' },
            { opt: '--date <date>', field: 'payment_date', type: 'date', req: true, desc: 'Payment date (YYYY-MM-DD)' },
            { opt: '--amount <amount>', field: 'gross_amount', type: 'numericString', req: true, desc: 'Gross amount' },
            { opt: '--remark <text>', field: 'remark', type: 'string', desc: 'Remark' },
        ],
        listCols: [['ID', 'id'], ['Payee', 'payee_name'], ['Type', 'income_type'], ['Period', 'period'], ['Amount', 'gross_amount'], ['Status', 'status']],
        getFields: [['Payee', 'payee_name'], ['Type', 'income_type'], ['Period', 'period'], ['Amount', 'gross_amount'], ['Tax', 'withholding_tax'], ['Net', 'net_amount'], ['Status', 'status']],
        hardDelete: true,
    });
    // ═══ Incidental Income (偶然所得) ═══
    const iiCmd = taxCmd.command('incidental-income').description('Incidental income (偶然所得)');
    registerCrud(iiCmd, 'incidental-income', '/api/incidental-income', {
        label: '偶然所得',
        createFields: [
            { opt: '--name <name>', field: 'payee_name', type: 'string', req: true, desc: 'Payee name' },
            { opt: '--id-card <number>', field: 'id_card_no', type: 'string', desc: 'ID card number' },
            { opt: '--date <date>', field: 'income_date', type: 'date', req: true, desc: 'Income date (YYYY-MM-DD)' },
            { opt: '--amount <amount>', field: 'gross_amount', type: 'number', req: true, desc: 'Gross amount' },
            { opt: '--remark <text>', field: 'remark', type: 'string', desc: 'Remark' },
        ],
        listCols: [['ID', 'id'], ['Payee', 'payee_name'], ['Date', 'income_date'], ['Amount', 'gross_amount'], ['Tax', 'income_tax'], ['Status', 'status']],
        getFields: [['Payee', 'payee_name'], ['Date', 'income_date'], ['Amount', 'gross_amount'], ['Tax', 'income_tax'], ['Net', 'net_income'], ['Status', 'status']],
        hasPost: true,
    });
    // ═══ Overseas Dispatch (境外派遣) ═══
    const odCmd = taxCmd.command('overseas-dispatch').description('Overseas dispatch tax (境外派遣)');
    registerCrud(odCmd, 'overseas-dispatch', '/api/overseas-dispatch', {
        label: '境外派遣',
        workspaceOptional: true,
        createFields: [
            { opt: '--employee <id>', field: 'employee_id', type: 'uuid', req: true, desc: 'Employee ID (UUID)' },
            { opt: '--country <country>', field: 'destination_country', type: 'string', req: true, desc: 'Destination country' },
            { opt: '--start <date>', field: 'dispatch_start_date', type: 'date', req: true, desc: 'Dispatch start date (YYYY-MM-DD)' },
            { opt: '--end <date>', field: 'dispatch_end_date', type: 'date', desc: 'Dispatch end date (YYYY-MM-DD)' },
            { opt: '--duration <months>', field: 'dispatch_duration', type: 'number', desc: 'Dispatch duration (months)' },
            { opt: '--domestic <amount>', field: 'domestic_income', type: 'numericString', desc: 'Domestic income' },
            { opt: '--overseas <amount>', field: 'overseas_income', type: 'numericString', desc: 'Overseas income' },
            { opt: '--tax-credit <amount>', field: 'tax_credit', type: 'numericString', desc: 'Tax credit' },
            { opt: '--remark <text>', field: 'remark', type: 'string', desc: 'Remark' },
        ],
        listCols: [['ID', 'id'], ['Employee', 'employee_name'], ['Country', 'destination_country'], ['Start', 'dispatch_start_date'], ['End', 'dispatch_end_date'], ['Status', 'status']],
        getFields: [['Employee', 'employee_name'], ['Country', 'destination_country'], ['Start', 'dispatch_start_date'], ['End', 'dispatch_end_date'], ['Domestic', 'domestic_income'], ['Overseas', 'overseas_income'], ['Tax Credit', 'tax_credit'], ['Status', 'status']],
        hasPost: true,
        hardDelete: true,
        postRole: 'admin',
    });
    // ═══ Tech Achievements (科技成果转化) ═══
    const taCmd = taxCmd.command('tech-achievements').description('Tech achievement tax (科技成果转化)');
    registerCrud(taCmd, 'tech-achievements', '/api/tech-achievements', {
        label: '科技成果转化',
        workspaceOptional: true,
        createFields: [
            { opt: '--employee <id>', field: 'employee_id', type: 'uuid', req: true, desc: 'Employee ID (UUID)' },
            { opt: '--type <type>', field: 'achievement_type', type: 'enum', req: true, desc: 'investment_deferral | cash_reward | exemption' },
            { opt: '--name <name>', field: 'achievement_name', type: 'string', req: true, desc: 'Achievement name' },
            { opt: '--date <date>', field: 'filing_date', type: 'date', req: true, desc: 'Filing date (YYYY-MM-DD)' },
            { opt: '--valuation <amount>', field: 'valuation_amount', type: 'numericString', desc: 'Valuation amount' },
            { opt: '--cash-reward <amount>', field: 'cash_reward_amount', type: 'numericString', desc: 'Cash reward amount' },
            { opt: '--deferral <months>', field: 'deferral_period', type: 'number', desc: 'Deferral period (months)' },
            { opt: '--tax <treatment>', field: 'tax_treatment', type: 'enum', req: true, desc: 'deferred | exempt | taxable' },
            { opt: '--remark <text>', field: 'remark', type: 'string', desc: 'Remark' },
        ],
        listCols: [['ID', 'id'], ['Employee', 'employee_name'], ['Type', 'achievement_type'], ['Name', 'achievement_name'], ['Tax', 'tax_treatment'], ['Status', 'status']],
        getFields: [['Employee', 'employee_name'], ['Type', 'achievement_type'], ['Name', 'achievement_name'], ['Valuation', 'valuation_amount'], ['Cash Reward', 'cash_reward_amount'], ['Tax', 'tax_treatment'], ['Status', 'status']],
        hasPost: true,
        hardDelete: true,
        postRole: 'admin',
    });
    // ═══ Discount Housing Sale (优惠住房出售) ═══
    const dhsCmd = taxCmd.command('discount-housing').description('Discount housing sale tax (优惠住房出售)');
    registerCrud(dhsCmd, 'discount-housing', '/api/discount-housing-sale', {
        label: '优惠住房出售',
        createFields: [
            { opt: '--employee <id>', field: 'employee_id', type: 'uuid', req: true, desc: 'Employee ID (UUID)' },
            { opt: '--date <date>', field: 'sale_date', type: 'date', req: true, desc: 'Sale date (YYYY-MM-DD)' },
            { opt: '--address <addr>', field: 'property_address', type: 'string', req: true, desc: 'Property address' },
            { opt: '--market <amount>', field: 'market_price', type: 'number', req: true, desc: 'Market price' },
            { opt: '--purchase <amount>', field: 'purchase_price', type: 'number', req: true, desc: 'Purchase price' },
            { opt: '--expenses <amount>', field: 'reasonable_expenses', type: 'number', desc: 'Reasonable expenses' },
            { opt: '--remark <text>', field: 'remark', type: 'string', desc: 'Remark' },
        ],
        listCols: [['ID', 'id'], ['Employee', 'employee_name'], ['Address', 'property_address'], ['Market', 'market_price'], ['Purchase', 'purchase_price'], ['Status', 'status']],
        getFields: [['Employee', 'employee_name'], ['Date', 'sale_date'], ['Address', 'property_address'], ['Market', 'market_price'], ['Purchase', 'purchase_price'], ['Tax', 'income_tax'], ['Status', 'status']],
        hasPost: true,
    });
    // ═══ R&D Expense Deductions (研发费用加计扣除) ═══
    const rdCmd = taxCmd.command('rd-expense').description('R&D expense super deduction (研发费用加计扣除)');
    registerCrud(rdCmd, 'rd-expense', '/api/rd-expense-deductions', {
        label: '研发费用加计扣除',
        workspaceOptional: true,
        createFields: [
            { opt: '--year <year>', field: 'fiscal_year', type: 'number', req: true, desc: 'Fiscal year' },
            { opt: '--quarter <q>', field: 'quarter', type: 'number', desc: 'Quarter (1-4)' },
            { opt: '--personnel <amount>', field: 'personnel_cost', type: 'number', req: true, desc: 'Personnel cost' },
            { opt: '--direct <amount>', field: 'direct_cost', type: 'number', req: true, desc: 'Direct cost' },
            { opt: '--depreciation <amount>', field: 'depreciation_cost', type: 'number', req: true, desc: 'Depreciation cost' },
            { opt: '--intangible <amount>', field: 'intangible_asset_cost', type: 'number', req: true, desc: 'Intangible asset cost' },
            { opt: '--design <amount>', field: 'design_cost', type: 'number', req: true, desc: 'Design cost' },
            { opt: '--other <amount>', field: 'other_cost', type: 'number', req: true, desc: 'Other cost (≤10% of first 5 items)' },
            { opt: '--rate <rate>', field: 'super_deduction_rate', type: 'number', desc: 'Super deduction rate (default 1.0)' },
        ],
        listCols: [['ID', 'id'], ['Year', 'fiscal_year'], ['Quarter', 'quarter'], ['Personnel', 'personnel_cost'], ['Direct', 'direct_cost'], ['Status', 'status']],
        getFields: [['Year', 'fiscal_year'], ['Quarter', 'quarter'], ['Personnel', 'personnel_cost'], ['Direct', 'direct_cost'], ['Depreciation', 'depreciation_cost'], ['Intangible', 'intangible_asset_cost'], ['Design', 'design_cost'], ['Other', 'other_cost'], ['Rate', 'super_deduction_rate'], ['Status', 'status']],
        usePut: true,
        extraCommands: (cmd, prefix, apiPath) => {
            cmd.command('confirm')
                .description('Confirm R&D expense deduction (draft → confirmed)')
                .argument('<id>', 'Record ID')
                .option('--json', 'Output as JSON')
                .action(async (id, options) => {
                const spinner = ora('Confirming R&D expense deduction...').start();
                try {
                    const data = await apiFetch(`${apiPath}/${id}/confirm`, { method: 'PUT' });
                    spinner.succeed('R&D expense deduction confirmed');
                    if (options.json)
                        console.log(JSON.stringify(data.data || data, null, 2));
                    else
                        console.log(`${chalk.bold('Status:')} confirmed`);
                }
                catch (error) {
                    spinner.fail('Failed');
                    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
                    process.exit(1);
                }
            });
            cmd.command('summary')
                .description('Get R&D expense deduction annual summary')
                .argument('<year>', 'Fiscal year')
                .option('--json', 'Output as JSON')
                .action(async (year, options) => {
                const spinner = ora('Fetching R&D summary...').start();
                try {
                    const data = await apiFetch(`${apiPath}/summary/${year}`);
                    spinner.stop();
                    if (options.json) {
                        console.log(JSON.stringify(data.data || data, null, 2));
                    }
                    else {
                        const s = (data.data || data);
                        console.log(chalk.bold(`\nR&D Expense Deduction Summary — ${year}`));
                        console.log(chalk.gray('─'.repeat(50)));
                        console.log(`${chalk.bold('Total Personnel Cost:')} ${s.total_personnel_cost || 0}`);
                        console.log(`${chalk.bold('Total Direct Cost:')} ${s.total_direct_cost || 0}`);
                        console.log(`${chalk.bold('Total Depreciation:')} ${s.total_depreciation_cost || 0}`);
                        console.log(`${chalk.bold('Total Intangible:')} ${s.total_intangible_asset_cost || 0}`);
                        console.log(`${chalk.bold('Total Design:')} ${s.total_design_cost || 0}`);
                        console.log(`${chalk.bold('Total Other:')} ${s.total_other_cost || 0}`);
                    }
                }
                catch (error) {
                    spinner.fail('Failed');
                    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
                    process.exit(1);
                }
            });
        },
    });
    // ═══ Equity Incentive (股权激励) ═══
    const eiCmd = taxCmd.command('equity-incentive').description('Equity incentive tax (股权激励)');
    registerCrud(eiCmd, 'equity-incentive', '/api/equity-incentive', {
        label: '股权激励',
        workspaceOptional: true,
        createFields: [
            { opt: '--employee <id>', field: 'employee_id', type: 'uuid', req: true, desc: 'Employee ID (UUID)' },
            { opt: '--type <type>', field: 'incentive_type', type: 'enum', req: true, desc: 'stock_option | restricted_stock | stock_appreciation_rights' },
            { opt: '--grant-date <date>', field: 'grant_date', type: 'date', req: true, desc: 'Grant date (YYYY-MM-DD)' },
            { opt: '--quantity <qty>', field: 'grant_quantity', type: 'number', req: true, desc: 'Grant quantity (shares)' },
            { opt: '--exercise-date <date>', field: 'exercise_date', type: 'date', desc: 'Exercise date (YYYY-MM-DD)' },
            { opt: '--exercise-price <price>', field: 'exercise_price', type: 'numericString', req: true, desc: 'Exercise price' },
            { opt: '--market-price <price>', field: 'market_price', type: 'numericString', req: true, desc: 'Market price at grant' },
            { opt: '--amortization <months>', field: 'amortization_months', type: 'number', desc: 'Amortization months (default 12)' },
            { opt: '--remark <text>', field: 'remark', type: 'string', desc: 'Remark' },
        ],
        listCols: [['ID', 'id'], ['Employee', 'employee_name'], ['Type', 'incentive_type'], ['Qty', 'grant_quantity'], ['Exercise Price', 'exercise_price'], ['Status', 'status']],
        getFields: [['Employee', 'employee_name'], ['Type', 'incentive_type'], ['Grant Date', 'grant_date'], ['Quantity', 'grant_quantity'], ['Exercise Price', 'exercise_price'], ['Market Price', 'market_price'], ['Amortization', 'amortization_months'], ['Status', 'status']],
        hasPost: true,
        hardDelete: true,
        postRole: 'admin',
    });
}
function registerCrud(cmd, prefix, apiPath, cfg) {
    const W = cfg.workspaceOptional;
    // --- LIST ---
    cmd.command('list')
        .description(`List ${cfg.label} records`)
        .option('-w, --workspace <id>', `Workspace ID${W ? '' : ' (required)'}`)
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        if (!W && !options.workspace) {
            console.error(chalk.red('Error: --workspace is required'));
            process.exit(1);
        }
        const spinner = ora(`Fetching ${cfg.label}...`).start();
        try {
            const params = new URLSearchParams();
            if (options.workspace)
                params.append('workspace_id', options.workspace);
            const data = await apiFetch(`${apiPath}?${params.toString()}`);
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(data, null, 2));
                return;
            }
            const items = (Array.isArray(data) ? data : (data.data || data.records || data.items)) || [];
            if (items.length === 0) {
                console.log(chalk.yellow(`No ${cfg.label} records found`));
                return;
            }
            const rows = [
                cfg.listCols.map(([h]) => h),
                ...items.map((r) => cfg.listCols.map(([, f]) => formatCell(r, f))),
            ];
            console.log(chalk.bold(`\n${cfg.label}`));
            console.log(table(rows));
            console.log(chalk.gray(`\nTotal: ${items.length} records`));
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // --- GET ---
    cmd.command('get')
        .description(`Get ${cfg.label} details`)
        .argument('<id>', 'Record ID')
        .option('--json', 'Output as JSON')
        .action(async (id, options) => {
        const spinner = ora(`Fetching ${cfg.label}...`).start();
        try {
            const data = await apiFetch(`${apiPath}/${id}`);
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
                return;
            }
            const r = (data.data || data);
            console.log(chalk.bold(`\n${cfg.label} Details:`));
            console.log(chalk.gray('─'.repeat(50)));
            console.log(`${chalk.bold('ID:')} ${r.id}`);
            cfg.getFields.forEach(([label, field]) => {
                const v = r[field];
                if (v !== null && v !== undefined && v !== '') {
                    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) {
                        console.log(`${chalk.bold(label + ':')} ${new Date(v).toLocaleDateString()}`);
                    }
                    else {
                        console.log(`${chalk.bold(label + ':')} ${v}`);
                    }
                }
            });
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // --- CREATE ---
    const createCmd = cmd.command('create').description(`Create a ${cfg.label} record`);
    createCmd.option('-w, --workspace <id>', `Workspace ID${W ? '' : ' (required)'}`);
    cfg.createFields.forEach(f => {
        if (f.req)
            createCmd.requiredOption(f.opt, f.desc || '');
        else
            createCmd.option(f.opt, f.desc || '');
    });
    createCmd.option('--json', 'Output as JSON')
        .action(async (options) => {
        if (!W && !options.workspace) {
            console.error(chalk.red('Error: --workspace is required'));
            process.exit(1);
        }
        const spinner = ora(`Creating ${cfg.label}...`).start();
        try {
            const body = {};
            if (!W)
                body.workspace_id = options.workspace;
            cfg.createFields.forEach(f => {
                const val = options[camelOption(f.opt)];
                if (val !== undefined) {
                    if (f.type === 'number')
                        body[f.field] = Number(val);
                    else if (f.type === 'numericString')
                        body[f.field] = String(val);
                    else
                        body[f.field] = val;
                }
            });
            const data = await apiFetch(apiPath, { method: 'POST', body: JSON.stringify(body) });
            spinner.succeed(`${cfg.label} created`);
            if (options.json) {
                console.log(JSON.stringify(data.data || data, null, 2));
            }
            else {
                const r = (data.data || data);
                console.log(chalk.bold(`\nCreated ${cfg.label}:`));
                console.log(`ID: ${r.id}`);
            }
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // --- DELETE ---
    cmd.command('delete')
        .description(`Delete a ${cfg.label} record`)
        .argument('<id>', 'Record ID')
        .action(async (id) => {
        const spinner = ora(`Deleting ${cfg.label}...`).start();
        try {
            await apiFetch(`${apiPath}/${id}`, { method: 'DELETE' });
            spinner.succeed(`${cfg.label} deleted`);
        }
        catch (error) {
            spinner.fail('Failed');
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    });
    // --- UPDATE ---
    if (!cfg.usePut) {
        const updateCmd = cmd.command('update').description(`Update a ${cfg.label} record`);
        updateCmd.argument('<id>', 'Record ID');
        updateCmd.option('-w, --workspace <id>', `Workspace ID${W ? '' : ' (required)'}`);
        cfg.createFields.forEach(f => { updateCmd.option(f.opt, f.desc || ''); });
        updateCmd.option('--json', 'Output as JSON')
            .action(async (id, options) => {
            const spinner = ora(`Updating ${cfg.label}...`).start();
            try {
                const body = {};
                cfg.createFields.forEach(f => {
                    const val = options[camelOption(f.opt)];
                    if (val !== undefined) {
                        if (f.type === 'number')
                            body[f.field] = Number(val);
                        else if (f.type === 'numericString')
                            body[f.field] = String(val);
                        else
                            body[f.field] = val;
                    }
                });
                const data = await apiFetch(`${apiPath}/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
                spinner.succeed(`${cfg.label} updated`);
                if (options.json) {
                    console.log(JSON.stringify(data.data || data, null, 2));
                }
                else {
                    const r = (data.data || data);
                    console.log(chalk.bold(`\nUpdated ${cfg.label}:`));
                    console.log(`ID: ${r.id}`);
                }
            }
            catch (error) {
                spinner.fail('Failed');
                console.error(chalk.red(error instanceof Error ? error.message : String(error)));
                process.exit(1);
            }
        });
    }
    // --- POST (if applicable) ---
    if (cfg.hasPost) {
        cmd.command('post')
            .description(`Post (finalize) a ${cfg.label} record`)
            .argument('<id>', 'Record ID')
            .option('--json', 'Output as JSON')
            .action(async (id, options) => {
            const spinner = ora(`Posting ${cfg.label}...`).start();
            try {
                const data = await apiFetch(`${apiPath}/${id}/post`, { method: 'POST' });
                spinner.succeed(`${cfg.label} posted`);
                if (options.json) {
                    console.log(JSON.stringify(data.data || data, null, 2));
                }
                else {
                    const r = (data.data || data);
                    console.log(`${chalk.bold('Status:')} ${r.status || 'posted'}`);
                }
            }
            catch (error) {
                spinner.fail('Failed');
                console.error(chalk.red(error instanceof Error ? error.message : String(error)));
                process.exit(1);
            }
        });
    }
    // Module-specific extra commands
    if (cfg.extraCommands) {
        cfg.extraCommands(cmd, prefix, apiPath);
    }
}
// Helper: extract camelCase option name from Commander option string
function camelOption(opt) {
    // '--employee <id>' → 'employee'
    // '--id-card <number>' → 'idCard'
    // '--avg-salary <amount>' → 'avgSalary'
    // '--tax-credit <amount>' → 'taxCredit'
    const name = opt.replace(/^--/, '').split(' ')[0].trim();
    return name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}
// Helper: format cell value for table display
function formatCell(row, field) {
    const v = row[field];
    if (v === null || v === undefined)
        return '-';
    if (field === 'id' && typeof v === 'string')
        return v.substring(0, 8) + '...';
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v))
        return new Date(v).toLocaleDateString();
    if (typeof v === 'number')
        return v.toLocaleString();
    return String(v);
}
