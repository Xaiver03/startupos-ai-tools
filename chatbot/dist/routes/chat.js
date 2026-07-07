import { Hono } from 'hono';
import { z } from 'zod';
import { parseCommand } from '../services/command-parser.js';
import { executeCommand } from '../services/command-executor.js';
import { chatWithAI } from '../services/llm.js';
const chatSchema = z.object({
    message: z.string().min(1),
    workspace_id: z.string().optional(),
    session_id: z.string().optional(),
    history: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
    })).optional(),
});
export function createChatRoutes() {
    const router = new Hono();
    router.post('/message', async (c) => {
        try {
            const body = await c.req.json();
            const parsed = chatSchema.safeParse(body);
            if (!parsed.success) {
                c.status(400);
                return c.json({ error: 'Invalid request', details: parsed.error.issues });
            }
            const { message, workspace_id, session_id, history } = parsed.data;
            // Step 1: Parse natural language → CLI command
            const command = parseCommand(message);
            // Step 2: Execute command if determined
            let result = null;
            if (command) {
                try {
                    result = await executeCommand(command, workspace_id);
                }
                catch (err) {
                    // If command execution fails, fall through to AI chat
                    console.error('Command execution failed:', err);
                }
            }
            // Step 3: Generate AI response based on result or context
            const aiResponse = await chatWithAI({
                message,
                workspace_id,
                session_id,
                history: history || [],
                commandResult: result,
            });
            return c.json({
                type: result ? 'command_result' : 'text',
                content: aiResponse,
                command: command ? {
                    name: command.name,
                    args: command.args,
                } : undefined,
                result: result ? {
                    success: true,
                    data: result,
                } : undefined,
                suggested_actions: extractSuggestedActions(message, result),
            });
        }
        catch (error) {
            console.error('Chat error:', error);
            c.status(500);
            return c.json({
                type: 'error',
                content: error instanceof Error ? error.message : 'Internal server error',
            });
        }
    });
    return router;
}
function extractSuggestedActions(message, result) {
    const actions = [];
    const msg = message.toLowerCase();
    if (msg.includes('凭证') || msg.includes('journal')) {
        actions.push('查看凭证列表', '创建新凭证');
    }
    if (msg.includes('利润表') || msg.includes('报表')) {
        actions.push('导出Excel', '查看详细数据');
    }
    if (msg.includes('发票')) {
        actions.push('查看发票列表', '创建发票');
    }
    if (msg.includes('员工') || msg.includes('工资')) {
        actions.push('查看员工列表', '处理薪酬');
    }
    if (msg.includes('合同')) {
        actions.push('审查合同', '查看合同详情');
    }
    if (actions.length === 0) {
        actions.push('查看详情', '导出数据');
    }
    return actions.slice(0, 3);
}
