import React from 'react';
import { useChatStore } from '../store/useChatStore';
import { useConfigStore } from '../store/useConfigStore';
import { cn } from '../lib/utils';
import { 
  PlusOutlined, 
  MessageOutlined, 
  DeleteOutlined, 
  CloseOutlined, 
  NodeIndexOutlined 
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Typography, Popconfirm, Divider, Empty } from 'antd';

const { Title, Text } = Typography;

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    sessions, 
    currentSessionId, 
    createSession, 
    switchSession, 
    deleteSession 
  } = useChatStore();
  const { config } = useConfigStore();

  const isComparePage = location.pathname === '/compare';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Content */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <Title level={5} style={{ margin: 0 }} className="text-gray-800">
              AI 助手
            </Title>
            <Button 
              type="text"
              icon={<CloseOutlined />}
              onClick={onClose}
              className="lg:hidden"
            />
          </div>

          {/* Navigation */}
          <div className="p-4 space-y-2">
            <Button
              type="primary"
              block
              icon={<PlusOutlined />}
              onClick={() => {
                navigate('/');
                createSession(undefined, config.model, config.systemPrompt);
                if (window.innerWidth < 1024) onClose();
              }}
              size="large"
            >
              开启新会话
            </Button>

            <Button
              block
              icon={<NodeIndexOutlined />}
              onClick={() => {
                navigate('/compare');
                if (window.innerWidth < 1024) onClose();
              }}
              className={cn(
                isComparePage && "bg-blue-50 text-blue-700 border-blue-200"
              )}
            >
              模型对比
            </Button>
          </div>

          <Divider style={{ margin: '8px 16px', width: 'auto', minWidth: 'auto' }} />
          
          <div className="px-4 py-2">
            <Text type="secondary" className="text-xs font-semibold uppercase tracking-wider">
              历史会话
            </Text>
          </div>

          {/* Session List */}
          <div className="flex-1 overflow-y-auto px-2 space-y-1 no-scrollbar">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors relative",
                  !isComparePage && currentSessionId === session.id 
                    ? "bg-blue-50 text-blue-700" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
                onClick={() => {
                  navigate('/');
                  switchSession(session.id);
                  if (window.innerWidth < 1024) onClose();
                }}
              >
                <MessageOutlined className="text-sm flex-shrink-0" />
                <span className="flex-1 truncate text-sm">
                  {session.title}
                </span>
                <Popconfirm
                  title="删除会话"
                  description="确定要删除这个会话吗？"
                  onConfirm={(e) => {
                    e?.stopPropagation();
                    deleteSession(session.id);
                  }}
                  onCancel={(e) => e?.stopPropagation()}
                  okText="确定"
                  cancelText="取消"
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    className="text-gray-400 hover:text-red-500 p-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  />
                </Popconfirm>
              </div>
            ))}
            
            {sessions.length === 0 && (
              <div className="py-10">
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无会话" />
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="p-4 border-t border-gray-100 bg-gray-50/30">
            <Text type="secondary" className="text-[10px] block text-center italic">
              纯前端静态存储 · 历史记录保存在本地
            </Text>
          </div>
        </div>
      </div>
    </>
  );
};
