import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ChatMessage, ContentPart, MessageStatus, Role, TokenUsage, ChatSession } from '../types';
import { idbStorage } from '../lib/idb-storage';
import { useConfigStore } from './useConfigStore';

interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  
  // Session Actions
  createSession: (title?: string, model?: string, systemPrompt?: string) => string;
  switchSession: (id: string) => void;
  deleteSession: (id: string) => void;
  updateSessionTitle: (id: string, title: string) => void;
  updateSessionModel: (id: string, model: string) => void;
  updateSessionSystemPrompt: (id: string, systemPrompt: string) => void;
  clearAllSessions: () => void;
  
  // Message Actions (operating on specific sessions or finding them)
  addMessage: (role: Role, content: string | ContentPart[], model?: string) => string;
  updateMessageContent: (id: string, content: string | ContentPart[]) => void;
  updateMessageStatus: (id: string, status: MessageStatus, error?: string) => void;
  setMessageUsage: (id: string, usage: TokenUsage) => void;
  setMessageLatency: (id: string, latency: number) => void;
  appendContentToMessage: (id: string, content: string) => void;
  deleteMessage: (id: string) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean, sessionId?: string) => void;
  abortResponse: (sessionId?: string) => void;
  getSignal: (sessionId?: string) => AbortSignal | undefined;
  updateSessionSummary: (sessionId: string) => Promise<void>;
}

// 存储各个会话的 AbortController
const abortControllers = new Map<string, AbortController>();

