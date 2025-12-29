import React, { useState, useRef, useEffect } from 'react';
import { useConfigStore } from '../store/useConfigStore';
import { RotateCcw, ChevronDown, Check, Info } from 'lucide-react';
import { AVAILABLE_MODELS, ModelInfo } from '../lib/constants';
import { cn } from '../lib/utils';

export const SettingsForm: React.FC = () => {
  const { config, setConfig, resetConfig } = useConfigStore();
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [hoveredModel, setHoveredModel] = useState<ModelInfo | null>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig({ [name]: value });
  };

  const handleModelSelect = (modelId: string) => {
    setConfig({ model: modelId });
    setIsModelOpen(false);
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

  const currentModel = AVAILABLE_MODELS.find(m => m.id === config.model) || {
    id: config.model,
    name: config.model,
    description: 'Custom model',
    provider: 'Unknown'
  };

  return (
    <div className="space-y-6 p-4 bg-white rounded-lg shadow-sm border border-gray-100 h-full flex flex-col">
      <div className="flex items-center justify-between flex-shrink-0">
        <h2 className="text-xl font-semibold text-gray-800">设置</h2>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto">
        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
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

        <div className="relative" ref={modelDropdownRef}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            模型
          </label>
          <button
            type="button"
            onClick={() => setIsModelOpen(!isModelOpen)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm flex items-center justify-between text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <span className="truncate text-gray-900">{currentModel.name}</span>
            <ChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform", isModelOpen && "transform rotate-180")} />
          </button>

          {isModelOpen && (
            <div className="absolute z-50 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 flex flex-col max-h-80">
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
                        <span className={cn("text-sm font-medium truncate", model.id === config.model ? "text-blue-600" : "text-gray-900")}>
                          {model.name}
                        </span>
                        <Info className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                      </div>
                      <div className="flex items-center justify-between text-xs mt-0.5">
                        <span className="text-gray-500 truncate mr-2">
                          {model.provider}
                        </span>
                        {(model.inputPrice || model.outputPrice) && (
                          <span className={cn("font-mono text-[10px]", 
                            (model.inputPrice?.includes('￥0') && model.outputPrice?.includes('￥0')) 
                              ? "text-green-600 font-bold px-1.5 py-0.5 bg-green-50 rounded-full" 
                              : "text-gray-400"
                          )}>
                            {(model.inputPrice?.includes('￥0') && model.outputPrice?.includes('￥0'))
                              ? "FREE"
                              : `In: ${model.inputPrice} | Out: ${model.outputPrice} / M tokens`
                            }
                          </span>
                        )}
                      </div>
                    </div>
                    {model.id === config.model && (
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
                    {((hoveredModel || currentModel).inputPrice || (hoveredModel || currentModel).outputPrice) && (
                       <div className={cn("font-mono text-[10px]",
                          ((hoveredModel || currentModel).inputPrice?.includes('￥0') && (hoveredModel || currentModel).outputPrice?.includes('￥0'))
                            ? "text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full"
                            : "text-blue-600"
                       )}>
                          {((hoveredModel || currentModel).inputPrice?.includes('￥0') && (hoveredModel || currentModel).outputPrice?.includes('￥0'))
                            ? "FREE"
                            : `In: ${(hoveredModel || currentModel).inputPrice} / Out: ${(hoveredModel || currentModel).outputPrice} / M tokens`
                          }
                       </div>
                    )}
                 </div>
                 <div className="text-gray-500 leading-relaxed">
                    {(hoveredModel || currentModel).description}
                 </div>
              </div>
            </div>
          )}
          
          {/* Helper text for current model description when selected and not open */}
          {!isModelOpen && currentModel.description && (
             <div className="mt-2 text-xs text-gray-500 flex items-start gap-1.5 p-2 bg-gray-50 rounded">
                <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-blue-500" />
                <span>{currentModel.description}</span>
             </div>
          )}
        </div>

        <div>
          <label htmlFor="baseUrl" className="block text-sm font-medium text-gray-700 mb-1">
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
      </div>

      <div className="pt-4 flex gap-3 flex-shrink-0">
        <button
          onClick={resetConfig}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          重置
        </button>
      </div>
      
      <div className="text-xs text-gray-500 mt-4 flex-shrink-0">
        配置会自动保存到本地浏览器中。
      </div>
    </div>
  );
};
