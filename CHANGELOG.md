# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-06-09

### 🎉 Major Release - CLI 命令重构

这是一个重大版本更新，**不保持向后兼容性**。命令数量从 158 个减少到 51 个（减少 67%），建立了清晰的三层架构。

### Added

- ✨ 新增 `invoice to-journal-entry` 命令 - 从发票生成会计凭证（语义更清晰）
- ✨ 新增 `invoice batch-to-entries` 命令 - 批量从发票生成凭证
- ✨ 新增 `crud action` 子命令 - 执行资源特定操作（post, approve, reverse 等）
- 📚 新增 `ARCHITECTURE.md` - 详细的三层架构设计文档
- 📚 新增 `CLI_COMMAND_ANALYSIS.md` - 完整的命令分析和抽象方案

### Changed

- 🔄 **重命名命令**:
  - `invoice create-entry` → `invoice to-journal-entry`
  - `invoice batch-create-entries` → `invoice batch-to-entries`

- 📦 **架构重构** - 建立三层命令架构:
  - **CRUD 层** (90%): `crud` 命令统一管理 127 种资源
  - **业务层** (8%): accounting, tax, invoice, workspace
  - **AI 层** (2%): ai-bookkeeping

- 📝 **描述更新**:
  - `users` 模块描述更新为 "Use ssos crud list/get users for data operations"
  - `workspace` 模块描述更新为 "Use ssos crud list workspaces for data operations"
  - `invoice` 模块描述更新，明确说明数据操作用 `crud` 命令

### Removed

- ❌ **删除 users 模块的 CRUD 命令** (使用 `crud` 命令替代):
  - ~~`users list`~~ → `crud list users`
  - ~~`users get`~~ → `crud get users`

- ❌ **删除 workspace 模块的 CRUD 命令** (使用 `crud` 命令替代):
  - ~~`workspace list`~~ → `crud list workspaces`

- ❌ **删除 invoice 模块的旧命令名称**:
  - ~~`invoice create-entry`~~ → `invoice to-journal-entry`
  - ~~`invoice batch-create-entries`~~ → `invoice batch-to-entries`

### Migration Guide

#### 用户数据操作

```bash
# Before v2.0
ssos users list
ssos users get <id>

# v2.0
ssos crud list users
ssos crud get users <id>
```

#### 工作区数据操作

```bash
# Before v2.0
ssos workspace list

# v2.0
ssos crud list workspaces
```

#### 发票凭证生成

```bash
# Before v2.0
ssos invoice create-entry <id>
ssos invoice batch-create-entries --ids '[...]'

# v2.0
ssos invoice to-journal-entry <id>
ssos invoice batch-to-entries --ids '[...]'
```

#### 凭证特殊操作

```bash
# Before v2.0
ssos accounting post-entry <id>
ssos accounting reverse-entry <id>

# v2.0
ssos crud action journal-entries <id> post
ssos crud action journal-entries <id> reverse
```

### Statistics

- **命令总数**: 158 → 51 (减少 67%)
- **CRUD 命令**: 统一到 `crud` 接口（7 actions × 127 resources）
- **业务命令**: 17 个（accounting: 7, tax: 6, invoice: 3, workspace: 1）
- **AI 命令**: 5 个（ai-bookkeeping）
- **系统工具**: 5 个（auth: 3, setup: 1, doctor: 1）

---

## [1.0.0] - 2026-06-08

### Added

- 🎉 首次发布
- ✨ 155+ CLI 命令，覆盖会计、税务、发票、人事、法务
- 🤖 集成 MCP 服务器和 Claude Skills
- 📦 支持 127 种资源类型的 CRUD 操作
- 🔐 三种认证方式：邮箱密码、API Key、JWT Token

---

[2.0.0]: https://github.com/Xaiver03/startupos-ai-tools/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/Xaiver03/startupos-ai-tools/releases/tag/v1.0.0