// 辅助函数：清理卡住的消息状态
const cleanupSessionMessages = (session: ChatSession): ChatSession => {
  return {
    ...session,
    isLoading: false,
    messages: session.messages.map(m => {
      if (m.status === MessageStatus.PENDING || m.status === MessageStatus.RECEIVING) {
        return { ...m, status: MessageStatus.ERROR, error: '会话已中断' };
      }
      return m;
    })
  };
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSessionId: null,

      createSession: (title, model, systemPrompt) => {
        const config = useConfigStore.getState().config;
        const id = crypto.randomUUID();
        const newSession: ChatSession = {
          id,
          title: title || '新会话',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          model: model || config.model,
          systemPrompt: systemPrompt || config.systemPrompt || 'You are a helpful AI assistant.',
          isLoading: false,
          lastSummarizedMessageIndex: 0,
        };
        set((state) => ({
          sessions: [newSession, ...state.sessions],
          currentSessionId: id,
        }));
        return id;
      },

      switchSession: (id) => {
        set({ currentSessionId: id });
      },

      deleteSession: (id) => {
        set((state) => {
          const newSessions = state.sessions.filter((s) => s.id !== id);
          let newCurrentId = state.currentSessionId;
          if (state.currentSessionId === id) {
            newCurrentId = newSessions.length > 0 ? newSessions[0].id : null;
          }
          return {
            sessions: newSessions,
            currentSessionId: newCurrentId,
          };
        });
      },

      updateSessionTitle: (id, title) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, title, updatedAt: Date.now() } : s
          ),
        }));
      },

      updateSessionModel: (id, model) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, model, updatedAt: Date.now() } : s
          ),
        }));
      },

      updateSessionSystemPrompt: (id, systemPrompt) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, systemPrompt, updatedAt: Date.now() } : s
          ),
        }));
      },

      clearAllSessions: () => {
        set({ sessions: [], currentSessionId: null });
      },

      addMessage: (role, content, model) => {
        const state = get();
        let sessionId = state.currentSessionId;

        // If no session exists, create one
        if (!sessionId) {
          const config = useConfigStore.getState().config;
          sessionId = state.createSession(undefined, model || config.model, config.systemPrompt);
        }

        const messageId = crypto.randomUUID();
        const newMessage: ChatMessage = {
          id: messageId,
          role,
          content,
          timestamp: Date.now(),
          status: role === 'user' ? MessageStatus.SENT : MessageStatus.PENDING,
          model,
        };

        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id === sessionId) {
              const messages = [...s.messages, newMessage];
              let title = s.title;
              if (role === 'user' && (title === '新会话' || !title)) {
                const textContent = typeof content === 'string' 
                  ? content 
                  : content.find(p => p.type === 'text')?.text || '新会话';
                title = textContent.slice(0, 20);
              }
              return { ...s, messages, title, updatedAt: Date.now() };
            }
            return s;
          }),
        }));

        return messageId;
      },

      updateMessageContent: (id, content) => {
        set((state) => ({
          sessions: state.sessions.map((s) => ({
            ...s,
            messages: s.messages.map((m) =>
              m.id === id ? { ...m, content } : m
            ),
          })),
        }));
      },

      updateMessageStatus: (id, status, error) => {
        set((state) => ({
          sessions: state.sessions.map((s) => ({
            ...s,
            messages: s.messages.map((m) =>
              m.id === id ? { ...m, status, error } : m
            ),
          })),
        }));
      },

      setMessageUsage: (id, usage) => {
        set((state) => ({
          sessions: state.sessions.map((s) => ({
            ...s,
            messages: s.messages.map((m) =>
              m.id === id ? { ...m, usage } : m
            ),
          })),
        }));
      },

      setMessageLatency: (id, latency) => {
        set((state) => ({
          sessions: state.sessions.map((s) => ({
            ...s,
            messages: s.messages.map((m) =>
              m.id === id ? { ...m, latency } : m
            ),
          })),
        }));
      },

      appendContentToMessage: (id, content) => {
        set((state) => ({
          sessions: state.sessions.map((s) => ({
            ...s,
            messages: s.messages.map((m) =>
              m.id === id
                ? {
                    ...m,
                    content: typeof m.content === 'string' ? m.content + content : m.content,
                  }
                : m
            ),
          })),
        }));
      },

      deleteMessage: (id) => {
        set((state) => ({
          sessions: state.sessions.map((s) => ({
            ...s,
            messages: s.messages.filter((m) => m.id !== id),
            updatedAt: Date.now(),
          })),
        }));
      },

      clearMessages: () => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === state.currentSessionId
              ? { ...s, messages: [], title: '新会话', updatedAt: Date.now() }
              : s
          ),
        }));
      },

      setLoading: (loading, sessionId) => {
        const targetId = sessionId || get().currentSessionId;
        if (!targetId) return;

        if (loading) {
          abortControllers.set(targetId, new AbortController());
        } else {
          abortControllers.delete(targetId);
        }

        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === targetId ? { ...s, isLoading: loading } : s
          ),
        }));
      },

      abortResponse: (sessionId) => {
        const targetId = sessionId || get().currentSessionId;
        if (!targetId) return;

        const controller = abortControllers.get(targetId);
        if (controller) {
          controller.abort();
          abortControllers.delete(targetId);
        }

        get().setLoading(false, targetId);
      },

      getSignal: (sessionId) => {
        const targetId = sessionId || get().currentSessionId;
        return targetId ? abortControllers.get(targetId)?.signal : undefined;
      },

      updateSessionSummary: async (sessionId) => {
        const state = get();
        const session = state.sessions.find(s => s.id === sessionId);
        if (!session || session.isLoading) return;

        const config = useConfigStore.getState().config;
        if (config.contextStrategy !== 'auto') {
          console.log(`[Store] 摘要跳过: 当前策略为 ${config.contextStrategy}, 仅 auto 模式执行摘要`);
          return;
        }

        const allMessages = session.messages.filter(m => m.status === MessageStatus.SENT);
        const lastIndex = session.lastSummarizedMessageIndex || 0;
        
        // 我们保留最后 maxRecentMessages 条消息不进行总结
        const messagesToSummarize = allMessages.slice(lastIndex, -config.maxRecentMessages);
        
        console.log(`[Store] 摘要检查: 总成功消息 ${allMessages.length}, 已总结至 ${lastIndex}, 待总结 ${messagesToSummarize.length}, 触发阈值 ${config.summaryUpdateInterval}`);

        if (messagesToSummarize.length < config.summaryUpdateInterval) {
          console.log(`[Store] 摘要跳过: 待总结消息数未达到阈值`);
          return;
        }

        try {
          const { generateSummary } = await import('../lib/context');
          const newSummary = await generateSummary(config, session.contextSummary, messagesToSummarize);
          
          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === sessionId 
                ? { 
                    ...s, 
                    contextSummary: newSummary, 
                    lastSummarizedMessageIndex: lastIndex + messagesToSummarize.length,
                    updatedAt: Date.now() 
                  } 
                : s
            ),
          }));
          console.log(`[Store] 摘要更新成功: 已同步至索引 ${lastIndex + messagesToSummarize.length}`);
        } catch (error) {
          console.error('[Store] 摘要更新失败:', error);
        }
      },
    }),
    {
      name: 'chat-sessions',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          const state = persistedState as ChatState;
          return {
            ...state,
            sessions: state.sessions.map(s => ({
              ...s,
              lastSummarizedMessageIndex: 0,
            }))
          };
        }
        return persistedState;
      },
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        sessions: state.sessions.map(s => cleanupSessionMessages(s)), // 持久化前清理状态
        currentSessionId: state.currentSessionId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // 再次确保恢复后的状态是干净的
          if (state.sessions) {
            state.sessions = state.sessions.map(s => cleanupSessionMessages(s));
          }

          if (state.sessions.length === 0) {
            const localData = localStorage.getItem('chat-sessions');
            if (localData) {
              try {
                const parsed = JSON.parse(localData);
                if (parsed.state && Array.isArray(parsed.state.sessions)) {
                  state.sessions = parsed.state.sessions.map((s: ChatSession) => cleanupSessionMessages(s));
                  state.currentSessionId = parsed.state.currentSessionId;
                }
              } catch (e) {
                console.error('Migration from localStorage failed:', e);
              }
            }
          }
        }
      },
    }
  )
);
