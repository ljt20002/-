# Capability: Agentic Search

## Purpose
提供具备高度决策能力的联网搜索功能，能够根据用户输入的意图自动分析并实时从互联网获取最新信息，以增强 AI 的知识边界。
## Requirements
### Requirement: Intent Analysis
系统 MUST 通过 LangChain Agent 的思考过程决定是否需要联网。不再使用硬编码的 `analyzeSearchIntent` 独立步骤，而是交由 LLM 根据 Tool 描述自主选择。

#### Scenario: Agent chooses search tool
- **WHEN** 用户问题涉及实时信息
- **THEN** Agent 决定调用 `web_search` 工具

### Requirement: Multi-round Iteration
系统 MUST 支持多轮搜索。在 LangChain 中，这由 `AgentExecutor` 的迭代机制自动处理，直到 Agent 认为信息充足并生成最终回答。

#### Scenario: Agent iterates on search
- **WHEN** 搜索工具返回的结果不足以回答
- **THEN** Agent 再次调用搜索工具或调整搜索策略

### Requirement: Feedback Display
系统 MUST 在界面上展示搜索的中间状态。

#### Scenario: Status logging
- **WHEN** 执行意图分析或搜索时
- **THEN** 在回复消息的开头展示 “🔍 正在分析/搜索...” 的引用块

