import { Command } from 'commander';
/**
 * Tax module - 税务业务逻辑
 *
 * 本模块提供 6 个税务计算和查询命令。
 * 税务数据操作请使用 'crud' 命令：
 *   crud list annual-bonus
 *   crud list dividend-payments
 *   crud list iit-filings
 */
export declare function createTaxCommand(): Command;
