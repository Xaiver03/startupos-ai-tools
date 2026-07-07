/**
 * Natural language → SSOS CLI command parser.
 * Keyword-based matching for common financial operations.
 */
interface ParsedCommand {
    name: string;
    args: string;
}
export declare function parseCommand(message: string): ParsedCommand | null;
export {};
