import React, { useState, useRef, useEffect } from 'react';
import { useConfigStore } from '../store/useConfigStore';
import { useChatStore } from '../store/useChatStore';
import { RotateCcw, ChevronDown, Check } from 'lucide-react';
import { AVAILABLE_MODELS, ModelInfo } from '../lib/constants';
import { cn } from '../lib/utils';

export const SettingsForm: React.FC = () => {
  const { config, setConfig, resetConfig } = useConfigStore();
  const { sessions, currentSessionId, updateSessionModel, updateSessionSystemPrompt } = useChatStore();
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [hoveredModel, setHoveredModel] = useState<ModelInfo | null>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const effectiveModel = currentSession?.model || config.model;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig({ [name]: value });
  };

  const handleModelSelect = (modelId: string) => {
    if (currentSessionId) {
      updateSessionModel(currentSessionId, modelId);
    }
    setConfig({ model: modelId });
    setIsModelOpen(false);
  };

  const handleSystemPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (currentSessionId) {
      updateSessionSystemPrompt(currentSessionId, value);
    } else {
      setConfig({ systemPrompt: value });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setIsModelOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const currentModel = AVAILABLE_MODELS.find(m => m.id === effectiveModel) || {
    id: effectiveModel,
    name: effectiveModel,
    description: 'Custom model',
    provider: 'Unknown'
  };

  return (
    <div className="space-y-6 p-4 bg-white rounded-lg shadow-sm border border-gray-100 h-full flex flex-col">
      <div className="flex items-center justify-between flex-shrink-0">
        <h2 className="text-xl font-semibold text-gray-800">设置</h2>
      </div>

      <div className="space-y-8 flex-1 overflow-y-auto pr-1">
        {/* 会话级设置 */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
            <div className="w-1 h-4 bg-blue-600 rounded-full" />
            <h3 className="text-sm font-bold text-gray-900">当前会话设置</h3>
            {!currentSessionId && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">未选定会话</span>}
          </div>

          <div className="relative" ref={modelDropdownRef}>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
              对话模型
            </label>
            <button
              type="button"
              disabled={!currentSessionId}
              onClick={() => setIsModelOpen(!isModelOpen)}
              className={cn(
                "w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm flex items-center justify-between text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors",
                !currentSessionId && "opacity-50 cursor-not-allowed bg-gray-50"
              )}
            >
              <span className="truncate text-gray-900 font-medium">{currentModel.name}</span>
              <ChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform", isModelOpen && "transform rotate-180")} />
            </button>

            {isModelOpen && (
              <div className="absolute z-50 mt-1 w-full bg-white shadow-xl rounded-md border border-gray-200 flex flex-col max-h-80 overflow-hidden">
                <div className="overflow-y-auto py-1">
                  {AVAILABLE_MODELS.map((model) => (
                    <div
                      key={model.id}
                      className="group relative px-3 py-2 cursor-pointer hover:bg-blue-50 flex items-center justify-between transition-colors"
                      onClick={() => handleModelSelect(model.id)}
                      onMouseEnter={() => setHoveredModel(model)}
                      onMouseLeave={() => setHoveredModel(null)}
                    >
                      <div className="flex flex-col truncate flex-1 mr-2">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-sm font-medium truncate", model.id === effectiveModel ? "text-blue-600" : "text-gray-900")}>
                            {model.name}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs mt-0.5">
                          <span className="text-gray-500 truncate mr-2">
                            {model.provider}
                          </span>
                        </div>
                      </div>
                      {model.id === effectiveModel && (
                        <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Description Footer */}
                <div className="p-3 bg-gray-50 border-t border-gray-100 rounded-b-md text-xs">
                   <div className="flex items-center justify-between mb-1">
                      <div className="font-medium text-gray-700">
                         {(hoveredModel || currentModel).name}
                      </div>
                   </div>
                   <div className="text-gray-500 leading-relaxed">
                      {(hoveredModel || currentModel).description}
                   </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="systemPrompt" className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                系统提示词 (System Prompt)
              </label>
              {currentSessionId && (
                <button
                  type="button"
                  onClick={() => updateSessionSystemPrompt(currentSessionId, config.systemPrompt)}
                  className="text-[10px] text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors font-medium"
                  title="恢复为全局默认提示词"
                >
                  <RotateCcw className="w-3 h-3" />
                  恢复默认
                </button>
              )}
            </div>
            <textarea
              id="systemPrompt"
              name="systemPrompt"
              disabled={!currentSessionId}
              value={currentSession?.systemPrompt || ""}
              onChange={handleSystemPromptChange}
              placeholder="例如：你是一个资深的 Python 开发者..."
              className={cn(
                "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors min-h-[120px] resize-none",
                !currentSessionId && "opacity-50 cursor-not-allowed bg-gray-50 placeholder:text-gray-300"
              )}
            />
            <p className="mt-1 text-[10px] text-gray-400 italic">
              {currentSessionId ? "修改将实时应用于当前选中的会话。" : "请在侧边栏选择一个会话进行配置。"}
            </p>
          </div>
        </section>

        {/* 全局设置 */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
            <div className="w-1 h-4 bg-gray-400 rounded-full" />
            <h3 className="text-sm font-bold text-gray-900">全局默认设置</h3>
          </div>

          <div>
            <label htmlFor="apiKey" className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
              API Key
            </label>
            <input
              type="password"
              id="apiKey"
              name="apiKey"
              value={config.apiKey}
              onChange={handleChange}
              placeholder="sk-..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
            />
          </div>

          <div>
            <label htmlFor="baseUrl" className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
              Base URL
            </label>
            <input
              type="text"
              id="baseUrl"
              name="baseUrl"
              value={config.baseUrl}
              onChange={handleChange}
              placeholder="https://api.openai.com/v1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
            />
          </div>

          <div>
            <label htmlFor="defaultSystemPrompt" className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
              新会话默认提示词
            </label>
            <textarea
              id="defaultSystemPrompt"
              name="systemPrompt"
              value={config.systemPrompt}
              onChange={(e) => setConfig({ systemPrompt: e.target.value })}
              placeholder="新开启的会话将默认使用此提示词..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors min-h-[80px] resize-none"
            />
          </div>
        </section>
      </div>

      <div className="pt-4 flex gap-3 flex-shrink-0 border-t border-gray-100">
        <button
          onClick={resetConfig}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          重置全局配置
        </button>
      </div>
    </div>
  );
};
