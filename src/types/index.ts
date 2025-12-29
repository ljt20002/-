export type Role = 'system' | 'user' | 'assistant';

export enum MessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  RECEIVING = 'receiving',
  ERROR = 'error',
}

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export type MessageType = 'text' | 'image_url';

export interface ContentPart {
  type: MessageType;
  text?: string;
  image_url?: {
    url: string;
  };
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string | ContentPart[];
  timestamp: number;
  status: MessageStatus;
  error?: string;
  usage?: TokenUsage;
}

export interface AppConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
  systemPrompt?: string;
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
}

export interface Message {
    role: Role;
    content: string | ContentPart[];
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: Role;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: TokenUsage;
}

export interface ChatCompletionChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    delta: {
      role?: Role;
      content?: string;
    };
    finish_reason: string | null;
  }[];
}
