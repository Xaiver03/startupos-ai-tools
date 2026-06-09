/**
 * AI Chat engine for the SSOS Chatbot.
 * Calls SSOS AI API for financial domain intelligence.
 */
interface ChatContext {
    message: string;
    workspace_id?: string;
    session_id?: string;
    history: Array<{
        role: 'user' | 'assistant';
        content: string;
    }>;
    commandResult: any;
}
export declare function chatWithAI(ctx: ChatContext): Promise<string>;
export {};
