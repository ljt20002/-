import React, { useState, useRef, useEffect } from 'react';
import { Send, Eraser, Image as ImageIcon, X, Square, Globe } from 'lucide-react';
import { cn } from '../lib/utils';
import { useConfigStore } from '../store/useConfigStore';

interface ChatInputProps {
  onSend: (content: string, images: string[]) => void;
  onClear: () => void;
  onAbort?: () => void;
  isLoading: boolean;
  disabled?: boolean;
  supportVision?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, onClear, onAbort, isLoading, disabled, supportVision }) => {
  const { config, setConfig } = useConfigStore();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if ((!content.trim() && images.length === 0) || isLoading || disabled) return;
    onSend(content, images);
    setContent('');
    setImages([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Convert to base64
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setImages(prev => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="max-w-4xl mx-auto flex items-end gap-4">
        <button
            onClick={onClear}
            className="p-3 text-gray-500 hover:text-red-500 hover:bg-gray-100 rounded-full transition-colors"
            title="清空对话"
            disabled={isLoading || disabled}
        >
            <Eraser className="w-5 h-5" />
        </button>
        
        <div className="relative flex-1 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-0 focus-within:shadow-sm transition-all">
          {images.length > 0 && (
            <div className="flex gap-2 p-3 pb-0 overflow-x-auto">
              {images.map((img, index) => (
                <div key={index} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 group">
                  <img src={img} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-0.5 right-0.5 p-0.5 bg-black/50 text-white rounded-full hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex items-center min-h-[52px]">
            <div className="flex items-center h-full">
              <div className={cn("transition-all duration-200", !supportVision && "w-0 overflow-hidden opacity-0")}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-gray-400 hover:text-gray-600 transition-colors"
                  title="上传图片"
                  disabled={isLoading || disabled || !supportVision}
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
              </div>

              <button
                onClick={() => setConfig({ searchEnabled: !config.searchEnabled })}
                className={cn(
                  "p-3 transition-all duration-200 rounded-lg",
                  config.searchEnabled 
                    ? "text-blue-600 bg-blue-50" 
                    : "text-gray-400 hover:text-gray-600"
                )}
                title={config.searchEnabled ? "关闭联网搜索" : "开启联网搜索"}
                disabled={isLoading || disabled}
              >
                <Globe className={cn("w-5 h-5", config.searchEnabled && "animate-pulse")} />
              </button>
            </div>
            
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={disabled}
              placeholder="输入您的问题..."
              className={cn(
                "flex-1 max-h-[200px] min-h-[52px] py-3 pr-12 bg-transparent border-none resize-none focus:ring-0 outline-none focus:outline-none text-sm disabled:opacity-50 placeholder:text-gray-400",
                !supportVision && "pl-4"
              )}
              rows={1}
            />
          </div>

          {isLoading ? (
            <button
              onClick={onAbort}
              className="absolute right-2 bottom-2 p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm"
              title="停止生成"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={(!content.trim() && images.length === 0) || disabled}
              className={cn(
                "absolute right-2 bottom-2 p-2 rounded-lg transition-colors",
                (content.trim() || images.length > 0) && !disabled
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <div className="text-center mt-3 text-xs text-gray-400">
        输入您的问题，点击发送按钮提交
      </div>
    </div>
  );
};
