## ADDED Requirements

### Requirement: Context Optimization Mechanism
系统 SHALL 引入智能上下文优化机制，以在满足模型 Token 限制的同时，最大化保留长对话的关键信息。

#### Scenario: Intelligent Summarization with Persistence
- **WHEN** 对话历史超过更新阈值且策略设为 `auto`
- **THEN** 系统异步生成/更新历史摘要，并将其持久化存储在会话状态中

#### Scenario: Hybrid Payload Construction
- **WHEN** 发起新的对话请求
- **THEN** 系统按（系统提示词 + 初始锚点消息 + 已持久化的摘要 + 最近 N 条原始消息）的结构构建请求上下文，确保 Token 占用可控且语义完整

#### Scenario: Sliding Window Fallback
- **WHEN** 策略设为 `sliding` 或摘要生成失败
- **THEN** 系统回退到滑动窗口模式，始终保留系统提示词和最近的 `maxRecentMessages` 条消息
