# Project Context

## Purpose
一个私有的 AI 对话机器人项目，支持流式对话、联网搜索、提示词优化以及多模型对比功能。旨在提供一个高效、可扩展且美观的 AI 交互界面。

## Tech Stack
- **Frontend**: React 18 (Vite), TypeScript
- **Styling**: Tailwind CSS, Ant Design (UI Components), Lucide React (Icons)
- **State Management**: Zustand (with Persist/IndexedDB)
- **APIs**: OpenAI-compatible Chat APIs, Google Serper API (Search)
- **Tools**: LangChain (Planned for refactoring)

## Project Conventions

### Language Policy
- **Primary Language**: 本项目的所有**提案 (Proposals)**、**规范 (Specs)**、**任务列表 (Tasks)** 以及 **CHANGELOG** 必须使用**中文**编写。
- **Code**: 代码中的变量名、类名及注释仍遵循英文惯例，但在编写需求描述和交互文档时应使用中文。

### Document Consistency (CRITICAL)
- **跨文件校验**：当同时创建或修改多个文档（如 `SKILL.md` 与 `workflow.md`，或 `proposal.md` 与 `spec.md`）时，必须执行显式的交叉核对。
- **自动化边界定义**：在任何文档中提到的“自动 (Auto)”或“手动 (Manual)”步骤，必须在所有相关文档中保持完全一致的定义。
- **单事实来源**：如果两份文档存在冲突，以 `OpenSpec` 提案中的 `proposal.md` 和 `spec.md` 为准，其他文档必须同步更新。

### Code Style
- **Components**: 优先使用函数组件和 React Hooks。
- **TypeScript**: 严格类型检查，严禁滥用 `any`。对于第三方库缺失的类型，应在 `src/types/` 下补充 `.d.ts`。
- **Naming**: 组件使用 PascalCase，文件和变量使用 camelCase，常量使用 UPPER_SNAKE_CASE。
- **Styling**: 优先使用 Tailwind CSS 进行样式开发。

### Architecture Patterns
- **State Management**: 使用 Zustand 维护全局状态（如用户信息、配置、聊天记录）。
- **Storage**: 使用 IndexedDB (via `idb-storage.ts`) 持久化聊天记录，避免容量限制。
- **API Communication**: `src/lib/stream.ts` 处理原生流式通信（待 LangChain 重构）。

### Testing Strategy
- 目前主要依赖人工验证和基础的类型检查。

### Git Workflow
- **Commit Messages**: 遵循约定式提交（Conventional Commits），如 `feat:`, `fix:`, `chore:`, `refactor:`。

## Domain Context
- **流式对话**: 核心交互模式，要求响应及时。
- **智能搜索**: 结合 Serper API 进行多轮意图分析和补充搜索。
- **模型对比**: 支持同时向多个模型发起请求并展示差异。

## Important Constraints
- **安全性**: API Key 存储在本地，不应硬编码或泄露。
- **性能**: 聊天记录持久化需考虑 IndexedDB 的性能影响。

## External Dependencies
- **OpenAI-like API**: 核心对话能力。
- **Serper API**: 联网搜索能力。
