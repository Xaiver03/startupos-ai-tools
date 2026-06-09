# SSOS 工具对齐分析报告

生成时间：2026-06-08

## 概览

SSOS 目前有三套工具体系：
1. **CLI (ssos-cli)** - 服务端命令行工具，25个命令模块
2. **MCP Legacy (ssos-mcp)** - 单一 MCP Server，8个工具组
3. **MCP Suite** - 模块化 MCP Servers，17个工具文件
4. **Skills** - Claude Code 技能，3个 Skill 文件

## 功能覆盖对比

### 1. CLI 命令模块（25个）

| 模块 | 功能域 | 子命令数量 |
|------|--------|-----------|
| accounting | 会计核心 | ~15 (凭证、科目、报表) |
| admin | 系统管理 | ~10 |
| admin-extended | 扩展管理 | ~8 |
| ai | AI 功能 | ~5 |
| ai-bookkeeping | AI 记账 | ~6 |
| api | API 操作 | ~5 |
| api-key | API 密钥管理 | ~5 |
| auth | 认证 | ~4 |
| banking | 银行对账 | ~10 |
| crud | 通用 CRUD | ~20+ |
| db | 数据库操作 | ~5 |
| expense | 报销管理 | ~12 |
| files | 文件管理 | ~6 |
| hr | 人力资源 | ~10 |
| import-export | 数据导入导出 | ~6 |
| invoice | 发票管理 | ~10 |
| legal | 法务 | ~12 |
| logs | 日志查看 | ~4 |
| my | 个人中心 | ~8 |
| period | 会计期间 | ~8 |
| tax | 税务 | ~15 |
| tax-modules | 税务模块 | ~10 |
| users | 用户管理 | ~6 |
| workspace | 工作空间 | ~5 |
| workspace-api | 工作空间 API | ~6 |

**总计**: ~206 个子命令

### 2. MCP Legacy (ssos-mcp) - 8个工具组

| 工具组 | 对应 CLI 模块 | 覆盖度 |
|--------|--------------|--------|
| accounting | accounting | ✅ 部分 |
| workspace | workspace | ✅ 完整 |
| auth | auth | ✅ 完整 |
| tax | tax | ✅ 部分 |
| reports | accounting (报表部分) | ✅ 完整 |
| api-key-management | api-key | ✅ 完整 |
| payroll | hr (薪酬部分) | ✅ 完整 |
| files | files | ✅ 完整 |

**覆盖度**: ~35% (8/25 CLI 模块)

### 3. MCP Suite - 17个工具文件

#### Accounting Package (7个)
| 工具文件 | 对应 CLI | 状态 |
|---------|---------|------|
| accounting.ts | accounting | ✅ |
| banking.ts | banking | ✅ |
| expenses-org.ts | expense | ✅ |
| partners-invoices.ts | invoice | ✅ |
| periods.ts | period | ✅ |
| reports.ts | accounting (报表) | ✅ |
| tax.ts | tax | ✅ |

#### Core Package (3个)
| 工具文件 | 对应 CLI | 状态 |
|---------|---------|------|
| auth.ts | auth | ✅ |
| workspace.ts | workspace | ✅ |
| api-key-management.ts | api-key | ✅ |

#### AI Package (1个)
| 工具文件 | 对应 CLI | 状态 |
|---------|---------|------|
| ai-bookkeeping.ts | ai-bookkeeping | ✅ |

#### HR Package (3个)
| 工具文件 | 对应 CLI | 状态 |
|---------|---------|------|
| employees.ts | hr (员工) | ✅ |
| labor-contracts.ts | hr (合同) | ✅ |
| payroll.ts | hr (薪酬) | ✅ |

#### Legal Package (3个)
| 工具文件 | 对应 CLI | 状态 |
|---------|---------|------|
| contracts.ts | legal (合同) | ✅ |
| contract-review.ts | legal (审查) | ✅ |
| demand-letters.ts | legal (催款函) | ✅ |

**覆盖度**: ~50% (17个工具组 vs 25个 CLI 模块)

