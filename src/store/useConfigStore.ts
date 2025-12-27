import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppConfig } from '../types';

interface ConfigState {
  config: AppConfig;
  setConfig: (config: Partial<AppConfig>) => void;
  resetConfig: () => void;
}

const defaultConfig: AppConfig = {
  apiKey: '',
  model: 'gemini-3-flash-preview',
  baseUrl: 'https://api.openai.com/v1',
  systemPrompt: 'You are a helpful AI assistant.',
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
