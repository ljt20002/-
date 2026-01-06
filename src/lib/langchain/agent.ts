import { ChatOpenAI } from "@langchain/openai";
import { createAgent } from "langchain";
import { HumanMessage, AIMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";
import { webSearchTool } from "./tools";
import { AppConfig, ChatMessage } from "../../types";

/**
 * 将项目的 ChatMessage 转换为 LangChain 的 BaseMessage
 */
export const convertToLangChainMessages = (messages: ChatMessage[]): BaseMessage[] => {
  return messages.map((m) => {
    // 处理内容
    let content: any = m.content;
    if (Array.isArray(m.content)) {
      content = m.content.map(p => {
        if (p.type === 'text') return { type: 'text', text: p.text };
        if (p.type === 'image_url') return { type: 'image_url', image_url: p.image_url };
        return { type: 'text', text: '' };
      });
    }

    if (m.role === 'user') return new HumanMessage({ content });
    if (m.role === 'assistant') {
      // LangChain 的 AIMessage 内容通常是字符串或特定的 ToolCall 类型
      return new AIMessage({ content: typeof content === 'string' ? content : JSON.stringify(content) });
    }
    if (m.role === 'system') return new SystemMessage({ content: typeof content === 'string' ? content : JSON.stringify(content) });
    return new HumanMessage({ content: typeof content === 'string' ? content : JSON.stringify(content) });
  });
};

/**
 * 创建并配置 Agent
 */
export const createChatAgent = (config: AppConfig, systemPrompt: string) => {
  const model = new ChatOpenAI({
    modelName: config.model,
    apiKey: config.apiKey,
    configuration: {
      baseURL: config.baseUrl,
    },
    streaming: true,
    temperature: 0.7,
  });

  // 如果启用了搜索且配置了 Key，则添加搜索工具
  const tools = (config.searchEnabled && config.searchApiKey) ? [webSearchTool] : [];

  return createAgent({
    model,
    tools,
    systemPrompt,
  });
};
