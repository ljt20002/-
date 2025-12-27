import React, { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useConfigStore } from '../store/useConfigStore';
import { MessageItem } from '../components/MessageItem';
import { ChatInput } from '../components/ChatInput';
import { BillingBar } from '../components/BillingBar';
import { Empty } from '../components/Empty';
import { SettingsDrawer } from '../components/SettingsDrawer';
import { streamChatCompletion } from '../lib/stream';
import { Settings as SettingsIcon } from 'lucide-react';

export default function Home() {
  const { 
    messages, 
    addMessage, 
    updateMessageContent, 
    updateMessageStatus, 
    appendContentToMessage,
    setMessageUsage,
    isLoading, 
    setLoading,
    clearMessages
  } = useChatStore();
  
  const { config } = useConfigStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (content: string) => {
    if (!content.trim() || isLoading) return;

    if (!config.apiKey) {
      alert('请先在设置中配置 API Key');
      setIsSettingsOpen(true);
      return;
    }

    // Add user message
    addMessage('user', content);

    // Add initial bot message
    const botMessageId = addMessage('assistant', '');
    setLoading(true);

    try {
      await streamChatCompletion({
        config,
        messages: [...messages, { role: 'user', content } as any], // Include the new message
        onChunk: (chunk) => {
          appendContentToMessage(botMessageId, chunk);
        },
        onUsage: (usage) => {
          setMessageUsage(botMessageId, usage);
        },
        onFinish: () => {
          updateMessageStatus(botMessageId, 'sent');
          setLoading(false);
        },
        onError: (error) => {
          updateMessageStatus(botMessageId, 'error', error.message);
          setLoading(false);
        },
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      updateMessageStatus(botMessageId, 'error', '发送请求失败');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50">
       {/* Header with Settings Button */}
       <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <h1 className="font-semibold text-gray-800">AI Chat</h1>
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-full" 
          title="设置"
        >
          <SettingsIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Top Billing Bar */}
      <BillingBar />

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
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
      />

      {/* Settings Drawer */}
      <SettingsDrawer 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
}
