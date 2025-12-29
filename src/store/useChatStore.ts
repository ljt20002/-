import { create } from 'zustand';
import { ChatMessage, ContentPart, MessageStatus, Role, TokenUsage } from '../types';

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  addMessage: (role: Role, content: string | ContentPart[]) => string;
  updateMessageContent: (id: string, content: string | ContentPart[]) => void;
  updateMessageStatus: (id: string, status: MessageStatus, error?: string) => void;
  setMessageUsage: (id: string, usage: TokenUsage) => void;
  appendContentToMessage: (id: string, content: string) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,

  addMessage: (role: Role, content: string | ContentPart[]) => {
    const id = crypto.randomUUID();
    const newMessage: ChatMessage = {
      id,
      role,
      content,
      timestamp: Date.now(),
      status: role === 'user' ? MessageStatus.SENT : MessageStatus.PENDING,
    };
    set((state) => ({ messages: [...state.messages, newMessage] }));
    return id;
  },

  updateMessageContent: (id: string, content: string | ContentPart[]) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, content } : msg
      ),
    }));
  },

  updateMessageStatus: (id: string, status: MessageStatus, error?: string) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, status, error } : msg
      ),
    }));
  },

  setMessageUsage: (id: string, usage: TokenUsage) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, usage } : msg
      ),
    }));
  },

  appendContentToMessage: (id: string, content: string) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id 
          ? { 
              ...msg, 
              content: typeof msg.content === 'string' 
                ? msg.content + content 
                : msg.content 
            } 
          : msg
      ),
    }));
  },

  clearMessages: () => set({ messages: [] }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
}));