### 4. Skills - 3个文件

| Skill | 功能 | 绑定工具 |
|-------|------|---------|
| ssos-cli.md | CLI 使用指南 | ✅ 完整映射 CLI |
| organize-finances.md | 财务整理工作流 | ❌ 无直接工具绑定 |
| organize-finances-checklist.md | 财务检查清单 | ❌ 无直接工具绑定 |

## 问题分析

### 🔴 严重问题

1. **Skill 与 CLI 绑定缺失**
   - ✅ `ssos-cli.md` 已绑定，但只是文档说明
   - ❌ `organize-finances.md` 未绑定任何 CLI 命令
   - ❌ 没有自动化的 Skill → CLI 调用机制

2. **MCP 覆盖度不足**
   - MCP Legacy: 仅覆盖 35% CLI 功能
   - MCP Suite: 仅覆盖 50% CLI 功能
   - 缺失模块：admin, crud, db, import-export, logs, my, users

3. **工具重复实现**
   - MCP Legacy 和 MCP Suite 有功能重叠（accounting, auth, workspace, tax, reports）
   - 两套实现可能导致行为不一致

### 🟡 中等问题

4. **CLI 命令过于细分**
   - 25个模块，206+个子命令
   - 用户难以记忆和发现功能
   - 建议：合并相关模块（如 workspace + workspace-api）

5. **CRUD 模块过于通用**
   - crud.ts 有 20+ 个通用操作
   - 未按业务域分类
   - 难以维护和扩展

6. **Skills 缺乏交互式工具**
   - `organize-finances.md` 只是指导文档
   - 应该转换为可执行的工作流（调用 CLI/MCP）

### 🟢 轻微问题

7. **命名不一致**
   - CLI: `accounting`, `ai-bookkeeping`
   - MCP: `accounting`, `ai_bookkeeping` (下划线)
   - 建议：统一命名规范

8. **文档与实现分离**
   - Skill 文档与 CLI/MCP 实现独立维护
   - 容易出现文档过期

## 对齐建议

### 阶段一：统一架构（1-2周）

1. **选定主工具体系**
   ```
   建议架构：
   - CLI: 服务端操作（DB 直连、日志、PM2 等）
   - MCP Suite: AI Agent 调用（完整 API 覆盖）
   - Skills: 工作流编排（调用 CLI/MCP）
   ```

2. **废弃 MCP Legacy**
   - 迁移所有功能到 MCP Suite
   - 删除 `ai-tools/mcp/` 目录
   - 更新文档和配置

3. **MCP Suite 补全缺失模块**
   - [ ] admin (系统管理)
   - [ ] import-export (数据导入导出)
   - [ ] logs (日志查看)
   - [ ] users (用户管理)

### 阶段二：工具绑定（1周）

4. **Skill → CLI/MCP 绑定**
   ```bash
   # organize-finances.md 应该调用：
   /organize-finances → 
     1. CLI: ssos-cli accounting trial-balance
     2. MCP: reports_get_trial_balance
     3. CLI: ssos-cli tax calendar
     4. MCP: tax_get_calendar_tasks
   ```

5. **创建 Skill 执行器**
   ```typescript
   // skills/executor.ts
   export async function executeSkill(skillName: string, args: any) {
     const workflow = SKILL_WORKFLOWS[skillName];
     for (const step of workflow.steps) {
       if (step.tool === 'cli') {
         await executeCLI(step.command);
       } else if (step.tool === 'mcp') {
         await callMCP(step.toolName, step.args);
       }
     }
   }
   ```

### 阶段三：用户操作覆盖（1-2周）

6. **完整操作流程映射**
   ```
   用户操作 → Skill → CLI/MCP 调用
   
   示例：月末结账
   1. 用户：/close-month 2026-06
   2. Skill: organize-finances.md
   3. 执行流程：
      - tax calendar --status pending
      - accounting trial-balance
      - accounting income-statement
      - period close --period <id>
   ```

7. **交互式表单支持**
   - MCP Suite 添加 resources（表单定义）
   - Skills 调用 MCP resources 获取表单
   - 收集用户输入后调用 MCP tools 执行

