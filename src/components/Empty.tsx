import React from 'react';
import { Bot } from 'lucide-react';

export const Empty: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-400 mt-20">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
        <Bot className="w-8 h-8 text-blue-500" />
      </div>
      <h3 className="text-lg font-medium text-gray-900">开始新的对话</h3>
      <p className="text-sm mt-2">配置 API Key 后即可开始聊天</p>
    </div>
  );
};
