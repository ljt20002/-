import React, { useMemo } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useConfigStore } from '../store/useConfigStore';
import { calculateCost } from '../lib/utils';
import { Calendar, TrendingUp } from 'lucide-react';

export const BillingBar: React.FC = () => {
  const { messages } = useChatStore();
  const { config } = useConfigStore();

  const totalCost = useMemo(() => {
    let total = 0;
    messages.forEach((msg) => {
      if (msg.role === 'assistant' && msg.usage) {
        // Use the current model for calculation as a fallback, 
        // ideally each message should store its model but we use config.model for now as per previous implementation
        const costStr = calculateCost(msg.usage, config.model);
        if (costStr) {
          const cost = parseFloat(costStr.replace('￥', ''));
          total += cost;
        }
      }
    });
    return total;
  }, [messages, config.model]);

  // Mock date range for now, or use actual date range of messages
  const dateRange = useMemo(() => {
    if (messages.length === 0) {
      const today = new Date().toISOString().split('T')[0];
      return `${today} ~ ${today}`;
    }
    const start = new Date(messages[0].timestamp).toISOString().split('T')[0];
    const end = new Date(messages[messages.length - 1].timestamp).toISOString().split('T')[0];
    return `${start} ~ ${end}`;
  }, [messages]);

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-blue-50/50 border border-blue-100 rounded-lg mx-4 mt-4">
      <div className="flex items-center gap-1.5">
        <div className="p-1 bg-blue-100 text-blue-600 rounded">
          <TrendingUp className="w-3.5 h-3.5" />
        </div>
        <span className="text-xs text-gray-500 font-medium">本期消费</span>
      </div>
      
      <div className="text-sm font-semibold text-gray-900">
        ￥{totalCost.toFixed(6)}
      </div>

      <div className="h-3 w-px bg-gray-200 mx-1" />

      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <Calendar className="w-3 h-3" />
        <span>{dateRange}</span>
      </div>
    </div>
  );
};
