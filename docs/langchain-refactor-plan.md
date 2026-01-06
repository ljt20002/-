# LangChain 优化重构方案

本方案旨在通过引入 LangChain (JS/TS) 框架，优化当前项目中手动编排的 AI 聊天与联网搜索流程。

## 1. 当前流程痛点分析
*   **手动编排复杂**：在 `Home.tsx` 中通过复杂的 `while` 循环和 `if-else` 手动管理搜索意图、执行搜索及评估结果。
*   **提示词分散**：意图分析、结果评估等 Prompt 硬编码在 `search.ts` 中，难以统一管理和版本控制。
*   **流式解析繁琐**：手动处理 SSE 流和 buffer，代码冗余且容易出错。
*   **扩展性差**：增加新工具（如绘图、计算器）需要修改核心业务逻辑。

## 2. LangChain 重构架构设计

### 2.1 核心组件抽象
*   **Tools (工具层)**：将 `searchWeb` 封装为 LangChain 的 `Tool` 对象。
*   **Agent (智能体层)**：使用 `createToolCallingAgent` 替代现有的手动决策逻辑。
*   **Memory (记忆层)**：利用 `BufferMemory` 或直接映射 Zustand 状态，自动处理上下文。
*   **Chain (链条层)**：使用 LCEL (LangChain Expression Language) 定义处理流程。

### 2.2 核心代码示例

#### 工具封装 (`src/lib/langchain/tools.ts`)
```typescript
import { DynamicTool } from "@langchain/core/tools";
import { searchWeb } from "../search";

export const webSearchTool = new DynamicTool({
  name: "web_search",
  description: "用于在互联网上搜索实时信息。输入应该是精准的关键词。",
  func: async (input) => await searchWeb(input),
});
```

#### Agent 初始化 (`src/lib/langchain/agent.ts`)
```typescript
import { ChatOpenAI } from "@langchain/openai";
import { createToolCallingAgent, AgentExecutor } from "langchain/agents";

export const createChatAgent = (config: AppConfig) => {
  const llm = new ChatOpenAI({
    modelName: config.model,
    configuration: { baseURL: config.baseUrl, apiKey: config.apiKey },
    streaming: true,
  });

  const tools = [webSearchTool];
  // 定义 Prompt 模板
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", config.systemPrompt],
    ["placeholder", "{chat_history}"],
    ["human", "{input}"],
    ["placeholder", "{agent_scratchpad}"],
  ]);

  const agent = createToolCallingAgent({ llm, tools, prompt });
  return new AgentExecutor({ agent, tools });
};
```

#### 流式调用 (`src/pages/Home.tsx` 逻辑简化)
```typescript
const executor = createChatAgent(config);
const stream = await executor.streamEvents(
  { input: content, chat_history: history },
  { version: "v2" }
);

for await (const event of stream) {
  if (event.event === "on_tool_start") {
    // UI: 显示正在搜索状态
  } else if (event.event === "on_chat_model_stream") {
    // UI: 追加流式文本
  }
}
```

## 3. 实施收益
1.  **代码精简**：移除 `Home.tsx` 中约 100 行的手动搜索迭代逻辑。
2.  **自动决策**：LLM 自动决定何时搜索、搜索几次、何时回答，无需硬编码迭代次数。
3.  **标准化反馈**：通过 `streamEvents` 可以轻松捕获“思考中”、“调用工具”、“工具返回”、“最终回答”等所有中间状态。
4.  **易于维护**：新增功能只需添加一个新 Tool 并在 Agent 初始化时传入即可。

## 4. 后续规划
*   [ ] 迁移 `search.ts` 中的 Prompt 到 LangChain 模板。
*   [ ] 实现 Zustand 状态与 LangChain Message 格式的互转适配器。
*   [ ] 接入 `LangSmith` 进行链路追踪和性能监控。
