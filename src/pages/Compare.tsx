import React, { useState } from 'react';
import { useCompareStore } from '../store/useCompareStore';
import { useConfigStore } from '../store/useConfigStore';
import { AVAILABLE_MODELS, JUDGE_PERSPECTIVES } from '../lib/constants';
import { ChatInput } from '../components/ChatInput';
import { MessageItem, MarkdownText } from '../components/MessageItem';
import { SettingsDrawer } from '../components/SettingsDrawer';
import { CompareAnalysis } from '../components/CompareAnalysis';
import { MessageStatus } from '../types';
import { Plus, Copy, Trash2, LayoutGrid, LayoutList, CheckCircle2, AlertCircle, Loader2, Menu, Settings as SettingsIcon, Wand2, Gavel, Sparkles, ChevronDown, Star, CheckCircle, XCircle, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { Tooltip, Progress, Space, Typography, Badge, Switch, Select } from 'antd';
import { ClockCircleOutlined, BarChartOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface ComparePageProps {
  onToggleSidebar: () => void;
}

const ComparisonProgressBar: React.FC<{ 
  selectedModelIds: string[], 
  responses: Record<string, any>,
  isComparing: boolean 
}> = ({ selectedModelIds, responses, isComparing }) => {
  if (selectedModelIds.length === 0) return null;

  // 按完成顺序排序：已完成的（SENT/ERROR）按 finishedAt 排序，然后是 RECEIVING，最后是 PENDING
  const sortedIds = [...selectedModelIds].sort((a, b) => {
    const respA = responses[a];
    const respB = responses[b];
    const statusA = respA?.status || MessageStatus.PENDING;
    const statusB = respB?.status || MessageStatus.PENDING;

    // 优先级函数
    const getPriority = (status: MessageStatus) => {
      switch (status) {
        case MessageStatus.SENT:
        case MessageStatus.ERROR: return 1;
        case MessageStatus.RECEIVING: return 2;
        default: return 3;
      }
    };

    const prioA = getPriority(statusA);
    const prioB = getPriority(statusB);

    if (prioA !== prioB) return prioA - prioB;

    // 同为已完成时，按时间先后
    if (prioA === 1) {
      return (respA?.finishedAt || 0) - (respB?.finishedAt || 0);
    }

    return 0;
  });

  return (
    <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center gap-3 shadow-sm sticky top-0 z-20">
      <div className="flex-shrink-0 flex items-center gap-2">
        <Text strong size="small" type="secondary" className="text-[10px] uppercase tracking-wider">生成进度</Text>
        <Badge 
          count={`${Object.values(responses).filter(r => r.status === MessageStatus.SENT || r.status === MessageStatus.ERROR).length}/${selectedModelIds.length}`} 
          style={{ backgroundColor: '#52c41a', fontSize: '10px' }}
        />
      </div>
      
      <div className="flex-1 h-3 flex gap-1 bg-gray-100 rounded-full overflow-hidden p-0.5">
        {sortedIds.map(id => {
          const resp = responses[id];
          const status = resp?.status || MessageStatus.PENDING;
          const model = AVAILABLE_MODELS.find(m => m.id === id);
          
          let colorClass = "bg-gray-300";
          let icon = <Clock className="w-3 h-3" />;
          let statusText = "等待中";

          if (status === MessageStatus.RECEIVING) {
            colorClass = "bg-blue-500 animate-pulse";
            icon = <Loader2 className="w-3 h-3 animate-spin" />;
            statusText = "正在生成...";
          } else if (status === MessageStatus.SENT) {
            colorClass = "bg-green-500";
            icon = <CheckCircle className="w-3 h-3 text-white" />;
            statusText = "已完成";
          } else if (status === MessageStatus.ERROR) {
            colorClass = "bg-red-500";
            icon = <XCircle className="w-3 h-3 text-white" />;
            statusText = "失败: " + (resp?.error || "未知错误");
          }

          return (
            <Tooltip 
              key={id} 
              title={
                <div className="p-1">
                  <div className="font-bold flex items-center gap-2 mb-1">
                    {model?.name || id}
                  </div>
                  <div className="text-[10px] flex items-center gap-1 opacity-90">
                    {icon} {statusText}
                  </div>
                  {(status === MessageStatus.SENT || status === MessageStatus.ERROR) && resp?.latency && (
                    <div className="mt-1 pt-1 border-t border-white/20 text-[10px] flex items-center gap-1">
                      <ClockCircleOutlined style={{ fontSize: 10 }} />
                      响应耗时: {(resp.latency / 1000).toFixed(2)}s
                    </div>
                  )}
                  {resp?.usage && (
                    <div className="mt-0.5 text-[10px] opacity-80">
                      Tokens: {resp.usage.total_tokens}
                    </div>
                  )}
                </div>
              }
            >
              <div 
                className={cn(
                  "flex-1 rounded-full transition-all duration-500 relative group overflow-hidden cursor-help",
                  colorClass
                )}
              >
                <span className="absolute inset-0 flex items-center justify-center text-[8px] text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity truncate px-1">
                  {model?.name || id}
                </span>
              </div>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};

const Compare: React.FC<ComparePageProps> = ({ onToggleSidebar }) => {
  const { config } = useConfigStore();
  const {
    selectedModelIds,
    responses,
    isComparing,
    question,
    activeQuestion,
    addModel,
    removeModel,
    setQuestion,
    startComparison,
    clearComparison,
    abortComparison,
    judgeModelId,
    perspective,
    isGeneratingQuestion,
    isEvaluating,
    isJudgeEnabled,
    setJudgeModelId,
    setPerspective,
    setIsJudgeEnabled,
    generateQuestion,
    evaluateResponses
  } = useCompareStore();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showJudgeSelector, setShowJudgeSelector] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showJudgeConfig, setShowJudgeConfig] = useState(true);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const judgeModel = AVAILABLE_MODELS.find(m => m.id === judgeModelId);

  const handleSend = (content: string) => {
    if (!config.apiKey) {
      alert('请先在设置中配置 API Key');
      setIsSettingsOpen(true);
      return;
    }
    setQuestion(content);
    startComparison();
  };

  const handleGenerateQuestion = () => {
    if (!config.apiKey) {
      alert('请先在设置中配置 API Key');
      setIsSettingsOpen(true);
      return;
    }
    if (!perspective.trim()) {
      alert('请先输入比较维度');
      return;
    }
    generateQuestion();
  };

  const handleEvaluate = () => {
    if (!config.apiKey) {
      alert('请先在设置中配置 API Key');
      setIsSettingsOpen(true);
      return;
    }
    evaluateResponses();
  };

  const handleCopyAll = () => {
    const text = selectedModelIds
      .map(id => {
        const resp = responses[id];
        if (!resp) return '';
        return `【${resp.modelName}】\n${resp.content}\n`;
      })
      .filter(Boolean)
      .join('\n---\n\n');

    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            模型对比
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
            title={viewMode === 'grid' ? '列表视图' : '网格视图'}
          >
            {viewMode === 'grid' ? <LayoutList className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowModelSelector(!showModelSelector)}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              添加模型
            </button>
            
            {showModelSelector && (
              <>
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setShowModelSelector(false)} 
                />
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-30 max-h-96 overflow-y-auto p-2">
                  <div className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    选择模型
                  </div>
                  {AVAILABLE_MODELS.map(model => (
                    <button
                      key={model.id}
                      onClick={() => {
                        addModel(model.id);
                        setShowModelSelector(false);
                      }}
                      disabled={selectedModelIds.includes(model.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between group",
                        selectedModelIds.includes(model.id)
                          ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                          : "hover:bg-blue-50 text-gray-700"
                      )}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{model.name}</span>
                        <span className="text-[10px] text-gray-400">{model.provider}</span>
                      </div>
                      {selectedModelIds.includes(model.id) && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setShowAnalysis(true)}
            disabled={
              selectedModelIds.length === 0 || 
              isComparing || 
              isEvaluating || 
              isGeneratingQuestion ||
              !selectedModelIds.every(id => responses[id]?.status === MessageStatus.SENT || responses[id]?.status === MessageStatus.ERROR)
            }
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all text-sm font-medium border border-indigo-100 disabled:opacity-50"
          >
            <BarChartOutlined style={{ fontSize: 16 }} />
            分析报告
          </button>

          <button
            onClick={handleCopyAll}
            disabled={selectedModelIds.length === 0 || isComparing}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm font-medium border",
              copied 
                ? "bg-green-50 text-green-600 border-green-200" 
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 disabled:opacity-50"
            )}
          >
            <Copy className="w-4 h-4" />
            {copied ? '已复制' : '一键复制'}
          </button>
          
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full" 
            title="设置"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>

          <button
            onClick={clearComparison}
            className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
            title="清空对比"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Judge Configuration */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex flex-wrap items-center gap-4 shadow-sm z-[5]">
        <div className="flex items-center gap-3 mr-2">
            <div className="flex items-center gap-2">
                <Gavel className={cn("w-4 h-4", isJudgeEnabled ? "text-blue-600" : "text-gray-400")} />
                <span className={cn("text-sm font-medium", isJudgeEnabled ? "text-gray-800" : "text-gray-400")}>AI 裁判模式</span>
                <Switch 
                    size="small" 
                    checked={isJudgeEnabled} 
                    onChange={setIsJudgeEnabled}
                />
            </div>
            {isJudgeEnabled && (
                <button 
                    onClick={() => setShowJudgeConfig(!showJudgeConfig)}
                    className={cn(
                        "p-1 rounded-md hover:bg-gray-100 transition-colors",
                        showJudgeConfig && "bg-gray-100"
                    )}
                >
                    <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", showJudgeConfig && "rotate-180")} />
                </button>
            )}
        </div>

        {isJudgeEnabled && showJudgeConfig && (
            <div className="flex flex-wrap items-center gap-4 py-2 w-full lg:w-auto animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="relative">
                    <button
                        onClick={() => setShowJudgeSelector(!showJudgeSelector)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-xs font-medium min-w-[140px] justify-between"
                    >
                        <span className="truncate">{judgeModel?.name || '选择裁判'}</span>
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                    </button>
                    
                    {showJudgeSelector && (
                        <>
                            <div className="fixed inset-0 z-20" onClick={() => setShowJudgeSelector(false)} />
                            <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-30 max-h-64 overflow-y-auto p-1">
                                {AVAILABLE_MODELS.map(model => (
                                    <button
                                        key={model.id}
                                        onClick={() => {
                                            setJudgeModelId(model.id);
                                            setShowJudgeSelector(false);
                                        }}
                                        className={cn(
                                            "w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between",
                                            judgeModelId === model.id ? "bg-blue-50 text-blue-600" : "hover:bg-gray-50 text-gray-700"
                                        )}
                                    >
                                        <span className="truncate">{model.name}</span>
                                        {judgeModelId === model.id && <CheckCircle2 className="w-3 h-3" />}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2 py-0.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">维度:</span>
                    <Select
                        size="small"
                        variant="borderless"
                        value={perspective}
                        onChange={setPerspective}
                        className="text-xs min-w-[100px]"
                        options={JUDGE_PERSPECTIVES.map(p => ({ label: p, value: p }))}
                        dropdownStyle={{ minWidth: '150px' }}
                    />
                </div>

                <button
                    onClick={handleGenerateQuestion}
                    disabled={isGeneratingQuestion || isComparing}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-xs font-medium disabled:opacity-50"
                >
                    {isGeneratingQuestion ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                    AI 出题
                </button>

                <button
                    onClick={handleEvaluate}
                    disabled={isEvaluating || isComparing || selectedModelIds.length === 0 || !Object.values(responses).some(r => r.status === MessageStatus.SENT)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors text-xs font-medium disabled:opacity-50"
                >
                    {isEvaluating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    综合评价
                </button>
            </div>
        )}
      </div>

      <ComparisonProgressBar 
        selectedModelIds={selectedModelIds} 
        responses={responses} 
        isComparing={isComparing} 
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        {selectedModelIds.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
              <Plus className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-lg">请点击上方按钮添加要对比的模型</p>
          </div>
        ) : (
          <div className={cn(
            "gap-6",
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3" 
              : "flex flex-col space-y-6 max-w-5xl mx-auto"
          )}>
            {selectedModelIds.map(id => {
              const resp = responses[id];
              const model = AVAILABLE_MODELS.find(m => m.id === id);
              
              return (
                <div 
                  key={id} 
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[500px] transition-all hover:shadow-md overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex flex-col overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800 truncate">{model?.name || id}</span>
                        {isJudgeEnabled && resp?.score !== undefined && (
                            <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-[10px] font-bold">
                                <Star className="w-2.5 h-2.5 fill-current" />
                                {resp.score}
                            </div>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 uppercase tracking-tight">{model?.provider}</span>
                    </div>
                    <button
                      onClick={() => removeModel(id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {isJudgeEnabled && resp?.evaluation && (
                        <div className="mb-4 p-4 bg-orange-50/50 border border-orange-100 rounded-2xl text-xs text-orange-900 shadow-sm">
                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-orange-100">
                                <Sparkles className="w-4 h-4 text-orange-500" />
                                <span className="font-bold">裁判综合评价</span>
                            </div>
                            <div className="prose prose-xs max-w-none prose-orange">
                                <MarkdownText content={resp.evaluation} />
                            </div>
                        </div>
                    )}
                    {!resp || (!resp.content && resp.status === MessageStatus.PENDING) ? (
                      <div className="h-full flex items-center justify-center text-gray-300 text-sm italic">
                        等待提问...
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* 模拟一条 User 消息展示问题 */}
                        <div className="flex justify-end">
                            <div className="max-w-[90%] bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2 text-sm shadow-sm">
                                {activeQuestion}
                            </div>
                        </div>
                        
                        {/* 助手消息 */}
                        <MessageItem
                          message={{
                            id: `resp-${id}`,
                            role: 'assistant',
                            content: resp.content,
                            timestamp: Date.now(),
                            status: resp.status,
                            error: resp.error,
                            model: id,
                            latency: resp.latency
                          }}
                        />
                      </div>
                    )}
                  </div>
                  
                  {resp?.status === MessageStatus.RECEIVING && (
                    <div className="px-4 py-2 bg-blue-50/50 border-t border-blue-100 flex items-center gap-2">
                      <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                      <span className="text-[10px] font-medium text-blue-600 uppercase">正在生成...</span>
                    </div>
                  )}
                  {resp?.status === MessageStatus.ERROR && (
                    <div className="px-4 py-2 bg-red-50 border-t border-red-100 flex items-center gap-2">
                      <AlertCircle className="w-3 h-3 text-red-500" />
                      <span className="text-[10px] font-medium text-red-600 uppercase">生成失败</span>
                    </div>
                  )}
                  {resp?.usage && (
                    <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-400 flex justify-between items-center">
                      <div className="flex gap-2">
                        <span>Tokens: {resp.usage.total_tokens}</span>
                        {resp.latency && <span>Time: {(resp.latency / 1000).toFixed(2)}s</span>}
                      </div>
                      <span>{resp.status === MessageStatus.SENT ? '已完成' : ''}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Input */}
      <div className="mt-auto">
        <ChatInput
          value={question}
          onChange={setQuestion}
          onSend={handleSend}
          onClear={() => {
            setQuestion('');
            clearComparison();
          }}
          onAbort={abortComparison}
          isLoading={isComparing}
          disabled={selectedModelIds.length === 0}
          supportVision={false} // 模型对比暂时不支持图片
        />
      </div>

      <SettingsDrawer 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      <CompareAnalysis
        isOpen={showAnalysis}
        onClose={() => setShowAnalysis(false)}
        selectedModelIds={selectedModelIds}
        responses={responses}
      />
    </div>
  );
};

export default Compare;
