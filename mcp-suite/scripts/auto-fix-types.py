#!/usr/bin/env python3
"""
自动修复 SSOS MCP Suite 中剩余工具的类型安全问题
"""

import re
import os
from pathlib import Path

# 项目根目录
ROOT = Path("/Users/rocalight/Desktop/All in one Data/01_PROJECTS/ssos/ssos-mcp-suite")

# 需要修复的文件
FILES_TO_FIX = [
    "packages/accounting/src/tools/partners-invoices.ts",
    "packages/accounting/src/tools/expenses-org.ts",
    "packages/hr/src/tools/employees.ts",
    "packages/hr/src/tools/payroll.ts",
    "packages/hr/src/tools/labor-contracts.ts",
    "packages/legal/src/tools/contracts.ts",
    "packages/legal/src/tools/contract-review.ts",
    "packages/legal/src/tools/demand-letters.ts",
    "packages/core/src/tools/workspace.ts",
    "packages/core/src/tools/api-key-management.ts",
]

def pascal_case(snake_str):
    """转换 snake_case 为 PascalCase"""
    return ''.join(word.capitalize() for word in snake_str.split('_'))

def extract_tool_names(content):
    """提取文件中所有的工具名"""
    pattern = r'(\w+):\s*\{\s*description:'
    matches = re.findall(pattern, content)
    return matches

def fix_file(file_path):
    """修复单个文件的类型安全问题"""
    full_path = ROOT / file_path

    if not full_path.exists():
        print(f"❌ 文件不存在: {file_path}")
        return

    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 统计 args: any 数量
    any_count = len(re.findall(r'args:\s*any', content))

    if any_count == 0:
        print(f"✓ {file_path} - 已经是类型安全的")
        return

    print(f"⚠ {file_path} - 发现 {any_count} 个 'args: any'")

    # 提取所有工具名
    tool_names = extract_tool_names(content)
    print(f"  工具: {', '.join(tool_names)}")

    # 对每个工具生成类型名并替换
    for tool_name in tool_names:
        input_type = pascal_case(tool_name) + 'Input'

        # 替换该工具的 args: any
        pattern = rf'({re.escape(tool_name)}:\s*\{{[\s\S]*?handler:\s*async\s*\()args:\s*any(\))'
        content = re.sub(pattern, rf'\1args: {input_type}\2', content)

    # 更新 imports
    import_pattern = r"import type \{ ([^}]+) \} from '@ssos/mcp-shared';"
    import_match = re.search(import_pattern, content)

    if import_match:
        existing_imports = [s.strip() for s in import_match.group(1).split(',')]
        new_imports = [pascal_case(name) + 'Input' for name in tool_names]
        all_imports = sorted(set(existing_imports + new_imports))

        new_import_line = f"import type {{ {', '.join(all_imports)} }} from '@ssos/mcp-shared';"
        content = re.sub(import_pattern, new_import_line, content)

    # 替换 body: any
    content = re.sub(r'const body:\s*any\s*=', 'const body: Record<string, unknown> =', content)

    # 写回文件
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"✅ {file_path} - 已修复\n")

def main():
    print("开始批量修复类型安全问题...\n")

    for file_path in FILES_TO_FIX:
        fix_file(file_path)

    print("\n✅ 所有文件处理完成！")
    print("\n下一步：")
    print("1. 在 packages/shared/src/types.ts 中定义缺失的类型")
    print("2. 运行 npm run build 验证")

if __name__ == '__main__':
    main()
