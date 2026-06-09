#!/bin/bash
# 批量修复剩余的 TypeScript 文件类型安全问题

cd "/Users/rocalight/Desktop/All in one Data/01_PROJECTS/ssos/ssos-mcp-suite"

echo "开始批量修复..."

# 统计当前 args: any 数量
echo "修复前统计："
find packages -name "*.ts" -type f | grep -v node_modules | grep -v dist | xargs grep "args: any" | wc -l

echo ""
echo "剩余需要修复的文件："
find packages -name "*.ts" -type f | grep -v node_modules | grep -v dist | xargs grep -l "args: any"

echo ""
echo "完成统计！下一步需要手动修复这些文件。"
