import { useEffect, useRef, useState, useMemo } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useConfigStore } from '../store/useConfigStore';
import { MessageItem } from '../components/MessageItem';
import { ChatInput } from '../components/ChatInput';
import { BillingBar } from '../components/BillingBar';
import { Empty } from '../components/Empty';
import { SettingsDrawer } from '../components/SettingsDrawer';
import { streamChatCompletion } from '../lib/stream';
import { searchWeb, analyzeSearchIntent, evaluateSearchSufficiency } from '../lib/search';
import { AVAILABLE_MODELS } from '../lib/constants';
import { Settings as SettingsIcon, Menu } from 'lucide-react';
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
    setLoading,
    abortResponse,
    getSignal,
    clearMessages
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

    try {
      const signal = getSignal(sessionId!);

      // Perform web search if enabled
      let searchResults = '';
      if (config.searchEnabled && config.searchApiKey && content.trim()) {
        try {
          appendContentToMessage(botMessageId, '> 🤖 正在分析搜索意图...\n\n');
          const initialQueries = await analyzeSearchIntent(content, config);
          
          if (initialQueries && initialQueries.length > 0) {
            let iteration = 0;
            const maxIterations = 2; // 最多进行2轮搜索迭代
            let currentQueries = initialQueries;
            
            while (iteration < maxIterations) {
              iteration++;
              const roundInfo = maxIterations > 1 ? ` (第 ${iteration} 轮)` : '';
              appendContentToMessage(botMessageId, `> 🔍 正在执行搜索${roundInfo}: ${currentQueries.join(', ')}...\n\n`);
              
              // 并行执行当前轮次的所有搜索词
              const roundResults = await Promise.all(
                currentQueries.map(q => searchWeb(q))
              );
              const roundResultsText = roundResults.join('\n\n');
              searchResults += (searchResults ? '\n\n' : '') + roundResultsText;

              if (iteration < maxIterations) {
                appendContentToMessage(botMessageId, `> 🧠 正在评估搜索结果是否充足...\n\n`);
                const evaluation = await evaluateSearchSufficiency(content, searchResults, config);
                
                if (evaluation.sufficient) {
                  appendContentToMessage(botMessageId, `> ✅ 信息已充足，开始生成回答...\n\n`);
                  break;
                } else if (evaluation.nextQuery) {
                  appendContentToMessage(botMessageId, `> 💡 发现信息缺口，追加搜索: ${evaluation.nextQuery}...\n\n`);
                  currentQueries = [evaluation.nextQuery];
                } else {
                  break;
                }
              } else {
                appendContentToMessage(botMessageId, `> ✅ 搜索轮次已达上限，开始总结...\n\n`);
              }
            }
          } else {
            appendContentToMessage(botMessageId, '> ⚡ 意图识别：无需联网，直接回答...\n\n');
          }
        } catch (searchError) {
          console.error('Agentic search failed:', searchError);
          appendContentToMessage(botMessageId, '> ❌ 联网搜索过程出错，将基于现有知识回答...\n\n');
        }
      }

      const promptWithSearch = searchResults 
        ? (Array.isArray(finalContent)
            ? [
                { type: 'text' as const, text: `以下是关于“${content}”的网络搜索结果：\n\n${searchResults}\n\n请结合以上资料回答用户的问题。` },
                ...finalContent.filter(p => p.type === 'image_url')
              ]
            : `以下是关于“${content}”的网络搜索结果：\n\n${searchResults}\n\n请结合以上资料回答用户的问题。`
          )
        : finalContent;

      await streamChatCompletion({
        config: { ...config, model: sessionModel },
        messages: [
          { role: 'system', content: systemPrompt },
          ...validHistory, 
          { role: 'user', content: promptWithSearch }
        ], 
        signal,
        onChunk: (chunk) => {
          appendContentToMessage(botMessageId, chunk);
        },
        onUsage: (usage) => {
          setMessageUsage(botMessageId, usage);
        },
        onFinish: () => {
          updateMessageStatus(botMessageId, MessageStatus.SENT);
          setLoading(false, sessionId!);
        },
        onError: (error) => {
          if (error.name === 'AbortError') {
            updateMessageStatus(botMessageId, MessageStatus.SENT);
          } else {
            updateMessageStatus(botMessageId, MessageStatus.ERROR, error.message);
          }
          setLoading(false, sessionId!);
        },
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      updateMessageStatus(botMessageId, MessageStatus.ERROR, '发送请求失败');
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
