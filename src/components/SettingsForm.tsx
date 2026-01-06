import React from 'react';
import { useConfigStore } from '../store/useConfigStore';
import { useChatStore } from '../store/useChatStore';
import { 
  Form, 
  Select, 
  Input, 
  Switch, 
  Button, 
  Typography, 
  Divider, 
  Tag, 
  Tooltip,
  InputNumber 
} from 'antd';
import { 
  ReloadOutlined, 
  InfoCircleOutlined, 
  SettingOutlined, 
  GlobalOutlined, 
  KeyOutlined, 
  LinkOutlined, 
  EditOutlined,
  BulbOutlined
} from '@ant-design/icons';
import { AVAILABLE_MODELS } from '../lib/constants';

const { Title, Text } = Typography;
const { TextArea } = Input;

export const SettingsForm: React.FC = () => {
  const { config, setConfig, resetConfig } = useConfigStore();
  const { sessions, currentSessionId, updateSessionModel, updateSessionSystemPrompt } = useChatStore();

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const effectiveModel = currentSession?.model || config.model;

  const handleModelSelect = (modelId: string) => {
    if (currentSessionId) {
      updateSessionModel(currentSessionId, modelId);
    }
    setConfig({ model: modelId });
  };

  const handleSystemPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (currentSessionId) {
      updateSessionSystemPrompt(currentSessionId, value);
    } else {
      setConfig({ systemPrompt: value });
    }
  };

  const modelOptions = AVAILABLE_MODELS.map(model => ({
    value: model.id,
    label: (
      <div className="flex flex-col py-1">
        <div className="flex items-center gap-2">
          <span className="font-bold">{model.name}</span>
          {model.isFree && <Tag color="green" bordered={false} className="m-0 text-[10px]">免费</Tag>}
        </div>
        <div className="text-[11px] text-gray-500 line-clamp-1">{model.description}</div>
        <div className="flex items-center justify-between mt-1">
          <Tag className="m-0 text-[10px] scale-90 origin-left">{model.provider}</Tag>
          {!model.isFree && (
            <div className="text-[10px] text-gray-400 font-mono scale-90 origin-right">
              {model.inputPrice} / {model.outputPrice}
            </div>
          )}
        </div>
      </div>
    ),
    searchText: model.name + model.provider + model.description
  }));

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between flex-shrink-0">
        <Title level={4} style={{ margin: 0 }} className="flex items-center gap-2">
          <SettingOutlined />
          设置
        </Title>
      </div>

      <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
        <Form layout="vertical">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-blue-600 rounded-full" />
              <Text strong>当前会话设置</Text>
              {!currentSessionId && (
                <Tag color="default" className="text-[10px]">未选定会话</Tag>
              )}
            </div>

            <Form.Item 
              label={<Text type="secondary" className="text-xs uppercase tracking-wider">对话模型</Text>}
            >
              <Select
                value={effectiveModel}
                onChange={handleModelSelect}
                options={modelOptions}
                disabled={!currentSessionId}
                dropdownStyle={{ maxHeight: 400 }}
                optionLabelProp="label"
                style={{ width: '100%' }}
                placeholder="请选择模型"
                optionFilterProp="searchText"
              />
            </Form.Item>

            <Form.Item
              label={
                <div className="flex items-center justify-between w-full">
                  <Text type="secondary" className="text-xs uppercase tracking-wider">系统提示词 (System Prompt)</Text>
                  {currentSessionId && (
                    <Button 
                      type="link" 
                      size="small" 
                      icon={<ReloadOutlined style={{ fontSize: 10 }} />}
                      onClick={() => updateSessionSystemPrompt(currentSessionId, config.systemPrompt || '')}
                      className="text-[10px] p-0 h-auto"
                    >
                      恢复默认
                    </Button>
                  )}
                </div>
              }
              extra={
                <Text type="secondary" italic className="text-[10px]">
                  {currentSessionId ? "修改将实时应用于当前选中的会话。" : "请在侧边栏选择一个会话进行配置。"}
                </Text>
              }
            >
              <TextArea
                value={currentSession?.systemPrompt || ""}
                onChange={handleSystemPromptChange}
                disabled={!currentSessionId}
                placeholder="例如：你是一个资深的 Python 开发者..."
                autoSize={{ minRows: 4, maxRows: 8 }}
                className="text-sm"
              />
            </Form.Item>
          </div>

          <Divider style={{ margin: '24px 0' }} />

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-gray-400 rounded-full" />
              <Text strong>全局默认设置</Text>
            </div>

            <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 mb-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1">
                  <Text strong className="text-blue-900">联网搜索增强</Text>
                  <Tooltip title="基于 Serper API 实时搜索网页内容">
                    <InfoCircleOutlined className="text-blue-400 text-xs" />
                  </Tooltip>
                </div>
                <Text type="secondary" italic className="text-[10px] text-blue-700/70 block">启用后模型将实时搜索网页内容</Text>
              </div>
              <Switch 
                checked={config.searchEnabled} 
                onChange={(checked) => setConfig({ searchEnabled: checked })}
                size="small"
              />
            </div>

            {config.searchEnabled && (
              <Form.Item 
                label={<Text type="secondary" className="text-xs uppercase tracking-wider flex items-center gap-1"><GlobalOutlined /> Serper API Key</Text>}
              >
                <Input.Password
                  value={config.searchApiKey}
                  onChange={(e) => setConfig({ searchApiKey: e.target.value })}
                  placeholder="Serper API Key..."
                />
              </Form.Item>
            )}

            <Form.Item 
              label={<Text type="secondary" className="text-xs uppercase tracking-wider flex items-center gap-1"><KeyOutlined /> API Key</Text>}
            >
              <Input.Password
                value={config.apiKey}
                onChange={(e) => setConfig({ apiKey: e.target.value })}
                placeholder="sk-..."
              />
            </Form.Item>

            <Form.Item 
              label={<Text type="secondary" className="text-xs uppercase tracking-wider flex items-center gap-1"><LinkOutlined /> Base URL</Text>}
            >
              <Input
                value={config.baseUrl}
                onChange={(e) => setConfig({ baseUrl: e.target.value })}
                placeholder="https://api.openai.com/v1"
              />
            </Form.Item>

            <Form.Item 
              label={<Text type="secondary" className="text-xs uppercase tracking-wider flex items-center gap-1"><EditOutlined /> 新会话默认提示词</Text>}
            >
              <TextArea
                value={config.systemPrompt}
                onChange={(e) => setConfig({ systemPrompt: e.target.value })}
                placeholder="新开启的会话将默认使用此提示词..."
                autoSize={{ minRows: 3, maxRows: 6 }}
              />
            </Form.Item>

            <Form.Item 
              label={
                <div className="flex items-center gap-1">
                  <BulbOutlined className="text-purple-500" />
                  <Text type="secondary" className="text-xs uppercase tracking-wider">提示词优化模型</Text>
                </div>
              }
              extra={<Text type="secondary" italic className="text-[10px]">用于“优化提示词”功能的专用模型。</Text>}
            >
              <Select
                value={config.optimizerModelId || AVAILABLE_MODELS[0].id}
                onChange={(value) => setConfig({ optimizerModelId: value })}
                options={modelOptions}
                optionLabelProp="label"
                style={{ width: '100%' }}
                optionFilterProp="searchText"
              />
            </Form.Item>

            <Divider style={{ margin: '24px 0' }} />

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-4 bg-purple-400 rounded-full" />
                <Text strong>上下文优化设置</Text>
                <Tooltip title="长对话场景下，通过智能压缩或滑动窗口减少 Token 消耗并避免超出限制。">
                  <InfoCircleOutlined className="text-gray-400 text-xs" />
                </Tooltip>
              </div>

              <Form.Item 
                label={<Text type="secondary" className="text-xs uppercase tracking-wider">优化策略</Text>}
                extra={<Text type="secondary" italic className="text-[10px]">
                  {config.contextStrategy === 'auto' ? "智能摘要：自动总结中间对话，保留长期记忆。" : 
                  config.contextStrategy === 'sliding' ? "滑动窗口：仅保留最近的原始消息。" : "全量：发送所有历史消息（可能超出限制）。"}
                </Text>}
              >
                <Select
                  value={config.contextStrategy}
                  onChange={(value) => setConfig({ contextStrategy: value as any })}
                  options={[
                    { value: 'none', label: '全量发送 (None)' },
                    { value: 'sliding', label: '滑动窗口 (Sliding Window)' },
                    { value: 'auto', label: '智能摘要 (Auto Summary)' },
                  ]}
                  style={{ width: '100%' }}
                />
              </Form.Item>

              {config.contextStrategy !== 'none' && (
                <div className="space-y-4">
                  <Form.Item 
                    label={<Text type="secondary" className="text-xs uppercase tracking-wider">保留最近消息数</Text>}
                    style={{ marginBottom: 0 }}
                  >
                    <InputNumber
                      min={1}
                      max={50}
                      value={config.maxRecentMessages}
                      onChange={(value) => setConfig({ maxRecentMessages: value || 10 })}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>

                  {config.contextStrategy === 'auto' && (
                    <Form.Item 
                      label={<Text type="secondary" className="text-xs uppercase tracking-wider">增量总结间隔</Text>}
                      style={{ marginBottom: 0 }}
                    >
                      <InputNumber
                        min={5}
                        max={50}
                        value={config.summaryUpdateInterval}
                        onChange={(value) => setConfig({ summaryUpdateInterval: value || 10 })}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  )}
                </div>
              )}
            </div>
          </div>
        </Form>
      </div>

      <div className="p-4 border-t border-gray-50 bg-gray-50/50 flex-shrink-0">
        <Button 
          block 
          icon={<ReloadOutlined />} 
          onClick={resetConfig}
          danger
        >
          重置全局配置
        </Button>
      </div>
    </div>
  );
};
