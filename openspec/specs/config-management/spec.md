# Capability: Config Management

## Purpose
统一管理应用程序的各项配置参数，包括 API 凭据、默认模型、功能开关等，并确保这些配置在页面刷新后依然有效。
## Requirements
### Requirement: Persistent Settings
系统 SHALL 持久化存储用户配置，确保跨会话可用。配置项应包括 API Key、基础 URL、默认模型、联网搜索开关、优化模型 ID 以及最大上下文消息数。

#### Scenario: Update API Key
- **WHEN** 用户在设置面板修改 API Key 并保存
- **THEN** 系统立即更新全局状态并将其存储到 LocalStorage

#### Scenario: Update Max Context Messages
- **WHEN** 用户在设置面板修改“最大上下文消息数”并保存
- **THEN** 系统立即更新全局状态并将其存储到存储层中

### Requirement: Feature Toggles
系统 SHALL 提供全局功能开关，如联网搜索的启用/禁用。

#### Scenario: Toggle search
- **WHEN** 用户点击输入框侧边的联网搜索图标
- **THEN** 系统更新 `searchEnabled` 配置，并影响后续的对话请求逻辑

### Requirement: Optimizer Configuration
系统 SHALL 允许用户指定用于“提示词优化”的专用模型。

#### Scenario: Select optimizer model
- **WHEN** 用户在设置中更改“优化模型”
- **THEN** 后续点击“优化提示词”按钮时将调用新指定的模型

