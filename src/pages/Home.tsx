import { useEffect, useRef, useState, useMemo } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useConfigStore } from '../store/useConfigStore';
import { MessageItem } from '../components/MessageItem';
import { ChatInput } from '../components/ChatInput';
import { BillingBar } from '../components/BillingBar';
import { Empty } from '../components/Empty';
import { SettingsDrawer } from '../components/SettingsDrawer';
import { streamChatCompletion } from '../lib/stream';
import { AVAILABLE_MODELS } from '../lib/constants';
import { Settings as SettingsIcon } from 'lucide-react';
import { MessageStatus, ContentPart } from '../types';

export default function Home() {
  const { 
    messages, 
    addMessage, 
    updateMessageStatus, 
    appendContentToMessage,
    setMessageUsage,
    isLoading, 
    setLoading,
    clearMessages
  } = useChatStore();
  
  const { config } = useConfigStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const shouldAutoScroll = useRef(true);

  const currentModel = useMemo(() => 
    AVAILABLE_MODELS.find(m => m.id === config.model),
    [config.model]
  );

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (shouldAutoScroll.current) {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // 只有当距离底部小于 50px 时才认为是“在底部”
    // 注意：这里需要容错，因为 scrollIntoView 并不总是能精确对齐
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

    // 发送消息时强制滚动到底部
    shouldAutoScroll.current = true;
    // 立即滚动，确保用户看到自己的消息
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

    // Add user message
    addMessage('user', finalContent);

    // Add initial bot message
    const botMessageId = addMessage('assistant', '');
    setLoading(true);

    try {
      await streamChatCompletion({
        config,
        messages: [...messages, { role: 'user', content: finalContent }], // Include the new message
        onChunk: (chunk) => {
          appendContentToMessage(botMessageId, chunk);
        },
        onUsage: (usage) => {
          setMessageUsage(botMessageId, usage);
        },
        onFinish: () => {
          updateMessageStatus(botMessageId, MessageStatus.SENT);
          setLoading(false);
        },
        onError: (error) => {
          updateMessageStatus(botMessageId, MessageStatus.ERROR, error.message);
          setLoading(false);
        },
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      updateMessageStatus(botMessageId, MessageStatus.ERROR, '发送请求失败');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50">
       {/* Header with Settings Button */}
       <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <h1 className="font-semibold text-gray-800">AI Chat</h1>
        
        {/* Top Billing Bar moved to Header */}
        <BillingBar />

        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-full" 
          title="设置"
        >
          <SettingsIcon className="w-5 h-5" />
        </button>
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
        onClear={clearMessages}
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
