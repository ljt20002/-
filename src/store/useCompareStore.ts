import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CompareResponse, MessageStatus } from '../types';
import { streamChatCompletion } from '../lib/stream';
import { useConfigStore } from './useConfigStore';
import { AVAILABLE_MODELS } from '../lib/constants';
import { calculateCost, playNotificationSound } from '../lib/utils';

interface CompareState {
  selectedModelIds: string[];
  responses: Record<string, CompareResponse>;
  isComparing: boolean;
  question: string;
  activeQuestion: string; // 新增：保存当前正在对比的问题
  
  // Judge related
  judgeModelId: string;
  perspective: string;
  isGeneratingQuestion: boolean;
  isEvaluating: boolean;
  isJudgeEnabled: boolean;
  
  // Actions
  addModel: (modelId: string) => void;
  removeModel: (modelId: string) => void;
  setSelectedModelIds: (ids: string[]) => void;
  setQuestion: (question: string) => void;
  setJudgeModelId: (id: string) => void;
  setPerspective: (perspective: string) => void;
  setIsJudgeEnabled: (enabled: boolean) => void;
  generateQuestion: () => Promise<void>;
  evaluateResponses: () => Promise<void>;
  startComparison: () => Promise<void>;
  clearComparison: () => void;
  abortComparison: () => void;
}

