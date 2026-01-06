## MODIFIED Requirements

### Requirement: Stream API Connection
系统 MUST 建立与模型提供商的流式连接。重构后，该连接由 LangChain 的模型类（如 `ChatOpenAI`）及其配套的 `streamEvents` 机制统一管理。

#### Scenario: Successful agent stream start
- **WHEN** Agent 执行开始
- **THEN** 系统建立支持事件流的连接，并能区分工具调用事件和最终回复事件
