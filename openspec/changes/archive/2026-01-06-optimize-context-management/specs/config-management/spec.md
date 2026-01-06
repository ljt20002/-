## MODIFIED Requirements

### Requirement: Persistent Settings
系统 SHALL 持久化存储用户配置，确保跨会话可用。配置项应包括 API Key、基础 URL、默认模型、联网搜索开关、优化模型 ID 以及最大上下文消息数。

#### Scenario: Update API Key
- **WHEN** 用户在设置面板修改 API Key 并保存
- **THEN** 系统立即更新全局状态并将其存储到 LocalStorage

#### Scenario: Update Max Context Messages
- **WHEN** 用户在设置面板修改“最大上下文消息数”并保存
- **THEN** 系统立即更新全局状态并将其存储到存储层中
