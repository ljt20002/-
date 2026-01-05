# Changelog

## [2.1.0](https://github.com/ljt20002/-/compare/v2.0.0...v2.1.0) (2026-01-05)

### ✨ 新功能

* **模型设置:** 添加免费模型标记和价格显示 ([6c080ef](https://github.com/ljt20002/-/commit/6c080ef52d19546db562ea44aa55cb0898d11a4a))
* **搜索:** 添加联网搜索功能支持，实现基于 Serper API 的联网搜索功能 ([89df81c](https://github.com/ljt20002/-/commit/89df81c264166152106588a52bc706347f17d54c))
* **ChatInput:** 取消 Enter 键自动发送逻辑 ([5b42fdf](https://github.com/ljt20002/-/commit/5b42fdf7c15346e836ed5212b274512a506a9510))
* **compare:** 新增模型对比功能及界面优化 ([a18965b](https://github.com/ljt20002/-/commit/a18965b7b74e7c2f13711e24c7144a0457b45a6e))

### 🐛 缺陷修复

* 清除冗余 ([b502aab](https://github.com/ljt20002/-/commit/b502aaba18dda8b946a145d06adcfb7158a3c6cc))
* **SettingsForm:** 修复当config.systemPrompt为空时可能导致的错误 ([56fc62a](https://github.com/ljt20002/-/commit/56fc62a24a927f0c71b424d18a79c239cec3a29e))

## [2.0.0](https://github.com/ljt20002/-/compare/v1.1.0...v2.0.0) (2025-12-29)

### ✨ 新功能

* **聊天:** 添加消息模型显示功能并更新API基础URL ([be657df](https://github.com/ljt20002/-/commit/be657df815e755a96fc0d0314287425f21049f63))
* **chat:** 实现多会话管理及增强功能 ([83e0761](https://github.com/ljt20002/-/commit/83e0761823677281eb505a2bd050dcdea35d8307))

## [1.1.0](https://github.com/ljt20002/-/compare/v1.0.0...v1.1.0) (2025-12-29)

### ✨ 新功能

* add GitHub Actions deployment and update documentation ([511e95b](https://github.com/ljt20002/-/commit/511e95b04abe8beb6f5afbe91ddcabc33e0d841f))

### 🐛 缺陷修复

* 配置基础路径和路由模式以支持静态部署 ([c52d37d](https://github.com/ljt20002/-/commit/c52d37d7383056cd7477caf76784ebae21a038e0))

### 📝 文档更新

* update README with project background and versioning guide, and localize comments ([eecb489](https://github.com/ljt20002/-/commit/eecb48963826066d12f6690169cd6c80ff054772))

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
