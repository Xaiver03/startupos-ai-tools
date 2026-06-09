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
export function normalizeCompanyName(name, toLowerCase = false) {
    if (!name)
        return '';
    let normalized = name
        // 全角括号转半角
        .replace(/（/g, '(')
        .replace(/）/g, ')')
        // 去除所有空格
        .replace(/\s+/g, '')
        // 全角逗号转半角
        .replace(/，/g, ',')
        // 去除特殊字符（保留括号和逗号）
        .trim();
    if (toLowerCase) {
        normalized = normalized.toLowerCase();
    }
    return normalized;
}
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
export function extractKeywords(name) {
    if (!name)
        return [];
    const normalized = normalizeCompanyName(name);
    // 特殊关键词映射
    const specialKeywords = {
        '芝诺': ['芝诺', '青岛', '生物'],
        '梦溪': ['梦溪', '创坛'],
        '西南大学': ['西南大学', '西南'],
        '北师大': ['北京师范', '师范大学', '北师大'],
        '北京林业大学': ['北京林业', '林业大学', '北林'],
        '清华': ['清华', '深圳', '国际研究生院'],
    };
    // 检查是否匹配特殊关键词
    for (const [key, keywords] of Object.entries(specialKeywords)) {
        if (normalized.includes(key)) {
            return keywords;
        }
    }
    // 默认：提取前 5 个字符作为关键词
    const keywords = [];
    if (normalized.length >= 5) {
        keywords.push(normalized.substring(0, 5));
    }
    if (normalized.length >= 3) {
        keywords.push(normalized.substring(0, 3));
    }
    // 移除括号内容后的主体名称
    const mainName = normalized.replace(/\([^)]*\)/g, '');
    if (mainName && mainName !== normalized) {
        keywords.push(mainName);
    }
    return [...new Set(keywords)]; // 去重
}
/**
 * 判断两个公司名称是否匹配
 *
 * @param name1 - 名称1
 * @param name2 - 名称2
 * @param method - 匹配方式：'exact' | 'fuzzy' | 'keyword'
 * @returns 是否匹配
 */
export function matchCompanyName(name1, name2, method = 'exact') {
    const normalized1 = normalizeCompanyName(name1);
    const normalized2 = normalizeCompanyName(name2);
    if (!normalized1 || !normalized2)
        return false;
    switch (method) {
        case 'exact':
            // 精确匹配
            return normalized1 === normalized2;
        case 'fuzzy':
            // 模糊匹配（包含关系）
            return normalized1.includes(normalized2) || normalized2.includes(normalized1);
        case 'keyword':
            // 关键词匹配
            const keywords1 = extractKeywords(normalized1);
            const keywords2 = extractKeywords(normalized2);
            // 任意一个关键词匹配即可
            return keywords1.some(k1 => keywords2.some(k2 => k1.includes(k2) || k2.includes(k1)));
        default:
            return false;
    }
}
//# sourceMappingURL=name-normalizer.js.map