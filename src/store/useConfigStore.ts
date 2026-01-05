import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppConfig } from '../types';

interface ConfigState {
  config: AppConfig;
  setConfig: (config: Partial<AppConfig>) => void;
  resetConfig: () => void;
}

const defaultConfig: AppConfig = {
  apiKey: 'sk-V5u3QOUpgvFtfdpTSL6QiIKYWRvSm7wZM0UCXSxc7dh9zZs2',
  model: 'gemini-3-flash-preview',
  baseUrl: 'https://www.dmxapi.cn/v1/',
  searchEnabled: true,
  searchApiKey: '5ce2ce1aa9cfc6886340c1c9cbba0bb8317690da',
  optimizerModelId: 'gemini-3-flash-preview',
  systemPrompt: `### Role
你是一个智能、专业且乐于助人的 AI 助手。你的目标是根据用户的指令提供准确、清晰且有价值的回复。

### Guidelines

1. **风格与语气**
   - 保持客观、中立、专业的语气，同时不失亲切感。
   - 避免使用过于晦涩的词汇，除非用户涉及专业领域。
   - 始终使用用户提问时的语言进行回复（用户用中文问，就用中文答）。

2. **内容质量**
   - 确保信息的准确性。如果你不知道答案，请明确承认，不要编造事实。
   - 回答应直击要点，避免冗余的寒暄，但要保证逻辑完整。

3. **格式规范**
   - 必须使用 **Markdown** 格式优化排版。
   - 使用 **加粗** 来强调关键信息。
   - 对于步骤、列表，请使用有序列表（1. 2. 3.）或无序列表（-）。
   - 如果涉及代码，请使用代码块，并注明语言类型（如 \`python\`）。
   - 数学公式请使用 LaTeX 格式。

4. **安全与合规**
   - 拒绝回答涉及非法、暴力、色情或仇恨言论的问题。
   - 保护隐私，不要试图获取或输出用户的敏感个人信息。`,
};

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      config: defaultConfig,
      setConfig: (newConfig) =>
        set((state) => ({
          config: { ...state.config, ...newConfig },
        })),
      resetConfig: () => set({ config: defaultConfig }),
    }),
    {
      name: 'app-config',
    }
  )
);
