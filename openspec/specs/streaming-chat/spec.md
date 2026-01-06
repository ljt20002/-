# Capability: Streaming Chat

## Purpose
支持与 AI 模型的流式对话交互。该功能是系统的核心交互模式，负责建立与模型供应商的高效连接，管理实时响应的增量渲染，并提供详细的 Token 消耗统计、性能延迟监控以及可靠的异常中断处理机制，以确保用户获得流畅且可控的对话体验。

## Requirements
### Requirement: Stream API Connection
系统 MUST 建立与模型提供商的流式连接。重构后，该连接由 LangChain 的模型类（如 `ChatOpenAI`）及其配套的 `streamEvents` 机制统一管理。

#### Scenario: Successful agent stream start
- **WHEN** Agent 执行开始
- **THEN** 系统建立支持事件流的连接，并能区分工具调用事件和最终回复事件

### Requirement: Content Rendering
系统 MUST 在接收到数据块（chunks）时实时更新用户界面。

#### Scenario: Incremental update
- **WHEN** 接收到 `content` 增量数据
- **THEN** 将数据追加到对应消息的文本中并自动滚动到底部

### Requirement: Usage Tracking
系统 MUST 捕获并显示 Token 使用情况。

#### Scenario: Finish with usage data
- **WHEN** 流结束且包含 `usage` 字段
- **THEN** 在消息下方显示总消耗的 Token 数

### Requirement: Request Interruption
系统 MUST 支持手动中断正在进行的流式请求。

#### Scenario: User aborts request
- **WHEN** 用户点击“停止生成”按钮
- **THEN** 调用 `AbortController.abort()` 中断 API 请求，并将消息状态标记为“已中断”

### Requirement: Error Handling
系统 MUST 妥善处理流式传输过程中的网络错误或 API 异常。

#### Scenario: Network error during streaming
- **WHEN** 传输过程中连接断开
- **THEN** 捕获异常，停止加载状态，并在界面上显示具体的错误信息
