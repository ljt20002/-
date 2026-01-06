## 1. 类型与状态扩展
- [x] 1.1 在 `src/types/index.ts` 中更新 `AppConfig`：
    - 添加 `contextStrategy: 'none' | 'sliding' | 'auto'`。
    - 添加 `maxRecentMessages: number` (默认 10)。
    - 添加 `summaryUpdateInterval: number` (默认 10)。
- [x] 1.2 更新 `ChatSession` 类型：
    - 添加 `contextSummary?: string` 字段。
    - 添加 `lastSummarizedMessageIndex: number` (记录已总结到的消息索引)。
- [x] 1.3 在 `src/store/useConfigStore.ts` 中完成配置初始化。

## 2. 核心压缩引擎 (`src/lib/context.ts`)
- [x] 2.1 实现 `assembleContextMessages` 函数：
    - 输入：当前所有消息、会话摘要、配置策略。
    - 输出：拼装后的 `BaseMessage[]`。
    - 逻辑：拼接 `System + Initial(1st) + Summary + Recent(N)`。
- [x] 2.2 实现 `generateSummary` 核心逻辑：
    - 调用 LLM 对 `oldSummary` 和 `newMessages` 进行合并总结。
    - 使用专用的简短 Prompt 确保摘要精炼。

## 3. 持久化与增量更新逻辑 (`src/store/useChatStore.ts`)
- [x] 3.1 在 store 中新增 `updateSessionSummary` action：
    - 逻辑：计算当前消息数与 `lastSummarizedMessageIndex` 的差值。
    - 若差值 > `summaryUpdateInterval`，调用 `generateSummary`。
    - 更新 `contextSummary` 并同步 `lastSummarizedMessageIndex`。
- [x] 3.2 确保 Zustand 的 persist 插件能正确保存这些新字段。

## 4. UI 集成与异步触发
- [x] 4.1 在 `src/pages/Home.tsx` 的 `handleSend` 流程中：
    - 请求发起前：调用 `assembleContextMessages` 构建 Payload。
    - 请求完成后：异步触发 `updateSessionSummary`，不阻塞用户感知。
- [x] 4.2 更新 `SettingsForm.tsx`，添加上下文策略及参数配置 UI。

## 5. 验证与优化
- [x] 5.1 验证持久化：刷新页面后，确认 `contextSummary` 能正确从 IndexedDB 加载。
- [x] 5.2 验证增量性：通过日志确认总结逻辑仅在达到间隔阈值时触发。
- [x] 5.3 验证有效性：检查长对话中，早期关键信息是否在 `Summary` 中得以保留。
