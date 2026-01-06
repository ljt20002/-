# OpenSpec 完整规范与最佳实践

## 目录结构

```
openspec/
├── project.md              # 项目公约
├── specs/                  # 现状 (Current Truth) - 已实现的能力
│   └── [capability]/
│       ├── spec.md         # 需求与场景 (Requirements & Scenarios)
│       └── design.md       # 技术模式
├── changes/                # 提案 (Proposals) - 计划中的变更
│   ├── [change-name]/
│   │   ├── proposal.md     # 背景与影响
│   │   ├── tasks.md        # 实施清单
│   │   ├── design.md       # 技术决策 (可选)
│   │   └── specs/          # Delta 变更
│   │       └── [capability]/
│   │           └── spec.md
│   └── archive/            # 已完成的变更
```

## Spec 文件格式要求

### 场景格式 (严格执行)

**正确格式** (必须使用 4 级标题):
```markdown
#### Scenario: 用户登录成功
- **WHEN** 输入正确的凭证
- **THEN** 返回 JWT 令牌
```

**错误格式**:
- ❌ 使用列表项或加粗作为场景标题
- ❌ 使用 3 级或 5 级标题

### 需求表述
- 使用 **SHALL** 或 **MUST** 表达规范性要求。
- 每个 Requirement 必须至少包含一个 Scenario。

## Delta 操作符

- `## ADDED Requirements`：新增能力。
- `## MODIFIED Requirements`：修改现有行为（需提供完整 Requirement 内容）。
- `## REMOVED Requirements`：移除功能。
- `## RENAMED Requirements`：仅修改名称。

## 最佳实践

1.  **原子化变更**：一个提案只解决一个核心问题。
2.  **先调研后提案**：避免在不了解现有逻辑的情况下盲目设计。
3.  **自动化校验**：频繁使用 `openspec validate` 发现潜在的格式问题。
