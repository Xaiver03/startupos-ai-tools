/**
 * AI Chat engine for the SSOS Chatbot.
 * Calls SSOS AI API for financial domain intelligence.
 */
const AI_API_URL = process.env.AI_API_URL || process.env.API_URL || 'https://api.finlaw.cloud';
export async function chatWithAI(ctx) {
    // If we have command result data, format it naturally
    if (ctx.commandResult) {
        return formatCommandResult(ctx.message, ctx.commandResult);
    }
    // Otherwise, call SSOS AI
    try {
        const token = process.env.SSOS_API_KEY;
        const response = await fetch(`${AI_API_URL}/api/rpc/ai_chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                message: ctx.message,
                workspace_id: ctx.workspace_id,
                session_id: ctx.session_id,
                history: ctx.history,
            }),
        });
        if (response.ok) {
            const data = await response.json();
            return data.data?.response || data.response || '收到你的消息，但我暂时无法处理这个请求。';
        }
    }
    catch (err) {
        console.error('AI chat API error:', err);
    }
    return generateFallbackResponse(ctx.message);
}
function formatCommandResult(message, result) {
    const msg = message.toLowerCase();
    // Handle lists
    if (Array.isArray(result)) {
        if (result.length === 0) {
            return '查询结果为空，没有找到相关数据。';
        }
        const count = result.length;
        let summary = `查询到 ${count} 条记录：\n\n`;
        result.slice(0, 5).forEach((item, i) => {
            if (item.name) {
                summary += `${i + 1}. ${item.name} - ${item.status || item.amount || ''}\n`;
            }
            else if (item.entry_date) {
                summary += `${i + 1}. ${item.entry_date} - ${item.description} (${item.total_amount || '-'})\n`;
            }
            else if (item.task_name || item.name) {
                summary += `${i + 1}. ${item.task_name || item.name} - 截止: ${item.deadline || '无'} [${item.status || '待办'}]\n`;
            }
            else {
                summary += `${i + 1}. ${JSON.stringify(item).substring(0, 80)}\n`;
            }
        });
        if (count > 5) {
            summary += `\n... 还有 ${count - 5} 条记录。`;
        }
        return summary;
    }
    // Handle single objects
    if (result && typeof result === 'object') {
        if (result.revenue !== undefined || result.net_income !== undefined) {
            return formatFinancialStatement(result);
        }
        if (result.balances) {
            return `试算平衡表：共 ${result.balances.length} 个科目，借方合计 ${result.total_debit || '-'}，贷方合计 ${result.total_credit || '-'}。`;
        }
        if (result.id) {
            return `操作成功。ID: ${result.id.substring(0, 8)}...`;
        }
    }
    return `操作完成。结果: ${JSON.stringify(result).substring(0, 200)}`;
}
function formatFinancialStatement(report) {
    return `📊 财务报表：
- 营业收入: ${report.revenue || '-'}
- 营业成本: ${report.cogs || report.cost_of_goods_sold || '-'}
- 毛利润: ${report.gross_profit || '-'}
- 营业费用: ${report.operating_expenses || '-'}
- 营业利润: ${report.operating_income || '-'}
- 净利润: ${report.net_income || '-'}`;
}
function generateFallbackResponse(message) {
    const msg = message.toLowerCase();
    if (msg.includes('你好') || msg.includes('hi') || msg.includes('hello')) {
        return '你好！我是 SSOS AI 助手，可以帮你处理财务管理相关的事务。你可以问我：\n• 查询凭证或财务报表\n• 查看税务日历\n• 处理薪酬和员工\n• 审查合同\n• AI 智能记账\n\n请问有什么可以帮你的？';
    }
    if (msg.includes('帮助') || msg.includes('help') || msg.includes('功能')) {
        return 'SSOS Chatbot 支持以下功能：\n1. 会计：查询凭证、生成报表、科目管理\n2. 税务：税务日历、合规检查、申报表\n3. 银行：账户管理、流水查询、对账\n4. 发票：增值税发票、往来单位\n5. 人力资源：员工管理、薪酬、劳动合同\n6. 报销：报销单审批\n7. 法务：合同管理、审查、催款函\n8. AI 记账：智能记账、发票OCR\n\n请告诉我你需要什么帮助？';
    }
    return '收到你的消息。我可以帮你处理会计、税务、银行、发票、人力资源、报销、法务等方面的事务。请具体描述你的需求，例如"查询最近的凭证"或"生成利润表"等。';
}
