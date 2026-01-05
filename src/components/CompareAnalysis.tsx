import React, { useMemo } from 'react';
import { Modal, Row, Col, Card, Statistic, Typography, Divider, Empty, Space, Tag } from 'antd';
import { 
  TrophyOutlined, 
  ThunderboltOutlined, 
  DollarOutlined, 
  BarChartOutlined,
  DashboardOutlined,
  FieldTimeOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { Column, Bar } from '@ant-design/plots';
import { CompareResponse, MessageStatus } from '../types';
import { calculateCost } from '../lib/utils';

const { Title, Text } = Typography;

interface CompareAnalysisProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModelIds: string[];
  responses: Record<string, CompareResponse>;
}

export const CompareAnalysis: React.FC<CompareAnalysisProps> = ({
  isOpen,
  onClose,
  selectedModelIds,
  responses
}) => {
  const completedResponses = useMemo(() => {
    return Object.values(responses).filter(r => r.status === MessageStatus.SENT);
  }, [responses]);

  const metrics = useMemo(() => {
    if (completedResponses.length === 0) return null;

    let mvp: CompareResponse | null = null;
    let fastest: CompareResponse | null = null;
    let bestValue: CompareResponse | null = null;
    let totalCost = 0;
    let totalTokens = 0;

    completedResponses.forEach(r => {
      // MVP (Highest Score > 0)
      if (r.score && r.score > 0) {
        if (!mvp || (r.score > (mvp.score || 0))) mvp = r;
      }
      
      // Fastest (Lowest Latency > 0)
      if (r.latency && r.latency > 0) {
        if (!fastest || (r.latency < (fastest.latency || Infinity))) fastest = r;
      }
      
      // Best Value (Score / Cost)
      const rCostStr = r.usage ? calculateCost(r.usage, r.modelId) : null;
      const rCost = rCostStr ? parseFloat(rCostStr.replace('￥', '')) : 0.000001;
      
      if (r.score && r.score > 0) {
        if (!bestValue) {
          bestValue = r;
        } else {
          const bvCostStr = bestValue.usage ? calculateCost(bestValue.usage, bestValue.modelId) : null;
          const bvCost = bvCostStr ? parseFloat(bvCostStr.replace('￥', '')) : 0.000001;
          if ((r.score / rCost) > ((bestValue.score || 0) / bvCost)) bestValue = r;
        }
      }

      if (rCostStr) totalCost += parseFloat(rCostStr.replace('￥', ''));
      if (r.usage) totalTokens += r.usage.total_tokens;
    });

    // Fallbacks if no scores/latency found
    if (!mvp) mvp = completedResponses[0];
    if (!fastest) fastest = completedResponses[0];
    if (!bestValue) bestValue = completedResponses[0];

    return { mvp, fastest, bestValue, totalCost, totalTokens };
  }, [completedResponses]);

  // Unevaluated models
  const unevaluated = useMemo(() => {
    return completedResponses.filter(r => !r.score || r.score === 0);
  }, [completedResponses]);

  // Chart Data: Cost vs Score
  const costScoreData = completedResponses.map(r => {
    const costStr = r.usage ? calculateCost(r.usage, r.modelId) : '0';
    return {
      model: r.modelName,
      cost: parseFloat(costStr?.replace('￥', '') || '0') * 1000, // Scale for visibility (cost per 1k runs)
      score: r.score || 0,
    };
  }).sort((a, b) => b.score - a.score);

  const costScoreConfig = {
    data: costScoreData,
    xField: 'model',
    yField: 'score',
    colorField: 'model',
    label: {
      text: 'score',
      position: 'inside',
    },
    axis: {
      y: { title: '评分' }
    },
    tooltip: {
      items: [
        { name: '评分', field: 'score' },
        { name: '预估费用(x1000)', field: 'cost', valueFormatter: (v: number) => `￥${(v/1000).toFixed(6)}` }
      ]
    }
  };

  // Chart Data: Throughput (Tokens/s)
  const throughputData = completedResponses.map(r => ({
    model: r.modelName,
    tps: r.usage && r.latency ? (r.usage.completion_tokens / (r.latency / 1000)) : 0,
  })).sort((a, b) => b.tps - a.tps);

  const throughputConfig = {
    data: throughputData,
    xField: 'model',
    yField: 'tps',
    label: {
      text: (d: any) => `${d.tps.toFixed(1)} t/s`,
      position: 'right',
    },
    axis: {
      x: { title: '模型' },
      y: { title: '每秒产出 Token 数' },
    },
  };

  return (
    <Modal
      title={
        <Space>
          <BarChartOutlined />
          <span>模型效能多维分析报告</span>
        </Space>
      }
      open={isOpen}
      onCancel={onClose}
      width={1000}
      footer={null}
      centered
      styles={{ body: { padding: '24px', backgroundColor: '#f8fafc', maxHeight: '80vh', overflowY: 'auto' } }}
    >
      {completedResponses.length === 0 ? (
        <Empty description="暂无已完成的对比数据，请先开始对话并等待生成结束" />
      ) : (
        <div className="space-y-8">
          {/* Metrics Overview */}
          <Row gutter={[16, 16]} style={{ display: 'flex' }}>
            <Col span={6} style={{ display: 'flex' }}>
              <Card bordered={false} className="shadow-sm w-full h-full flex flex-col" styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}>
                <Statistic
                  title="最佳表现 (MVP)"
                  value={metrics?.mvp.modelName}
                  prefix={<TrophyOutlined className="text-yellow-500" />}
                  valueStyle={{ fontSize: '16px', fontWeight: 'bold' }}
                />
                <div className="mt-2"><Tag color="gold">得分: {metrics?.mvp.score}</Tag></div>
              </Card>
            </Col>
            <Col span={6} style={{ display: 'flex' }}>
              <Card bordered={false} className="shadow-sm w-full h-full flex flex-col" styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}>
                <Statistic
                  title="速度之王"
                  value={metrics?.fastest.modelName}
                  prefix={<ThunderboltOutlined className="text-blue-500" />}
                  valueStyle={{ fontSize: '16px', fontWeight: 'bold' }}
                />
                <div className="mt-2"><Tag color="blue">耗时: {((metrics?.fastest.latency || 0) / 1000).toFixed(2)}s</Tag></div>
              </Card>
            </Col>
            <Col span={6} style={{ display: 'flex' }}>
              <Card bordered={false} className="shadow-sm w-full h-full flex flex-col" styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}>
                <Statistic
                  title="性价比之选"
                  value={metrics?.bestValue.modelName}
                  prefix={<DollarOutlined className="text-green-500" />}
                  valueStyle={{ fontSize: '16px', fontWeight: 'bold' }}
                />
                <div className="mt-2"><Tag color="green">效能最优</Tag></div>
              </Card>
            </Col>
            <Col span={6} style={{ display: 'flex' }}>
              <Card bordered={false} className="shadow-sm w-full h-full flex flex-col" styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}>
                <Statistic
                  title="总计消耗"
                  value={metrics?.totalCost.toFixed(4)}
                  prefix="￥"
                  valueStyle={{ fontSize: '20px', fontWeight: 'bold' }}
                />
                <div className="text-[10px] text-gray-400 mt-1">共计 {metrics?.totalTokens} Tokens</div>
              </Card>
            </Col>
          </Row>

          <Divider orientation="left">质量表现对比</Divider>
          <Card bordered={false} className="shadow-sm">
            <div className="h-[300px]">
              <Column {...costScoreConfig} />
            </div>
          </Card>

          <Divider orientation="left">产出流畅度 (Tokens/s)</Divider>
          <Card bordered={false} className="shadow-sm">
            <div className="h-[300px]">
              <Bar {...throughputConfig} />
            </div>
          </Card>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <Title level={5} className="flex items-center gap-2">
              <DashboardOutlined className="text-blue-600" />
              分析建议
            </Title>
            <div className="text-sm text-blue-800 space-y-2">
              <p>1. <strong>模型选择</strong>：基于本次对比，建议在追求质量时优先选择 <strong>{metrics?.mvp.modelName}</strong>{metrics?.mvp.score === 0 ? ' (等待评分)' : ''}，在追求响应速度时使用 <strong>{metrics?.fastest.modelName}</strong>。</p>
              <p>2. <strong>成本优化</strong>：如果 <strong>{metrics?.bestValue.modelName}</strong> 的得分与 MVP 模型接近，但成本显著更低，建议在生产环境中作为主力模型。</p>
              <p>3. <strong>流畅度参考</strong>：<strong>{throughputData[0]?.model || '未知'}</strong> 的输出最为流畅，适合对实时打字机效果要求较高的交互场景。</p>
            </div>
          </div>

          {unevaluated.length > 0 && (
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
              <Title level={5} className="flex items-center gap-2 text-orange-700">
                <WarningOutlined />
                匹配说明
              </Title>
              <Text type="secondary" className="text-xs block mb-2">
                以下模型在裁判评价中未被成功匹配，可能导致图表数据不全：
              </Text>
              <Space wrap>
                {unevaluated.map(r => (
                  <Tag key={r.modelId} color="orange">{r.modelName}</Tag>
                ))}
              </Space>
              <Text type="secondary" className="text-[10px] block mt-2 italic">
                提示：裁判模型有时会缩写模型名称，已尝试模糊匹配，如仍失败请检查 Console 日志。
              </Text>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
