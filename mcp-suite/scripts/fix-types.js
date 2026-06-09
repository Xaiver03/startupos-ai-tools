#!/usr/bin/env node

/**
 * 批量修复 SSOS MCP Suite 中剩余工具的类型安全问题
 *
 * 策略：
 * 1. 读取每个工具文件
 * 2. 提取所有 handler: async (args: any) 模式
 * 3. 根据 inputSchema 生成对应的 TypeScript 接口
 * 4. 替换 args: any 为具体类型
 * 5. 更新 imports
 */

import fs from 'fs';
import path from 'path';

const SSOS_MCP_SUITE = '/Users/rocalight/Desktop/All in one Data/01_PROJECTS/ssos/ssos-mcp-suite';

// 待处理的文件列表
const filesToFix = [
  'packages/accounting/src/tools/banking.ts',
  'packages/accounting/src/tools/periods.ts',
  'packages/accounting/src/tools/partners-invoices.ts',
  'packages/accounting/src/tools/expenses-org.ts',
  'packages/hr/src/tools/employees.ts',
  'packages/hr/src/tools/payroll.ts',
  'packages/hr/src/tools/labor-contracts.ts',
  'packages/legal/src/tools/contracts.ts',
  'packages/legal/src/tools/contract-review.ts',
  'packages/legal/src/tools/demand-letters.ts',
  'packages/core/src/tools/workspace.ts',
  'packages/core/src/tools/api-key-management.ts',
];

function toPascalCase(str) {
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

function processFile(filePath) {
  const fullPath = path.join(SSOS_MCP_SUITE, filePath);
  const content = fs.readFileSync(fullPath, 'utf-8');

  // 找到所有 args: any 模式
  const anyPattern = /handler:\s*async\s*\(args:\s*any\)/g;
  const matches = content.match(anyPattern);

  if (!matches) {
    console.log(`✓ ${filePath} - 已经是类型安全的`);
    return;
  }

  console.log(`⚠ ${filePath} - 发现 ${matches.length} 个 'args: any'`);

  // 简单替换策略：根据工具名生成类型名
  let updatedContent = content;

  // 提取所有工具名
  const toolNamePattern = /(\w+):\s*\{\s*description:/g;
  let toolMatch;
  const toolNames = [];

  while ((toolMatch = toolNamePattern.exec(content)) !== null) {
    toolNames.push(toolMatch[1]);
  }

  console.log(`  工具: ${toolNames.join(', ')}`);

  // 对于每个工具，生成输入类型名
  toolNames.forEach(toolName => {
    const inputTypeName = toPascalCase(toolName) + 'Input';

    // 替换该工具的 args: any
    const toolPattern = new RegExp(`(${toolName}:\\s*\\{[\\s\\S]*?handler:\\s*async\\s*\\()args:\\s*any(\\))`, 'g');
    updatedContent = updatedContent.replace(toolPattern, `$1args: ${inputTypeName}$2`);
  });

  // 更新 imports (简单版本，假设所有类型都从 @ssos/mcp-shared 导入)
  const importPattern = /import type \{ ([^}]+) \} from '@ssos\/mcp-shared';/;
  const importMatch = updatedContent.match(importPattern);

  if (importMatch) {
    const existingImports = importMatch[1].split(',').map(s => s.trim());
    const newImports = toolNames.map(name => toPascalCase(name) + 'Input');
    const allImports = [...new Set([...existingImports, ...newImports])];

    updatedContent = updatedContent.replace(
      importPattern,
      `import type { ${allImports.join(', ')} } from '@ssos/mcp-shared';`
    );
  }

  // 写回文件
  fs.writeFileSync(fullPath, updatedContent, 'utf-8');
  console.log(`✅ ${filePath} - 已修复\n`);
}

console.log('开始批量修复类型安全问题...\n');

filesToFix.forEach(processFile);

console.log('\n✅ 所有文件处理完成！');
console.log('\n下一步：');
console.log('1. 检查生成的类型名是否正确');
console.log('2. 在 packages/shared/src/types.ts 中定义这些类型');
console.log('3. 运行 npm run build 验证');
