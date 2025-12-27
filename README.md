# 私有对话机器人 (Private AI Chat)

这是一个基于 Vite + React + TypeScript 构建的高性能、现代化的私有 AI 对话机器人前端项目。它旨在为用户提供一个安全、可高度定制的界面，用于与各种大型语言模型（LLM）进行交互。

## 🌟 项目背景

随着大语言模型的普及，用户对于隐私保护和界面自定义的需求日益增长。本项目提供了一个轻量级的解决方案，让用户可以通过自己的 API Key 访问 AI 服务，而不必担心对话数据被第三方平台滥用。

## ✨ 核心功能

- **极速响应**: 基于 Vite 构建，提供毫秒级的 HMR 体验。
- **流式对话**: 支持 SSE (Server-Sent Events)，实现丝滑的流式文字输出。
- **配置持久化**: 自动保存 API Key、Base URL 及模型配置，刷新不丢失。
- **Markdown 支持**: 完美支持 Markdown 渲染，包括 GFM、数学公式及代码高亮。
- **消耗统计**: 实时显示每次对话的 Token 消耗及预估成本（基于不同模型的计费标准）。
- **现代化 UI**: 采用 Tailwind CSS 设计，支持响应式布局，适配移动端。

## 🚀 快速开始

### 安装依赖
```bash
pnpm install
```

### 本地开发
```bash
pnpm dev
```

### 构建部署
```bash
pnpm build
```

## 🛠 开发规范与版本控制

本项目采用了高度自动化的版本管理和日志记录流程。

### 提交规范 (Conventional Commits)
在提交代码时，请遵循以下前缀规范：
- `feat`: 引入新功能
- `fix`: 修复 Bug
- `docs`: 文档修改
- `refactor`: 代码重构
- `chore`: 其他不影响代码逻辑的改动（如依赖更新、配置调整）

### 版本发布流程
我们使用 `release-it` 进行交互式的版本发布管理：

1. **执行发布命令**:
   ```bash
   pnpm release
   ```
2. **选择版本**: 界面会提示您选择下一个版本号（Patch/Minor/Major），也支持自定义输入。
3. **确认发布**: `release-it` 会自动更新 `package.json` 版本号，提取提交记录到 `CHANGELOG.md`，执行 Git Commit 并打上对应的版本 Tag。

## 📂 项目结构
```text
src/
├── components/   # 核心组件 (对话列表、输入框、设置抽屉等)
├── hooks/        # 自定义 Hook (主题、业务逻辑等)
├── lib/          # 工具函数 (流式处理、工具方法、常量定义)
├── store/        # 状态管理 (Zustand 存储)
├── types/        # TypeScript 类型定义
└── pages/        # 路由页面
```

## 📄 开源协议
[MIT License](LICENSE)
