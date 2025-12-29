import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
// @ts-expect-error missing types
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// @ts-expect-error missing types
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ChatMessage } from '../types';
import { cn, calculateCost } from '../lib/utils';
import { User, Bot, AlertCircle, Zap, Coins } from 'lucide-react';
import { useConfigStore } from '../store/useConfigStore';

interface MessageItemProps {
  message: ChatMessage;
}

const MarkdownComponents: React.ComponentProps<typeof ReactMarkdown>['components'] = {
  code({ inline, className, children, ...props }: React.ComponentPropsWithoutRef<'code'> & { inline?: boolean }) {
    const match = /language-(\w+)/.exec(className || '');
    return !inline && match ? (
      <SyntaxHighlighter
        {...props}
        style={vscDarkPlus}
        language={match[1]}
        PreTag="div"
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    ) : (
      <code {...props} className={cn(className, "bg-black/10 rounded px-1")}>
        {children}
      </code>
    );
  }
};

const MarkdownText = ({ content }: { content: string }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    rehypePlugins={[rehypeRaw]}
    components={MarkdownComponents}
  >
    {content}
  </ReactMarkdown>
);

const MessageItemComponent: React.FC<MessageItemProps> = ({ message }) => {
  const { config } = useConfigStore();
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) return null;

  const cost = !isUser && message.usage ? calculateCost(message.usage, config.model) : null;
  
  const hasContent = typeof message.content === 'string' 
    ? !!message.content 
    : message.content.length > 0;

  return (
    <div
      className={cn(
        "flex w-full gap-3 p-4",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser ? "bg-blue-600 text-white" : "bg-green-600 text-white"
        )}
      >
        {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>

      <div
        className={cn(
          "flex flex-col max-w-[95%] lg:max-w-[75%] min-w-0",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-3 shadow-sm overflow-x-auto max-w-full",
            isUser
              ? "bg-blue-600 text-white rounded-tr-none"
              : "bg-white border border-gray-100 rounded-tl-none text-gray-800"
          )}
        >
          {(message.status === 'receiving' || message.status === 'pending') && !hasContent ? (
            <div className="flex items-center gap-1 h-6 px-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            </div>
          ) : (
            <div className={cn("prose prose-sm max-w-none break-words", isUser && "prose-invert")}>
              {typeof message.content === 'string' ? (
                <MarkdownText content={message.content} />
              ) : (
                message.content.map((part, index) => {
                  if (part.type === 'text') {
                    return <MarkdownText key={index} content={part.text || ''} />;
                  }
                  if (part.type === 'image_url') {
                    return (
                      <img 
                        key={index}
                        src={part.image_url?.url}
                        alt="Uploaded content"
                        className="max-w-full rounded-lg my-2"
                      />
                    );
                  }
                  return null;
                })
              )}
            </div>
          )}
        </div>

        {/* 消耗统计 */}
        {!isUser && message.usage && (
          <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-400 select-none flex-wrap">
            <div className="flex items-center gap-0.5" title="总 Tokens">
              <Zap className="w-3 h-3" />
              <span>{message.usage.total_tokens} tokens</span>
            </div>
            <span>•</span>
            <span title="输入 Tokens">In: {message.usage.prompt_tokens}</span>
            <span>•</span>
            <span title="输出 Tokens">Out: {message.usage.completion_tokens}</span>
            {cost && (
              <>
                <span>•</span>
                <div className="flex items-center gap-0.5 text-yellow-600/80" title="估算消耗">
                  <Coins className="w-3 h-3" />
                  <span>{cost}</span>
                </div>
              </>
            )}
          </div>
        )}

        {message.status === 'error' && (
          <div className="mt-1 flex items-center gap-1 text-xs text-red-500">
            <AlertCircle className="w-3 h-3" />
            <span>{message.error || '发送失败'}</span>
          </div>
        )}
        
        <span className="text-xs text-gray-400 mt-1">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

export const MessageItem = memo(MessageItemComponent, (prev, next) => {
  return (
    prev.message.content === next.message.content &&
    prev.message.status === next.message.status &&
    prev.message.usage?.total_tokens === next.message.usage?.total_tokens
  );
});
