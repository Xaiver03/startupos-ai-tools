/**
 * Natural language → SSOS CLI command parser.
 * Keyword-based matching for common financial operations.
 */
const COMMAND_PATTERNS = [
    // Accounting - journal entries
    {
        keywords: ['凭证', '分录', '记账凭证', 'journal', '会计凭证'],
        command: 'accounting journal-list',
    },
    {
        keywords: ['凭证详情', '查看凭证', '分录详情'],
        command: 'accounting journal-get',
    },
    {
        keywords: ['创建凭证', '新增凭证', '做凭证', '记一笔'],
        command: 'accounting journal-create',
    },
    {
        keywords: ['冲红', '冲销', '红字', 'reverse'],
        command: 'accounting journal-reverse',
    },
    // Accounting - reports
    {
        keywords: ['利润表', '损益表', 'income statement', '利润', '损益', '盈利'],
        command: 'accounting income-statement',
    },
    {
        keywords: ['试算平衡', 'trial balance', '试算', '平衡表'],
        command: 'accounting trial-balance',
    },
    {
        keywords: ['总账', 'general ledger', '分类账'],
        command: 'accounting general-ledger',
    },
    {
        keywords: ['现金日记账', '现金', 'cash journal'],
        command: 'accounting cash-journal',
    },
    {
        keywords: ['银行日记账', '银行存款日记账', 'bank journal'],
        command: 'accounting bank-journal',
    },
    {
        keywords: ['科目余额', '余额表', 'account balance', '科目余额表'],
        command: 'accounting account-balances',
    },
    {
        keywords: ['科目', '会计科目', 'accounts', 'chart of accounts'],
        command: 'accounting account-list',
    },
    // Tax
    {
        keywords: ['税务日历', '税务', '申报日历', 'tax calendar', '报税'],
        command: 'tax calendar',
    },
    {
        keywords: ['税务计算', '税费计算', '算税', 'tax calculation'],
        command: 'tax calculations',
    },
    {
        keywords: ['税务申报', '申报表', 'filings', '纳税申报'],
        command: 'tax filings',
    },
    {
        keywords: ['合规检查', '合规', 'compliance', '风险检查'],
        command: 'tax compliance',
    },
    {
        keywords: ['亏损结转', '亏损弥补', 'loss carryforward', '弥补亏损'],
        command: 'tax loss-carryforward',
    },
    // Banking
    {
        keywords: ['银行账户', '银行', 'bank account'],
        command: 'banking account-list',
    },
    {
        keywords: ['银行流水', '交易记录', 'transaction', 'bank transaction'],
        command: 'banking transaction-list',
    },
    {
        keywords: ['银行对账', '对账', 'reconciliation', '余额调节'],
        command: 'banking reconciliation-list',
    },
    // Invoice
    {
        keywords: ['发票', '增值税发票', 'invoice', 'vat invoice', '进项', '销项'],
        command: 'invoice list',
    },
    {
        keywords: ['往来单位', '客户', '供应商', 'partner', '往来', '客商'],
        command: 'invoice partner-list',
    },
    {
        keywords: ['创建发票', '开具发票', '开票'],
        command: 'invoice create',
    },
    // HR
    {
        keywords: ['员工', '职员', 'employee', '人员', '职工'],
        command: 'hr employee-list',
    },
    {
        keywords: ['创建员工', '添加员工', '新增员工', '入职'],
        command: 'hr employee-create',
    },
    {
        keywords: ['工资', '薪酬', 'payroll', '薪资', '发放工资'],
        command: 'hr payroll-list',
    },
    {
        keywords: ['劳动合同', 'labor contract', '合同列表', '用工合同'],
        command: 'hr contract-list',
    },
    // Expense
    {
        keywords: ['报销', '报销单', 'expense', '费用报销', '差旅费'],
        command: 'expense list',
    },
    {
        keywords: ['部门', 'department', '组织架构'],
        command: 'expense department-list',
    },
    // Legal
    {
        keywords: ['合同', 'contract', '协议', '合同管理'],
        command: 'legal contract-list',
    },
    {
        keywords: ['审查合同', '合同审查', '审合同', 'review contract'],
        command: 'legal contract-review',
    },
    {
        keywords: ['催款函', '催款', 'demand letter', '催收函', '催收'],
        command: 'legal demand-list',
    },
    {
        keywords: ['生成合同', '起草合同', '合同生成'],
        command: 'legal contract-generate',
    },
    // AI Bookkeeping
    {
        keywords: ['AI记账', '智能记账', 'ai bookkeeping', '语音记账', '自动记账'],
        command: 'ai-bookkeeping book',
    },
    {
        keywords: ['OCR', '识别发票', '扫描发票', '发票识别'],
        command: 'ai-bookkeeping ocr',
    },
    {
        keywords: ['合规问答', '税务问答', 'compliance qa'],
        command: 'ai-bookkeeping compliance',
    },
    // Period
    {
        keywords: ['会计期间', '期间', 'period', '账期', '结账期间'],
        command: 'period list',
    },
    {
        keywords: ['期末结账', '结账', '月结', 'close period', '关账'],
        command: 'period close',
    },
    // Workspace
    {
        keywords: ['工作空间', 'workspace', '切换空间', '当前空间'],
        command: 'workspace-api current',
    },
    {
        keywords: ['空间列表', '工作区', 'workspace list'],
        command: 'workspace-api list',
    },
];
export function parseCommand(message) {
    const normalized = message.toLowerCase().trim();
    // Try exact command prefix: "ssos-cli xxx"
    const cliPrefix = normalized.match(/^ssos-cli\s+(.+)/);
    if (cliPrefix) {
        const parts = cliPrefix[1].split(/\s+/);
        return {
            name: parts.slice(0, 2).join(' '),
            args: parts.slice(2).join(' '),
        };
    }
    // Match by keywords
    for (const pattern of COMMAND_PATTERNS) {
        for (const keyword of pattern.keywords) {
            if (normalized.includes(keyword.toLowerCase())) {
                return {
                    name: pattern.command,
                    args: extractArgs(message, pattern.command),
                };
            }
        }
    }
    return null;
}
function extractArgs(message, command) {
    // Extract date/period patterns from message
    const dateMatch = message.match(/(\d{4}-\d{2}(?:-\d{2})?)/g);
    const parts = [];
    if (dateMatch) {
        if (dateMatch.length >= 2) {
            parts.push(`-s ${dateMatch[0]} -e ${dateMatch[1]}`);
        }
        else if (dateMatch[0].length === 7) {
            parts.push(`--period ${dateMatch[0]}`);
        }
        else {
            parts.push(`-s ${dateMatch[0]}`);
        }
    }
    // Extract limit
    const limitMatch = message.match(/(\d+)\s*(条|笔|个|项)/);
    if (limitMatch) {
        parts.push(`-l ${limitMatch[1]}`);
    }
    // Extract employee name
    const nameMatch = message.match(/(?:员工|职员|创建|添加)\s*([\u4e00-\u9fa5]{2,4})/);
    if (nameMatch) {
        parts.push(`-n "${nameMatch[1]}"`);
    }
    return parts.join(' ');
}
