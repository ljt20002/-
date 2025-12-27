# 更新日志

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-12-27

### ✨ 新功能
- **核心架构**: 基于 Vite + React + TypeScript + Tailwind CSS 构建的高性能对话界面。
- **智能对话**: 
  - 支持 SSE 流式响应，提供流畅的打字机输出效果。
  - 自动解析 Markdown 语法，支持代码高亮显示。
  - 实时显示 Token 消耗统计（Prompt/Completion/Total）。
- **状态管理**: 
  - 使用 Zustand 实现响应式数据流，支持消息列表维护、状态更新及加载控制。
  - 配置持久化功能，保存 API 密钥、模型选择及 Base URL 等设置。
- **交互组件**:
  - `ChatInput`: 支持快捷键发送、自动调节高度及发送状态控制。
  - `MessageItem`: 区分用户/助手角色，集成消息状态反馈（发送中、已发送、错误）。
  - `SettingsDrawer`: 侧边抽屉式设置界面，支持实时修改配置。
- **页面与导航**: 
  - 完整的路由体系，包含主聊天页和设置页。
  - 响应式设计，完美适配移动端与桌面端。

### 🔧 自动化与规范
- 集成 `release-it` 实现交互式版本发布。
- 配置 Conventional Commits 规范，自动生成符合标准协议的更新日志。
- 初始化 Git 仓库，建立完善的忽略规则 (`.gitignore`)。
