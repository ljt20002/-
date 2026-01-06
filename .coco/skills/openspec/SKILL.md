---
name: openspec
description: 用于管理项目中的 OpenSpec 变更生命周期，包括创建提案（proposal）、实施变更（apply）和归档变更（archive）。当用户提到“提案”、“变更”、“规范”、“spec”、“openspec”或“proposal”时使用。
---

# OpenSpec 管理技能

本技能集成了 OpenSpec 的核心工作流，确保项目的需求、设计和实现保持高度一致。

## 核心工作流

OpenSpec 遵循三个阶段的生命周期：

1.  **Stage 1: 创建变更提案 (Proposal)** - 涉及功能新增、重大重构或架构调整。详细指导请参考 [proposal.md](./proposal.md)。
2.  **Stage 2: 实施变更 (Apply)** - 在提案通过后进行具体代码实现。详细指导请参考 [apply.md](./apply.md)。
3.  **Stage 3: 归档变更 (Archive)** - 实施并部署完成后，同步更新规范并清理记录。详细指导请参考 [archive.md](./archive.md)。

## 通用准则

- **语言规范**：所有的变更提案、规范和任务列表必须使用**中文**编写。
- **保持简洁**：优先采用直接、简单的实现方案。
- **规范驱动**：先有规范/提案，后有代码实现。
- **任务同步**：严格按照 `tasks.md` 跟踪进度。
- **严格校验**：提交前必须运行 `openspec validate [id] --strict`。

## 参考资源

- [OpenSpec 完整规范与最佳实践](./workflow.md)
- 项目当前规范：`openspec/specs/`
- 活动中的提案：`openspec/changes/`
