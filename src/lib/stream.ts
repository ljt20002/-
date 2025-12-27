import { AppConfig, Message, TokenUsage } from '../types';

interface StreamOptions {
  config: AppConfig;
  messages: Message[];
  onChunk: (content: string) => void;
  onUsage?: (usage: TokenUsage) => void;
  onFinish: () => void;
  onError: (error: Error) => void;
}

export async function streamChatCompletion({
  config,
  messages,
  onChunk,
  onUsage,
  onFinish,
  onError,
}: StreamOptions) {
  try {
    const { apiKey, model, baseUrl } = config;
    const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        stream: true,
        stream_options: { include_usage: true },
        messages: messages.map(({ role, content }) => ({ role, content })),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `API Error: ${response.status} ${response.statusText}`
      );
    }

    if (!response.body) {
      throw new Error('Response body is empty');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      // Keep the last part in buffer if it doesn't end with newline
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;

        const dataStr = trimmedLine.slice(6);
        if (dataStr === '[DONE]') {
          continue;
        }

        try {
          const data = JSON.parse(dataStr);
          
          // Handle usage data
          if (data.usage && onUsage) {
            onUsage(data.usage);
          }

          const content = data.choices?.[0]?.delta?.content || '';
          if (content) {
            onChunk(content);
          }
        } catch (e) {
          console.warn('Error parsing stream data:', e);
        }
      }
    }

    onFinish();
  } catch (error) {
    onError(error instanceof Error ? error : new Error('Unknown error'));
  }
}
