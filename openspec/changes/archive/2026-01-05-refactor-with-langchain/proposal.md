# Change: Refactor with LangChain

## Why
目前项目中的搜索意图分析、流式处理和多轮迭代逻辑都是手动编排的，代码冗余且难以扩展。引入 LangChain (JS/TS) 可以通过 Agent 抽象和统一的流式事件处理，提高代码的可维护性和功能扩展性。

## What Changes
- **Agent 化**：将手写的 `while` 循环逻辑替换为 LangChain 的 `AgentExecutor`。
- **工具化**：将 `searchWeb` 封装为 LangChain `Tool`。
- **流式事件处理**：改用 `executor.streamEvents` 处理中间过程和最终回答。
- **配置集成**：将现有配置（API Key, Model）对接到 LangChain 模型实例。

## Impact
- **Affected specs**: `streaming-chat`, `agentic-search`
- **Affected code**: `src/lib/stream.ts`, `src/lib/search.ts`, `src/pages/Home.tsx`
