import React, { useMemo } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useConfigStore } from '../store/useConfigStore';
import { calculateCost } from '../lib/utils';
import { RiseOutlined, CalendarOutlined } from '@ant-design/icons';
import { Space, Typography, Tag } from 'antd';

const { Text } = Typography;

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
    const sorted = [...allMessages].sort((a, b) => a.timestamp - b.timestamp);
    const start = new Date(sorted[0].timestamp).toISOString().split('T')[0];
    const end = new Date(sorted[sorted.length - 1].timestamp).toISOString().split('T')[0];
    return `${start} ~ ${end}`;
  }, [allMessages]);

  return (
    <div className="flex items-center gap-3 px-3 py-1 bg-blue-50/50 border border-blue-100 rounded-lg">
      <Space size="small">
        <Tag color="blue" icon={<RiseOutlined />} className="m-0 border-none">
          <span className="hidden sm:inline">本期消费</span>
        </Tag>
        <Text strong className="text-sm">
          ￥{totalCost.toFixed(6)}
        </Text>
      </Space>

      <div className="h-3 w-px bg-gray-200 mx-1 hidden sm:block" />

      <Space size={4} className="hidden sm:flex text-gray-400">
        <CalendarOutlined style={{ fontSize: 12 }} />
        <Text type="secondary" style={{ fontSize: 10 }}>{dateRange}</Text>
      </Space>
    </div>
  );
};
