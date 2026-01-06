import { BaseMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { AppConfig, ChatMessage, MessageStatus } from "../types";
import { convertToLangChainMessages } from "./langchain/agent";

/**
 * 拼装上下文消息列表
 */
export function assembleContextMessages(
  messages: ChatMessage[],
  config: AppConfig,
  summary?: string
): BaseMessage[] {
  const { contextStrategy, maxRecentMessages } = config;
  
  // 仅保留已发送成功且不是 PENDING/RECEIVING 的消息
  const validMessages = messages.filter(m => m.status === MessageStatus.SENT);

  console.log(`[Context] 拼装策略: ${contextStrategy}, 有效消息总数: ${validMessages.length}, 保留最近消息数: ${maxRecentMessages}`);

  if (contextStrategy === 'none' || validMessages.length <= maxRecentMessages) {
    const result = convertToLangChainMessages(validMessages);
    console.log(`[Context] 无需压缩, 发送全部消息 (${result.length})`);
    return result;
  }

  if (contextStrategy === 'sliding') {
    const result = convertToLangChainMessages(validMessages.slice(-maxRecentMessages));
    console.log(`[Context] 滑动窗口压缩, 发送最近 ${result.length} 条消息`);
    return result;
  }

  if (contextStrategy === 'auto') {
    const recentMessages = validMessages.slice(-maxRecentMessages);
    const firstMessage = validMessages[0];
    
    const context: BaseMessage[] = [];
    
    // 始终保留第一轮对话作为锚点
    if (firstMessage && !recentMessages.find(m => m.id === firstMessage.id)) {
      context.push(...convertToLangChainMessages([firstMessage]));
      console.log(`[Context] 锚点保留: 第 1 条消息已加入`);
    }
    
    // 插入摘要 (作为 AI 的记忆插入)
    if (summary) {
      context.push(new AIMessage({ content: `[对话历史摘要]: ${summary}` }));
      console.log(`[Context] 摘要插入: 已加入持久化摘要`);
    } else {
      console.log(`[Context] 摘要缺失: 当前会话尚无持久化摘要`);
    }
    
    // 插入最近的消息
    context.push(...convertToLangChainMessages(recentMessages));
    
    console.log(`[Context] 智能摘要拼装完成, 总消息对象数: ${context.length} (含摘要)`);
    return context;
  }

  return convertToLangChainMessages(validMessages);
}

/**
 * 生成或更新摘要
 */
export async function generateSummary(
  config: AppConfig,
  oldSummary: string | undefined,
  newMessages: ChatMessage[]
): Promise<string> {
  if (newMessages.length === 0) return oldSummary || '';

  console.log(`[Summary] 开始生成摘要, 待处理新消息数: ${newMessages.length}, 是否有旧摘要: ${!!oldSummary}`);

  const model = new ChatOpenAI({
    modelName: config.model,
    apiKey: config.apiKey,
    configuration: {
      baseURL: config.baseUrl,
    },
    temperature: 0.3, // 降低随机性，保证摘要稳定
  });

  const messageText = newMessages.map(m => {
    const content = typeof m.content === 'string' 
      ? m.content 
      : m.content.filter(p => p.type === 'text').map(p => p.text).join(' ');
    return `${m.role}: ${content}`;
  }).join('\n');

  const prompt = oldSummary 
    ? `你是一个专业的对话总结助手。以下是之前的对话摘要和新产生的对话内容。请将它们合并并更新为一个简洁的、不超过 300 字的新摘要。要求保留核心任务背景、用户偏好和关键事实。\n\n[旧摘要]: ${oldSummary}\n\n[新对话]:\n${messageText}`
    : `你是一个专业的对话总结助手。请对以下对话内容进行总结，生成一个简洁的、不超过 300 字的摘要。要求保留核心任务背景、用户偏好和关键事实。\n\n[对话内容]:\n${messageText}`;

  try {
    const response = await model.invoke([new SystemMessage({ content: prompt })]);
    const result = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
    console.log(`[Summary] 摘要生成成功, 长度: ${result.length} 字符`);
    return result;
  } catch (error) {
    console.error(`[Summary] 摘要生成失败:`, error);
    throw error;
  }
}