8. **多端同步支持**
   - CLI: 服务端批量操作
   - MCP: Web/Desktop/Mobile 调用
   - Skills: 跨端工作流编排

### 阶段四：自动化测试（持续）

9. **集成测试**
   ```bash
   # 测试 CLI
   ./test-cli.sh accounting journal-list
   
   # 测试 MCP
   ./test-mcp.sh accounting_list_journal_entries
   
   # 测试 Skill
   ./test-skill.sh organize-finances
   ```

10. **端到端测试**
    ```bash
    # 完整工作流测试
    ./e2e-test.sh close-month 2026-06
    ```

## 实施优先级

### P0 (本周完成)
- [ ] 废弃 MCP Legacy，迁移到 MCP Suite
- [ ] 补全 MCP Suite 缺失模块（admin, import-export, logs, users）
- [ ] 创建 Skill → CLI/MCP 绑定配置文件

### P1 (2周内完成)
- [ ] 实现 Skill 执行器（executor.ts）
- [ ] 改造 `organize-finances.md` 为可执行工作流
- [ ] 添加交互式表单支持（MCP resources）

### P2 (1个月内完成)
- [ ] CLI 模块合并和重构（25 → 15 个模块）
- [ ] 统一命名规范（kebab-case）
- [ ] 完整集成测试套件

### P3 (2个月内完成)
- [ ] 自动化文档生成（从代码注释）
- [ ] 多端同步测试
- [ ] 性能优化和缓存

## 对齐检查清单

### CLI ↔ MCP Suite 对齐
- [x] accounting
- [x] auth
- [x] banking
- [x] workspace
- [x] tax
- [x] invoice
- [x] hr
- [x] legal
- [x] expense
- [x] period
- [x] api-key
- [x] ai-bookkeeping
- [ ] admin
- [ ] crud
- [ ] db (服务端专属，无需 MCP)
- [ ] import-export
- [ ] logs
- [ ] my
- [ ] users
- [ ] files

### Skill ↔ CLI 绑定
- [x] ssos-cli.md → CLI 文档映射
- [ ] organize-finances.md → CLI/MCP 调用绑定
- [ ] organize-finances-checklist.md → CLI/MCP 调用绑定

### MCP Suite ↔ 用户操作覆盖
- [ ] 所有表单填写（通过 MCP resources）
- [ ] 所有列表查询（通过 MCP tools）
- [ ] 所有 CRUD 操作（通过 MCP tools）
- [ ] 所有报表生成（通过 MCP tools）
- [ ] 所有 AI 功能（通过 MCP tools）

## 技术债务

1. **MCP Legacy 废弃**
   - 工作量：4小时
   - 风险：低（已有 MCP Suite 替代）

2. **CRUD 模块重构**
   - 工作量：16小时
   - 风险：中（影响所有模块）

3. **Skill 执行器实现**
   - 工作量：24小时
   - 风险：中（新功能，需测试）

4. **交互式表单实现**
   - 工作量：40小时
   - 风险：高（涉及前端交互）

## 结论

**当前状态**:
- CLI: ✅ 功能完整（206+ 命令）
- MCP Legacy: ⚠️ 覆盖 35%，建议废弃
- MCP Suite: ⚠️ 覆盖 50%，需补全
- Skills: ❌ 未绑定工具，只是文档

**目标状态**:
- CLI: 服务端操作工具（精简到 15 个模块）
- MCP Suite: 完整 API 覆盖（100%）
- Skills: 可执行工作流（绑定 CLI/MCP）

**关键指标**:
- MCP Suite 覆盖度: 50% → 100% (目标 4周)
- Skill 工具绑定: 33% → 100% (目标 2周)
- 端到端测试覆盖: 0% → 80% (目标 8周)

**立即行动项**:
1. 本周废弃 MCP Legacy
2. 2周内补全 MCP Suite 缺失模块
3. 2周内实现 Skill 执行器
4. 4周内完成第一个可执行 Skill 工作流（月末结账）
