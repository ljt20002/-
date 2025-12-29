import React from 'react';
import { useChatStore } from '../store/useChatStore';
import { useConfigStore } from '../store/useConfigStore';
import { cn } from '../lib/utils';
import { Plus, MessageSquare, Trash2, X } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { 
    sessions, 
    currentSessionId, 
    createSession, 
    switchSession, 
    deleteSession 
  } = useChatStore();
  const { config } = useConfigStore();

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
            <h2 className="font-bold text-lg text-gray-800">历史会话</h2>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* New Chat Button */}
          <div className="p-4">
            <button
              onClick={() => {
                createSession(undefined, config.model, config.systemPrompt);
                if (window.innerWidth < 1024) onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>开启新会话</span>
            </button>
          </div>

          {/* Session List */}
          <div className="flex-1 overflow-y-auto px-2 space-y-1">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
                  currentSessionId === session.id 
                    ? "bg-blue-50 text-blue-700" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
                onClick={() => {
                  switchSession(session.id);
                  if (window.innerWidth < 1024) onClose();
                }}
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 truncate text-sm">
                  {session.title}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('确定要删除这个会话吗？')) {
                      deleteSession(session.id);
                    }
                  }}
                  className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-red-500 transition-all opacity-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            
            {sessions.length === 0 && (
              <div className="text-center py-10 text-gray-400 text-sm">
                暂无会话
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="p-4 border-t border-gray-100 text-[10px] text-gray-400 text-center">
            纯前端静态存储 · 历史记录保存在本地
          </div>
        </div>
      </div>
    </>
  );
};
