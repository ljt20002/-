import { useEffect, useRef, useState, useMemo } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useConfigStore } from '../store/useConfigStore';
import { MessageItem } from '../components/MessageItem';
import { ChatInput } from '../components/ChatInput';
import { BillingBar } from '../components/BillingBar';
import { Empty } from '../components/Empty';
import { SettingsDrawer } from '../components/SettingsDrawer';
import { createChatAgent, convertToLangChainMessages } from '../lib/langchain/agent';
import { assembleContextMessages } from '../lib/context';
import { AVAILABLE_MODELS } from '../lib/constants';
import { Settings as SettingsIcon, Menu } from 'lucide-react';
import { playNotificationSound } from '../lib/utils';
import { MessageStatus, ContentPart } from '../types';

interface HomeProps {
  onToggleSidebar: () => void;
}

export default function Home({ onToggleSidebar }: HomeProps) {
  const { config } = useConfigStore();
    const { 
    sessions,
    currentSessionId,
    addMessage, 
    updateMessageStatus, 
    appendContentToMessage,
    setMessageUsage,
    setMessageLatency,
    setLoading,
    abortResponse,
    getSignal,
    clearMessages,
    updateSessionSummary
  } = useChatStore();
  
  const currentSession = useMemo(() => 
    sessions.find(s => s.id === currentSessionId),
    [sessions, currentSessionId]
  );

  const messages = useMemo(() => currentSession?.messages || [], [currentSession]);
  const isLoading = currentSession?.isLoading || false;
  const sessionModel = currentSession?.model || config.model;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const shouldAutoScroll = useRef(true);

  const currentModel = useMemo(() => 
    AVAILABLE_MODELS.find(m => m.id === sessionModel),
    [sessionModel]
  );

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (shouldAutoScroll.current) {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    shouldAutoScroll.current = isAtBottom;
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (content: string, images: string[]) => {
    if ((!content.trim() && images.length === 0) || isLoading) return;

    if (!config.apiKey) {
      alert('请先在设置中配置 API Key');
      setIsSettingsOpen(true);
      return;
    }

    shouldAutoScroll.current = true;
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 0);

    let finalContent: string | ContentPart[] = content;

    if (images.length > 0) {
      finalContent = [
        { type: 'text', text: content },
        ...images.map(img => ({
          type: 'image_url' as const,
          image_url: { url: img }
        }))
      ];
    }

    // Capture valid history messages (exclude errors/interrupted)
    const validHistory = messages.filter(m => m.status === MessageStatus.SENT);
    const baseSystemPrompt = currentSession?.systemPrompt || config.systemPrompt || 'You are a helpful AI assistant.';
    const now = new Date();
    const today = `${now.toLocaleDateString()} ${['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][now.getDay()]}`;
    const systemPrompt = `当前日期: ${today}\n\n${baseSystemPrompt}`;

    // Add user message
    addMessage('user', finalContent);

    // Add initial bot message
    const botMessageId = addMessage('assistant', '', sessionModel);
    const sessionId = currentSessionId;
    setLoading(true, sessionId!);

    const startTime = Date.now();

    try {
      const signal = getSignal(sessionId!);
      const executor = createChatAgent({ ...config, model: sessionModel }, systemPrompt);
      const chatHistory = assembleContextMessages(validHistory, config, currentSession?.contextSummary);
      
      // 转换当前消息为 LangChain 格式
      const currentMessageLC = convertToLangChainMessages([{
        id: 'current',
        role: 'user',
        content: finalContent,
        timestamp: Date.now(),
        status: MessageStatus.SENT
      }])[0];

      const eventStream = executor.streamEvents(
        { 
          messages: [...chatHistory, currentMessageLC]
        },
        { version: "v2", signal }
      );

      for await (const event of eventStream) {
        const eventType = event.event;
        
        if (eventType === "on_tool_start") {
          appendContentToMessage(botMessageId, `> 🔍 正在执行搜索: ${event.data.input}...\n\n`);
        } else if (eventType === "on_chat_model_stream") {
          const content = event.data?.chunk?.content;
          if (content) {
            appendContentToMessage(botMessageId, content);
          }
        } else if (eventType === "on_chat_model_end") {
           // 处理消耗数据
           const usage = event.data?.output?.usage_metadata;
           if (usage) {
             setMessageUsage(botMessageId, {
               prompt_tokens: usage.input_tokens,
               completion_tokens: usage.output_tokens,
               total_tokens: usage.total_tokens
             });
           }
        }
      }

      const latency = Date.now() - startTime;
      setMessageLatency(botMessageId, latency);
      updateMessageStatus(botMessageId, MessageStatus.SENT);
      setLoading(false, sessionId!);
      playNotificationSound();

      // 异步触发摘要更新
      updateSessionSummary(sessionId!);
    } catch (error) {
      const latency = Date.now() - startTime;
      setMessageLatency(botMessageId, latency);
      
      if (error instanceof Error && error.name === 'AbortError') {
        updateMessageStatus(botMessageId, MessageStatus.SENT);
      } else {
        console.error('Failed to send message:', error);
        updateMessageStatus(botMessageId, MessageStatus.ERROR, error instanceof Error ? error.message : '发送请求失败');
      }
      setLoading(false, sessionId!);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
       {/* Header with Settings Button */}
       <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <button 
            onClick={onToggleSidebar}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-gray-800 truncate max-w-[150px] md:max-w-none">
            {currentSession?.title || 'AI Chat'}
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <BillingBar />
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full" 
            title="设置"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Message List */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-6"
      >
        {messages.length === 0 ? (
          <Empty />
        ) : (
          messages.map((msg) => (
            <MessageItem key={msg.id} message={msg} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <ChatInput 
        onSend={handleSend} 
        onClear={() => {
          if (confirm('确定要清空当前会话的所有消息吗？')) {
            clearMessages();
          }
        }}
        onAbort={() => abortResponse(currentSessionId || undefined)}
        isLoading={isLoading}
        disabled={!config.apiKey}
        supportVision={currentModel?.supportVision}
      />

      {/* Settings Drawer */}
      <SettingsDrawer 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
}
