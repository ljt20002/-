# Capability: Session Management

## Purpose
管理用户的对话上下文，支持多会话切换、历史记录持久化以及自动化的会话标题生成，确保用户能够无缝管理不同的对话主题。该功能还负责维护会话状态的完整性，确保在系统崩溃或异常关闭后能恢复到一致的状态。

## Requirements
### Requirement: Session CRUD
系统 SHALL 支持对话会话的创建、切换和删除。

#### Scenario: Create new session
- **WHEN** 用户点击“新会话”按钮
- **THEN** 系统创建一个带有唯一 ID 的新会话并将其设为当前活跃会话

#### Scenario: Delete session
- **WHEN** 用户删除指定会话
- **THEN** 系统从存储中移除该会话，若删除的是当前会话，则自动切换到邻近会话

### Requirement: Automatic Title Generation
系统 SHALL 在新会话的第一条消息发送后自动生成会话标题。

#### Scenario: Title from first message
- **WHEN** 用户在新会话中发送第一条文本消息
- **THEN** 系统截取前 20 个字符作为会话标题

### Requirement: State Integrity and Recovery
系统 SHALL 确保会话状态在持久化和加载过程中的完整性。

#### Scenario: Cleanup stale states on rehydration
- **WHEN** 从持久化存储加载会话状态
- **THEN** 系统 MUST 将所有处于 `PENDING` 或 `RECEIVING` 状态的消息重置为 `ERROR` 状态，并停止所有加载状态，防止界面卡死

#### Scenario: Legacy storage migration
- **WHEN** 系统启动且检测到 `localStorage` 中存在旧版会话数据，但 `IndexedDB` 为空
- **THEN** 系统 MUST 自动将旧数据迁移至 `IndexedDB` 存储，以保证用户历史记录不丢失

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
