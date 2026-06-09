/**
 * 名称标准化工具
 * 用于统一公司名称格式，处理全角/半角、括号、空格等差异
 */
/**
 * 标准化公司名称
 * - 全角括号转半角
 * - 去除所有空格
 * - 转为小写（可选）
 *
 * @param name - 原始公司名称
 * @param toLowerCase - 是否转为小写（默认 false）
 * @returns 标准化后的名称
 *
 * @example
 * normalizeCompanyName('芝诺（青岛）生物科技') // '芝诺(青岛)生物科技'
 * normalizeCompanyName('北京 林业 大学') // '北京林业大学'
 */
export declare function normalizeCompanyName(name: string | null | undefined, toLowerCase?: boolean): string;
/**
 * 提取公司名称关键词
 * 用于模糊匹配
 *
 * @param name - 公司名称
 * @returns 关键词数组
 *
 * @example
 * extractKeywords('芝诺未来生物科技（青岛）有限公司')
 * // ['芝诺', '未来', '生物科技', '青岛']
 */
export declare function extractKeywords(name: string): string[];
/**
 * 判断两个公司名称是否匹配
 *
 * @param name1 - 名称1
 * @param name2 - 名称2
 * @param method - 匹配方式：'exact' | 'fuzzy' | 'keyword'
 * @returns 是否匹配
 */
export declare function matchCompanyName(name1: string, name2: string, method?: 'exact' | 'fuzzy' | 'keyword'): boolean;
//# sourceMappingURL=name-normalizer.d.ts.map