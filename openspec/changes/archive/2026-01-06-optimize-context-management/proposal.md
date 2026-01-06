# Change: 引入智能上下文优化机制 (Smart Context Compression)

## Why
目前系统仅通过全量历史消息发送，这在长对话中会导致两个问题：
1.  **超出 Token 限制**：导致请求失败。
2.  **核心语义丢失**：简单截断（Sliding Window）虽然能解决报错，但会丢失早期的关键上下文（如任务背景、特定的偏好设置等）。
3.  **计算成本与延迟**：如果不持久化摘要，每次请求重新生成摘要会带来高昂的 Token 消耗和响应延迟。

## What Changes
本提案引入一种**分层压缩与持久化存储机制**：

1.  **分层压缩策略**：
    *   **核心指令层 (System Prompt)**：始终保留。
    *   **锚定层 (Anchor)**：始终保留会话的第一轮用户消息和 AI 回复。
    *   **摘要层 (Persistent Summary)**：将中间部分消息压缩为一段摘要。
    *   **活跃层 (Recent Window)**：保留最近 $N$ 条（默认 10 条）原始对话，确保即时交互的连贯性。

2.  **增量更新与持久化 (Incremental & Persistent)**：
    *   **状态存储**：在 `ChatSession` 中新增 `contextSummary` 字段，持久化于 IndexedDB。
    *   **增量总结**：仅当活跃层之前的“未总结消息”超过设定阈值（如每新增 10 条）时，才触发一次摘要更新。
    *   **合并逻辑**：新摘要 = `Summarize(旧摘要 + 新待总结消息)`，确保摘要随对话演进而更新。

3.  **异步生成逻辑**：
    *   摘要生成在对话完成后异步进行，不阻塞用户的下一次输入。
    *   发送请求时直接拼接“旧摘要”，若异步更新完成，则下次请求使用“新摘要”。

4.  **配置项升级**：
    *   新增 `contextStrategy`：`auto` (智能摘要), `sliding` (滑动窗口), `none` (全量)。
    *   新增 `summaryUpdateInterval`：触发增量更新的消息间隔数。

## Impact
- **Affected specs**: `session-management`, `config-management`, `streaming-chat`
- **Affected code**: 
    - `src/types/index.ts`: 扩展类型定义。
    - `src/store/useChatStore.ts`: 处理摘要的持久化与更新 action。
    - `src/lib/context.ts`: 核心优化与摘要合并逻辑。
    - `src/pages/Home.tsx`: 集成异步更新触发点。
