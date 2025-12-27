import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Eraser } from 'lucide-react';
import { cn } from '../lib/utils';

interface ChatInputProps {
  onSend: (content: string) => void;
  onClear: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, onClear, isLoading, disabled }) => {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [content]);

  const handleSubmit = () => {
    if (!content.trim() || isLoading || disabled) return;
    onSend(content);
    setContent('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="max-w-4xl mx-auto flex items-end gap-3">
        <button
            onClick={onClear}
            className="p-3 text-gray-500 hover:text-red-500 hover:bg-gray-100 rounded-full transition-colors"
            title="清空对话"
            disabled={isLoading || disabled}
        >
            <Eraser className="w-5 h-5" />
        </button>
        
        <div className="relative flex-1 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-0 focus-within:shadow-sm transition-all">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="输入您的问题..."
            className="w-full max-h-[200px] min-h-[52px] py-3 pl-4 pr-12 bg-transparent border-none resize-none focus:ring-0 outline-none focus:outline-none text-sm disabled:opacity-50 placeholder:text-gray-400"
            rows={1}
          />
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || isLoading || disabled}
            className={cn(
              "absolute right-2 bottom-2 p-2 rounded-lg transition-colors",
              content.trim() && !isLoading && !disabled
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
      <div className="text-center mt-2 text-xs text-gray-400">
        按 Enter 发送，Shift + Enter 换行
      </div>
    </div>
  );
};
