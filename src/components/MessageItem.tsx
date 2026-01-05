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
import { 
  UserOutlined, 
  RobotOutlined, 
  WarningOutlined, 
  ThunderboltOutlined, 
  DollarOutlined, 
  DesktopOutlined, 
  DeleteOutlined, 
  ClockCircleOutlined 
} from '@ant-design/icons';
import { Avatar, Popconfirm, Button, Tooltip, Typography, Space } from 'antd';
import { useConfigStore } from '../store/useConfigStore';
import { useChatStore } from '../store/useChatStore';
import { AVAILABLE_MODELS } from '../lib/constants';

const { Text } = Typography;

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

export const MarkdownText = ({ content }: { content: string }) => (
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
  const { deleteMessage } = useChatStore();
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  const displayModel = message.model || config.model;
  const modelInfo = AVAILABLE_MODELS.find(m => m.id === displayModel);
  const modelName = modelInfo ? modelInfo.name : displayModel;

  if (isSystem) return null;

  const cost = !isUser && message.usage ? calculateCost(message.usage, displayModel) : null;
  
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
      <Avatar 
        icon={isUser ? <UserOutlined /> : <RobotOutlined />} 
        style={{ 
          backgroundColor: isUser ? '#1890ff' : '#52c41a',
          flexShrink: 0 
        }}
      />

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
        {!isUser && (
          <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-400 select-none flex-wrap">
            <Tooltip title="使用模型">
              <Space size={2}>
                <DesktopOutlined />
                <span>{modelName}</span>
              </Space>
            </Tooltip>
            {message.usage && (
              <>
                <span>•</span>
                <Tooltip title="Token 消耗总量">
                  <Space size={2}>
                    <ThunderboltOutlined />
                    <span>{message.usage.total_tokens}</span>
                  </Space>
                </Tooltip>
                <span>•</span>
                <Tooltip title="输入/输出 Token 分布">
                  <span>{message.usage.prompt_tokens} / {message.usage.completion_tokens}</span>
                </Tooltip>
                {message.latency && (
                  <>
                    <span>•</span>
                    <Tooltip title="响应时间">
                      <Space size={2}>
                        <ClockCircleOutlined />
                        <span>{(message.latency / 1000).toFixed(2)}s</span>
                      </Space>
                    </Tooltip>
                  </>
                )}
                {cost && (
                  <>
                    <span>•</span>
                    <Tooltip title="估算费用">
                      <Space size={2} className="text-yellow-600/80">
                        <DollarOutlined />
                        <span>{cost}</span>
                      </Space>
                    </Tooltip>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {message.status === 'error' && (
          <div className="mt-1 flex items-center gap-1 text-xs text-red-500">
            <WarningOutlined />
            <span>{message.error || '发送失败'}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2 mt-1">
          <Text type="secondary" style={{ fontSize: 10 }}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <Popconfirm
            title="删除消息"
            description="确定要删除这条消息吗？"
            onConfirm={() => deleteMessage(message.id)}
            okText="确定"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined style={{ fontSize: 10 }} />}
              className="text-gray-400 hover:text-red-500 p-0 h-4 w-4 flex items-center justify-center"
            />
          </Popconfirm>
        </div>
      </div>
    </div>
  );
};

export const MessageItem = memo(MessageItemComponent, (prev, next) => {
  return (
    prev.message.content === next.message.content &&
    prev.message.status === next.message.status &&
    prev.message.model === next.message.model &&
    prev.message.latency === next.message.latency &&
    prev.message.usage?.total_tokens === next.message.usage?.total_tokens
  );
});
