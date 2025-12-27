import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ChatMessage } from '../types';
import { cn, calculateCost } from '../lib/utils';
import { User, Bot, Loader2, AlertCircle, Zap, Coins } from 'lucide-react';
import { useConfigStore } from '../store/useConfigStore';

interface MessageItemProps {
  message: ChatMessage;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const { config } = useConfigStore();
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) return null; // Optionally hide system messages or style them differently

  const cost = !isUser && message.usage ? calculateCost(message.usage, config.model) : null;

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
          "flex flex-col max-w-[85%] lg:max-w-[75%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-3 shadow-sm",
            isUser
              ? "bg-blue-600 text-white rounded-tr-none"
              : "bg-white border border-gray-100 rounded-tl-none text-gray-800"
          )}
        >
          {message.status === 'receiving' && !message.content ? (
            <div className="flex items-center gap-1 h-6 px-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            </div>
          ) : (
            <div className={cn("prose prose-sm max-w-none break-words", isUser && "prose-invert")}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
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
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Usage Stats */}
        {!isUser && message.usage && (
          <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-400 select-none flex-wrap">
            <div className="flex items-center gap-0.5" title="Total Tokens">
              <Zap className="w-3 h-3" />
              <span>{message.usage.total_tokens} tokens</span>
            </div>
            <span>•</span>
            <span title="Input Tokens">In: {message.usage.prompt_tokens}</span>
            <span>•</span>
            <span title="Output Tokens">Out: {message.usage.completion_tokens}</span>
            {cost && (
              <>
                <span>•</span>
                <div className="flex items-center gap-0.5 text-yellow-600/80" title="Estimated Cost">
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
