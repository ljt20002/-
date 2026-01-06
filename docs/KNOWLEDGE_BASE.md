# 项目知识库 (Project Knowledge Base)

本文档旨在梳理“私有对话机器人”项目的技术现状、核心逻辑及实现脉络，为开发者和 AI 助手提供全局视角。

## 1. 项目愿景与定位
*   **定位**：高性能、轻量级、隐私优先的私有 AI 对话机器人前端。
*   **核心目标**：提供丝滑的流式对话体验、强大的 Agentic 搜索能力、以及灵活的多模型对比工具，同时确保用户 API Key 等敏感数据仅存储在本地。

## 2. 技术栈概览
*   **核心框架**：React 18 (Vite 驱动)
*   **开发语言**：TypeScript (严格类型校验)
*   **UI 体系**：Ant Design 5.x + Tailwind CSS + Lucide React
*   **状态管理**：Zustand (配合 `persist` 中间件与 IndexedDB)
*   **大模型能力层**：LangChain (@langchain/openai, @langchain/core)
*   **数据存储**：IndexedDB (通过 `idb-storage.ts` 存储聊天会话，避免容量限制)

## 3. 核心数据结构 (Core Types)
了解这些类型定义有助于快速掌握数据流转逻辑（详见 `src/types/index.ts`）：

```typescript
// 消息状态：控制 UI 渲染和逻辑判断的关键
export enum MessageStatus {
  PENDING = 'pending',    // 等待中
  SENT = 'sent',          // 发送成功（终态）
  RECEIVING = 'receiving',// 接收流式数据中
  ERROR = 'error',        // 发生错误
}

// 核心消息对象
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | ContentPart[]; // 支持纯文本或多模态内容
  status: MessageStatus;
  usage?: TokenUsage;     // Token 消耗统计
  latency?: number;       // 响应耗时
  model?: string;         // 生成该消息的模型
}

// 会话对象
export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  model: string;          // 会话绑定的默认模型
  contextSummary?: string;// 关键：当前会话的持久化上下文摘要（AI 记忆）
  lastSummarizedMessageIndex?: number; // 记录已总结的消息位置
}
```

## 4. 核心业务流程 (Core Flow)

### 4.1 对话请求链路
1.  **用户输入**：`ChatInput` 触发 `onSend`。
2.  **状态更新**：`Home.tsx` 调用 `addMessage` 将用户消息和空的助手消息存入 `useChatStore`。
3.  **Agent 初始化**：调用 `createChatAgent` (`src/lib/langchain/agent.ts`) 创建带有搜索工具的执行器。
4.  **上下文装配**：调用 `assembleContextMessages` (`src/lib/context.ts`)。根据配置（None/Sliding/Auto）合并历史消息、摘要和当前输入。
5.  **流式响应**：使用 `executor.streamEvents` 获取流式事件。
    *   `on_tool_start`：UI 显示搜索状态。
    *   `on_chat_model_stream`：增量调用 `appendContentToMessage` 更新消息内容。
    *   `on_chat_model_end`：记录 Token 消耗。
6.  **收尾处理**：更新消息为 `SENT` 状态，并异步触发 `updateSessionSummary` 判断是否需要更新摘要。

### 4.2 智能上下文压缩 (Auto 策略)
为了在长对话中保持记忆且节省 Token：
*   **触发条件**：当未总结的消息数量达到 `summaryUpdateInterval` 时触发。
*   **实现方式**：调用 `generateSummary` 结合旧摘要和新消息生成新摘要。
*   **装配方式**：在发送请求时，摘要作为特殊的 `AIMessage` 插入在最近 $N$ 条消息之前。

## 5. 存储层细节 (Storage Layer)
项目使用 IndexedDB 进行大容量持久化，通过 `src/lib/idb-storage.ts` 适配 Zustand 的 `persist` 中间件。

### 5.1 数据库结构
*   **库名**: `ai-chat-db`
*   **表名 (Object Store)**: `sessions-store`
*   **存储模式**: 键值对存储。Key 为 Zustand Store 的名称（如 `chat-sessions`），Value 为序列化后的状态 JSON 字符串。

### 5.2 版本迁移逻辑
迁移逻辑定义在各 Store 的 `persist` 配置中（如 `useChatStore.ts`）：
*   **状态清理 (`partialize`)**: 持久化前会调用 `cleanupSessionMessages`。所有处于 `PENDING` 或 `RECEIVING` 状态的消息会被强制转为 `ERROR` 状态，防止用户刷新页面后消息卡死在加载态。
*   **跨存储迁移**: 在 `onRehydrateStorage` 中，系统会自动检查并尝试从 `localStorage` 迁移旧版数据到 `IndexedDB`。
*   **Schema 迭代**: 通过 Zustand 的 `version` 和 `migrate` 函数处理。例如，版本 0 升级到 1 时，为所有旧会话初始化了 `lastSummarizedMessageIndex` 字段。

## 6. 目录结构
```text
/
├── openspec/           # 规范驱动开发文档 (Proposals, Specs)
├── src/
│   ├── components/     # UI 业务组件 (MessageItem 采用 React.memo 优化)
│   ├── lib/            # 核心逻辑层
│   │   ├── langchain/  # Agent 逻辑与搜索工具封装
│   │   ├── stream.ts   # 原生 SSE 流式处理 (备用)
│   │   ├── context.ts  # 上下文压缩与摘要核心算法
│   │   └── idb-storage.ts # IndexedDB 存储适配器
│   ├── store/          # Zustand 全局状态 (useChatStore, useConfigStore)
│   └── types/          # 全局类型定义
```

## 7. 开发建议与陷阱 (Pitfalls & Tips)
*   **API Key 安全**：目前 `src/lib/search.ts` 中存在硬编码的 Serper Key，**禁止**将其提交到公共仓库。未来应统一从 `AppConfig` 读取。
*   **流式性能**：`MessageItem` 的重绘非常频繁。修改该组件时，必须确保其 `memo` 逻辑不失效，否则在长对话流式输出时会导致浏览器卡死。
*   **状态同步**：Zustand 存储是异步持久化到 IndexedDB 的，但在内存中是同步更新的。在处理并发请求（如模型对比）时，需注意 `currentSessionId` 的一致性。
*   **多模态支持**：虽然底层类型支持 `image_url`，但并非所有模型都支持 Vision 能力。在调用前需检查 `supportVision` 标记。
