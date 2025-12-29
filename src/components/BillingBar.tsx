import React, { useMemo } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useConfigStore } from '../store/useConfigStore';
import { calculateCost } from '../lib/utils';
import { Calendar, TrendingUp } from 'lucide-react';

export const BillingBar: React.FC = () => {
  const { sessions } = useChatStore();
  const { config } = useConfigStore();

  const allMessages = useMemo(() => {
    return sessions.flatMap(s => s.messages);
  }, [sessions]);

  const totalCost = useMemo(() => {
    let total = 0;
    allMessages.forEach((msg) => {
      if (msg.role === 'assistant' && msg.usage) {
        // Use message.model if available, fallback to config.model
        const costStr = calculateCost(msg.usage, msg.model || config.model);
        if (costStr) {
          const cost = parseFloat(costStr.replace('￥', ''));
          total += cost;
        }
      }
    });
    return total;
  }, [allMessages, config.model]);

  const dateRange = useMemo(() => {
    if (allMessages.length === 0) {
      const today = new Date().toISOString().split('T')[0];
      return `${today} ~ ${today}`;
    }
    // Sort all messages by timestamp to find true range
    const sorted = [...allMessages].sort((a, b) => a.timestamp - b.timestamp);
    const start = new Date(sorted[0].timestamp).toISOString().split('T')[0];
    const end = new Date(sorted[sorted.length - 1].timestamp).toISOString().split('T')[0];
    return `${start} ~ ${end}`;
  }, [allMessages]);

  return (
    <div className="flex items-center gap-3 px-3 py-1 bg-blue-50/50 border border-blue-100 rounded-lg">
      <div className="flex items-center gap-1.5">
        <div className="p-1 bg-blue-100 text-blue-600 rounded">
          <TrendingUp className="w-3.5 h-3.5" />
        </div>
        <span className="text-xs text-gray-500 font-medium hidden sm:inline">本期消费</span>
      </div>
      
      <div className="text-sm font-semibold text-gray-900">
        ￥{totalCost.toFixed(6)}
      </div>

      <div className="h-3 w-px bg-gray-200 mx-1 hidden sm:block" />

      <div className="items-center gap-1.5 text-xs text-gray-400 hidden sm:flex">
        <Calendar className="w-3 h-3" />
        <span>{dateRange}</span>
      </div>
    </div>
  );
};
