# Stage 1: 创建变更提案 (Proposal)

当需要新增功能、进行破坏性变更、调整架构或优化性能（涉及行为变更）时，必须先创建提案。

## 核心原则 (Guardrails)

- **严格审批门控 (CRITICAL)**：在用户明确表示“同意”、“批准”或“开始实施”提案之前，**严禁修改**项目任何生产代码、配置文件或 `.coco/skills/` 下的目标文件。
- **禁止提前编码**：提案阶段的任务仅限于创建设计文档（proposal.md, tasks.md, design.md 和 spec deltas）。违反此规则将被视为严重违反开发流程。
- **简洁优先**：优先采用直接、简单的实现，仅在必要时增加复杂性。
- **范围可控**：确保变更范围紧扣需求。
- **澄清模糊**：在开始前识别并澄清所有模糊细节。

## 步骤 (Steps)

1.  **背景调研**：查看 `openspec/project.md`，运行 `openspec list` 和 `openspec list --specs`，并检索相关代码或文档，确保对当前行为有深刻理解。
2.  **初始化提案**：选择一个唯一的、动词开头的 `change-id`（如 `add-search-feature`），在 `openspec/changes/<id>/` 下创建 `proposal.md` 和 `tasks.md`。
3.  **拆分能力**：将变更映射到具体的“能力”（Capabilities），若涉及多个范围，应拆分为不同的 spec deltas。
4.  **架构设计 (可选)**：若方案跨系统、引入新模式或需要权衡，在 `design.md` 中记录架构思考。
5.  **编写 Spec Deltas**：在 `changes/<id>/specs/<capability>/spec.md` 中编写需求，使用 `## ADDED|MODIFIED|REMOVED Requirements` 格式，并确保每个需求至少有一个 `#### Scenario:`。
6.  **制定任务列表**：在 `tasks.md` 中列出细粒度、可验证的实现步骤，包括验证手段。
7.  **严格校验**：运行 `openspec validate <id> --strict` 并解决所有问题。

## 参考命令

- `openspec list` / `openspec list --specs`：查看当前状态。
- `openspec show <id> --json --deltas-only`：检查 delta 详情。
- `rg -n "Requirement:|Scenario:" openspec/specs`：搜索现有需求。
