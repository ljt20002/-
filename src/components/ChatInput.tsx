import React, { useState, useRef } from 'react';
import { 
  SendOutlined, 
  ClearOutlined, 
  PictureOutlined, 
  CloseCircleFilled, 
  StopOutlined, 
  GlobalOutlined, 
  ThunderboltOutlined, 
  UndoOutlined,
  LoadingOutlined 
} from '@ant-design/icons';
import { Button, Input, Tooltip, Badge, message } from 'antd';
import { cn, playNotificationSound } from '../lib/utils';
import { useConfigStore } from '../store/useConfigStore';
import { streamChatCompletion } from '../lib/stream';

const { TextArea } = Input;

interface ChatInputProps {
  onSend: (content: string, images: string[]) => void;
  onClear: () => void;
  onAbort?: () => void;
  isLoading: boolean;
  disabled?: boolean;
  supportVision?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSend, 
  onClear, 
  onAbort, 
  isLoading, 
  disabled, 
  supportVision,
  value,
  onChange
}) => {
  const { config, setConfig } = useConfigStore();
  const [internalContent, setInternalContent] = useState('');
  const [lastOriginalContent, setLastOriginalContent] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const content = value !== undefined ? value : internalContent;
  const setContent = (val: string) => {
    if (onChange) {
      onChange(val);
    } else {
      setInternalContent(val);
    }
  };

  const handleOptimize = async () => {
    if (!content.trim() || isOptimizing || isLoading) return;
    
    const optimizerModelId = config.optimizerModelId || config.model;
    if (!config.apiKey) {
      message.warning('请先在设置中配置 API Key');
      return;
    }

    setLastOriginalContent(content);
    setIsOptimizing(true);
    let optimizedContent = '';
    
    try {
      await streamChatCompletion({
        config: { ...config, model: optimizerModelId },
        messages: [
          { 
            role: 'system', 
            content: '你是一个提示词工程专家。请优化用户输入的提示词，使其更加清晰、专业、详细且易于 AI 理解。直接输出优化后的提示词内容，不要包含任何解释或开场白。' 
          },
          { role: 'user', content }
        ],
        onChunk: (chunk) => {
          optimizedContent += chunk;
          setContent(optimizedContent);
        },
        onFinish: () => {
          setIsOptimizing(false);
          message.success('提示词优化完成');
          playNotificationSound();
        },
        onError: (error) => {
          console.error('Prompt optimization failed:', error);
          message.error('提示词优化失败: ' + error.message);
          setIsOptimizing(false);
        }
      });
    } catch (error) {
      console.error('Prompt optimization error:', error);
      setIsOptimizing(false);
    }
  };

  const handleSubmit = () => {
    if ((!content.trim() && images.length === 0) || isLoading || disabled) return;
    onSend(content, images);
    setContent('');
    setImages([]);
    setLastOriginalContent(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

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

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="max-w-4xl mx-auto flex items-end gap-3">
        <Tooltip title="清空对话">
          <Button
            shape="circle"
            icon={<ClearOutlined />}
            onClick={onClear}
            disabled={isLoading || disabled}
            className="flex-shrink-0 mb-1"
          />
        </Tooltip>
        
        <div className="relative flex-1 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-blue-500 transition-all flex flex-col">
          {images.length > 0 && (
            <div className="flex gap-2 p-3 pb-0 overflow-x-auto">
              {images.map((img, index) => (
                <div key={index} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 group flex-shrink-0">
                  <img src={img} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-0.5 right-0.5 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <CloseCircleFilled className="text-base" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex items-center">
            <div className="flex items-center pl-1">
              {supportVision && (
                <>
                  <Tooltip title="上传图片">
                    <Button
                      type="text"
                      icon={<PictureOutlined />}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading || disabled}
                      className="text-gray-400 hover:text-gray-600"
                    />
                  </Tooltip>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                </>
              )}

              <Tooltip title={config.searchEnabled ? "关闭联网搜索" : "开启联网搜索"}>
                <Button
                  type="text"
                  icon={<GlobalOutlined className={cn(config.searchEnabled && "text-blue-600")} />}
                  onClick={() => setConfig({ searchEnabled: !config.searchEnabled })}
                  disabled={isLoading || disabled}
                  className={cn(config.searchEnabled ? "bg-blue-50" : "text-gray-400")}
                />
              </Tooltip>

              <Tooltip title="优化提示词">
                <Button
                  type="text"
                  icon={isOptimizing ? <LoadingOutlined /> : <ThunderboltOutlined className={cn(isOptimizing && "text-purple-600")} />}
                  onClick={handleOptimize}
                  disabled={isLoading || disabled || isOptimizing || !content.trim()}
                  className={cn(isOptimizing ? "bg-purple-50" : "text-gray-400")}
                />
              </Tooltip>

              {lastOriginalContent && (
                <Tooltip title="撤销优化">
                  <Button
                    type="text"
                    icon={<UndoOutlined />}
                    onClick={() => {
                      setContent(lastOriginalContent);
                      setLastOriginalContent(null);
                    }}
                    className="text-orange-400 hover:text-orange-600"
                  />
                </Tooltip>
              )}
            </div>
            
            <TextArea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={disabled}
              placeholder="输入您的问题..."
              autoSize={{ minRows: 1, maxRows: 8 }}
              onPressEnter={(e) => {
                if (e.shiftKey) return;
                // Note: The previous logic was disabled as per recent commits
                // e.preventDefault();
                // handleSubmit();
              }}
              className="flex-1 py-3 px-2 bg-transparent border-none focus:ring-0 shadow-none hover:bg-transparent text-sm disabled:opacity-50"
            />

            <div className="pr-2 pb-2 self-end">
              {isLoading ? (
                <Tooltip title="停止生成">
                  <Button
                    type="primary"
                    danger
                    shape="circle"
                    icon={<StopOutlined />}
                    onClick={onAbort}
                    size="small"
                  />
                </Tooltip>
              ) : (
                <Button
                  type="primary"
                  shape="circle"
                  icon={<SendOutlined />}
                  onClick={handleSubmit}
                  disabled={(!content.trim() && images.length === 0) || disabled}
                  size="small"
                  className={cn(
                    (!content.trim() && images.length === 0) || disabled
                      ? "bg-gray-200 text-gray-400 border-none"
                      : "bg-blue-600"
                  )}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="text-center mt-3 text-[10px] text-gray-400 flex items-center justify-center gap-1">
        <span>输入您的问题，点击发送按钮提交</span>
        {config.searchEnabled && <Badge status="processing" text="联网搜索已开启" className="scale-75 origin-left" />}
      </div>
    </div>
  );
};