const abortControllers = new Map<string, AbortController>();

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      selectedModelIds: [],
      responses: {},
      isComparing: false,
      question: '',
      activeQuestion: '',
      judgeModelId: 'gemini-3-flash-preview',
      perspective: '综合能力',
      isGeneratingQuestion: false,
      isEvaluating: false,
      isJudgeEnabled: true,

      addModel: (modelId) => {
        set((state) => {
          if (state.selectedModelIds.includes(modelId)) return state;
          return {
            selectedModelIds: [...state.selectedModelIds, modelId]
          };
        });
      },

      removeModel: (modelId) => {
        set((state) => ({
          selectedModelIds: state.selectedModelIds.filter(id => id !== modelId),
          responses: Object.fromEntries(
            Object.entries(state.responses).filter(([id]) => id !== modelId)
          )
        }));
      },

      setSelectedModelIds: (ids) => set({ selectedModelIds: ids }),
      
      setQuestion: (question) => set({ question }),

      setJudgeModelId: (id) => set({ judgeModelId: id }),
      
      setPerspective: (perspective) => set({ perspective }),
      setIsJudgeEnabled: (enabled) => set({ isJudgeEnabled: enabled }),

      generateQuestion: async () => {
        const { judgeModelId, perspective } = get();
        if (!perspective.trim()) return;

        set({ isGeneratingQuestion: true, question: '' });
        const config = useConfigStore.getState().config;

        try {
          let fullQuestion = '';
          await streamChatCompletion({
            config: { ...config, model: judgeModelId },
            messages: [
              { role: 'system', content: '你是一个专业的大模型测评专家。请根据用户提供的比较维度，设计一道具有针对性的、能够体现模型差异的测试题目。仅输出题目内容，不要有任何其他解释。' },
              { role: 'user', content: `比较维度：${perspective}` }
            ],
            onChunk: (chunk) => {
              fullQuestion += chunk;
              set({ question: fullQuestion });
            },
            onFinish: () => {
              set({ isGeneratingQuestion: false });
              playNotificationSound();
            },
            onError: (error) => {
              console.error('Failed to generate question:', error);
              set({ isGeneratingQuestion: false });
            }
          });
        } catch (error) {
          console.error('Generate question error:', error);
          set({ isGeneratingQuestion: false });
        }
      },

      evaluateResponses: async () => {
        const { judgeModelId, perspective, activeQuestion, responses, selectedModelIds } = get();
        console.log('Starting evaluation...', { judgeModelId, perspective, activeQuestion, modelCount: selectedModelIds.length });

        if (selectedModelIds.length === 0) {
            alert('请先添加模型');
            return;
        }
        if (!activeQuestion.trim()) {
            alert('没有找到正在对比的问题，请先发送提问');
            return;
        }

        set({ isEvaluating: true });
        const config = useConfigStore.getState().config;

        const resultsText = selectedModelIds.map(id => {
          const resp = responses[id];
          if (!resp || !resp.content) return `模型：${id} (无回复内容)`;
          
          const cost = resp.usage ? calculateCost(resp.usage, id) : '未知';
          return `模型：${resp.modelName} (ID: ${id})
回复内容：${resp.content}
响应耗时：${resp.latency ? (resp.latency / 1000).toFixed(2) : '未知'}s
预估成本：${cost}`;
        }).join('\n\n---\n\n');

        try {
          let fullEvaluation = '';
          console.log('Sending evaluation request to judge model...');
          await streamChatCompletion({
            config: { ...config, model: judgeModelId },
            messages: [
              { 
                role: 'system', 
                content: `你是一个专业的大模型测评专家。
请根据各模型的回复质量（核心维度）、响应耗时（速度维度）、以及预估成本（价值维度）进行综合打分。
评分建议：满分100，回复质量占70%，耗时占15%，性价比（成本/质量比）占15%。对于免费模型或极低成本模型，请在性价比维度上给予高分。

请严格按照 JSON 格式输出评价结果，不要包含任何解释文字。
评价内容必须包含【优点】、【缺点】、【性价比分析】三个维度。
格式必须为：
{
  "evaluations": [
    {
      "modelId": "模型ID",
      "score": 分数(数字),
      "evaluation": "### 优点\\n...\\n### 缺点\\n...\\n### 性价比分析\\n..."
    }
  ]
}` 
              },
              { role: 'user', content: `比较维度：${perspective}\n测试题目：${activeQuestion}\n\n对比结果：\n${resultsText}` }
            ],
            onChunk: (chunk) => {
              fullEvaluation += chunk;
            },
            onFinish: () => {
              console.log('Judge model finished. Parsing response...');
              try {
                let jsonStr = fullEvaluation.trim();
                const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                if (match) {
                  jsonStr = match[1];
                } else {
                  const firstBrace = jsonStr.indexOf('{');
                  const lastBrace = jsonStr.lastIndexOf('}');
                  if (firstBrace !== -1 && lastBrace !== -1) {
                    jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
                  }
                }

                console.log('Extracted JSON string:', jsonStr);
                const data = JSON.parse(jsonStr);
                if (data.evaluations && Array.isArray(data.evaluations)) {
                  console.log('Judge returned evaluations for:', data.evaluations.map((e: any) => e.modelId));
                  set((state) => {
                    const newResponses = { ...state.responses };
                    const availableModelIds = Object.keys(newResponses);
                    console.log('Available models in store:', availableModelIds.map(id => ({ id, name: newResponses[id].modelName })));
                    
                    data.evaluations.forEach((ev: any) => {
                      const judgeModelIdStr = String(ev.modelId).toLowerCase();
                      const normalizedJudgeId = judgeModelIdStr.replace(/[-_ ]/g, '');
                      console.log(`🔍 Attempting to match judge modelId: "${ev.modelId}"`);
                      
                      // 计算所有模型的匹配得分，选择得分最高的一个
                      const matches = availableModelIds.map(id => {
                        const modelName = newResponses[id].modelName || '';
                        const currentId = id.toLowerCase();
                        const currentName = modelName.toLowerCase();
                        const normalizedCurrentId = currentId.replace(/[-_ ]/g, '');
                        
                        let score = 0;
                        
                        // 1. 完全匹配 (最高优先级)
                        if (currentId === judgeModelIdStr || currentName === judgeModelIdStr) {
                          score = 100;
                        } 
                        // 2. 规格化后完全匹配
                        else if (normalizedCurrentId === normalizedJudgeId) {
                          score = 90;
                        }
                        // 3. 包含匹配 (如 "deepseek-v3.2" 包含 "v3.2")
                        else if (currentId.includes(judgeModelIdStr) || currentName.includes(judgeModelIdStr)) {
                          // 惩罚长度差异，防止 "v3.2" 错误匹配到 "v3.2-fast" 当 "v3.2" 也存在时
                          score = 80 - Math.abs(currentId.length - judgeModelIdStr.length);
                        }
                        // 4. 被包含匹配 (如 "v3.2" 被 "deepseek-v3.2" 包含)
                        else if (judgeModelIdStr.includes(currentId) || judgeModelIdStr.includes(currentName)) {
                          score = 70 - Math.abs(currentId.length - judgeModelIdStr.length);
                        }
                        // 5. 规格化后包含匹配
                        else if (normalizedCurrentId.includes(normalizedJudgeId) || normalizedJudgeId.includes(normalizedCurrentId)) {
                          score = 60 - Math.abs(normalizedCurrentId.length - normalizedJudgeId.length);
                        }

                        return { id, score };
                      }).filter(m => m.score > 0);

                      // 按得分从高到低排序
                      matches.sort((a, b) => b.score - a.score);
                      const targetId = matches.length > 0 ? matches[0].id : null;

                      if (targetId) {
                        console.log(`✅ MATCH SUCCESS: "${ev.modelId}" -> "${targetId}"`);
                        newResponses[targetId] = {
                          ...newResponses[targetId],
                          score: ev.score,
                          evaluation: ev.evaluation
                        };
                      } else {
                        console.warn(`❌ MATCH FAILED: "${ev.modelId}" could not be linked to any model in store.`);
                      }
                    });
                    return { responses: newResponses, isEvaluating: false };
                  });
                  playNotificationSound();
                } else {
                  throw new Error('返回数据格式不正确');
                }
              } catch (e) {
                console.error('Failed to parse evaluation JSON:', e, fullEvaluation);
                alert('裁判评价解析失败，请确保裁判模型支持 JSON 输出。原始回复：' + fullEvaluation.slice(0, 100));
                set({ isEvaluating: false });
              }
            },
            onError: (error) => {
              console.error('Evaluation error:', error);
              alert('请求裁判模型出错: ' + error.message);
              set({ isEvaluating: false });
            }
          });
        } catch (error) {
          console.error('Evaluate error:', error);
          alert('执行评价过程出错: ' + (error instanceof Error ? error.message : '未知错误'));
          set({ isEvaluating: false });
        }
      },

      startComparison: async () => {
        const { selectedModelIds, question } = get();
        if (selectedModelIds.length === 0 || !question.trim()) return;

        set({ isComparing: true, activeQuestion: question }); // 重点：在这里保存 activeQuestion
        
        // Reset responses
        const initialResponses: Record<string, CompareResponse> = {};
        selectedModelIds.forEach(id => {
          const model = AVAILABLE_MODELS.find(m => m.id === id);
          initialResponses[id] = {
            modelId: id,
            modelName: model?.name || id,
            content: '',
            status: MessageStatus.PENDING,
          };
        });
        set({ responses: initialResponses });

        const config = useConfigStore.getState().config;
        const systemPrompt = config.systemPrompt || 'You are a helpful AI assistant.';

        const promises = selectedModelIds.map(async (modelId) => {
          const controller = new AbortController();
          abortControllers.set(modelId, controller);
          const startTime = Date.now();

          try {
            set((state) => ({
              responses: {
                ...state.responses,
                [modelId]: { ...state.responses[modelId], status: MessageStatus.RECEIVING }
              }
            }));

            await streamChatCompletion({
              config: { ...config, model: modelId },
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: question }
              ],
              onChunk: (content) => {
                set((state) => ({
                  responses: {
                    ...state.responses,
                    [modelId]: {
                      ...state.responses[modelId],
                      content: state.responses[modelId].content + content
                    }
                  }
                }));
              },
              onUsage: (usage) => {
                set((state) => ({
                  responses: {
                    ...state.responses,
                    [modelId]: { ...state.responses[modelId], usage }
                  }
                }));
              },
              onFinish: () => {
                const latency = Date.now() - startTime;
                const finishedAt = Date.now();
                set((state) => ({
                  responses: {
                    ...state.responses,
                    [modelId]: { ...state.responses[modelId], status: MessageStatus.SENT, latency, finishedAt }
                  }
                }));
                abortControllers.delete(modelId);
              },
              onError: (error) => {
                const latency = Date.now() - startTime;
                const finishedAt = Date.now();
                set((state) => ({
                  responses: {
                    ...state.responses,
                    [modelId]: {
                      ...state.responses[modelId],
                      status: MessageStatus.ERROR,
                      error: error.message,
                      latency,
                      finishedAt
                    }
                  }
                }));
                abortControllers.delete(modelId);
              },
              signal: controller.signal
            });
          } catch (error) {
            console.error(`Comparison error for ${modelId}:`, error);
          }
        });

        await Promise.all(promises);
        set({ isComparing: false });
        playNotificationSound();
      },

      clearComparison: () => {
        set({ responses: {}, question: '', activeQuestion: '', isComparing: false });
      },

      abortComparison: () => {
        abortControllers.forEach(controller => controller.abort());
        abortControllers.clear();
        set({ isComparing: false });
      }
    }),
    {
      name: 'compare-storage',
      partialize: (state) => ({
        selectedModelIds: state.selectedModelIds,
        isJudgeEnabled: state.isJudgeEnabled,
        judgeModelId: state.judgeModelId,
        perspective: state.perspective,
      }),
    }
  )
);
