## 1. Preparation
- [x] 1.1 安装依赖：`@langchain/openai`, `@langchain/core`, `langchain`
- [x] 1.2 创建 LangChain 工具目录 `src/lib/langchain/`

## 2. Core Implementation
- [x] 2.1 封装 `webSearchTool` (src/lib/langchain/tools.ts)
- [x] 2.2 实现 Agent 初始化逻辑 (src/lib/langchain/agent.ts)
- [x] 2.3 开发消息格式转换适配器 (ChatMessage -> BaseMessage)

## 3. Integration
- [x] 3.1 在 `Home.tsx` 中移除手动搜索逻辑，接入 `AgentExecutor`
- [x] 3.2 使用 `streamEvents` 恢复现有的搜索状态显示功能
- [x] 3.3 验证流式回答和 Token 统计是否正常工作

## 4. Documentation
- [x] 4.1 更新相关代码注释
- [x] 4.2 执行 `openspec archive refactor-with-langchain`
