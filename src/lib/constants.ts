export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  provider?: string;
  inputPrice?: string;
  outputPrice?: string;
  supportVision?: boolean;
}

export const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash Preview',
    description: 'Google 最新一代高效多模态模型，专为低延迟和高吞吐量任务设计，支持长上下文。',
    provider: 'Google',
    inputPrice: '￥2.5',
    outputPrice: '￥15',
    supportVision: true,
  },
  {
    id: 'doubao-seed-1-8-251215',
    name: 'Doubao Seed 1.8',
    description: '字节跳动豆包大模型，针对中文语境深度优化，具备强大的对话和创作能力。',
    provider: 'ByteDance',
    inputPrice: '￥0.8',
    outputPrice: '￥8',
    supportVision: true,
  },
  {
    id: 'qwen-flash-2025-07-28',
    name: 'Qwen Flash 2025',
    description: '阿里云通义千问 Flash 版本，兼顾速度与成本，适合高频次对话场景。',
    provider: 'Alibaba',
    inputPrice: '￥0.012',
    outputPrice: '￥0.12',
  },
  {
    id: 'DeepSeek-V3.2-Fast',
    name: 'DeepSeek V3.2 Fast',
    description: 'DeepSeek 快速版，在保持优秀逻辑推理能力的同时大幅提升了响应速度。',
    provider: 'DeepSeek',
    inputPrice: '￥6.32',
    outputPrice: '￥18.96',
  },
  {
    id: 'DeepSeek-V3.2',
    name: 'DeepSeek V3.2',
    description: 'DeepSeek 标准版，拥有强大的代码生成、数学推理和复杂逻辑处理能力。',
    provider: 'DeepSeek',
    inputPrice: '￥1.58',
    outputPrice: '￥2.37',
  },
  {
    id: 'mimo-v2-flash-free',
    name: 'Mimo V2 Flash Free',
    description: 'Mimo 免费高速模型，适合日常闲聊和简单的任务处理，性价比极高。',
    provider: 'Mimo',
    inputPrice: '￥0',
    outputPrice: '￥0',
  },
  {
    id: 'kat-coder-pro-v1-free',
    name: 'Kat Coder Pro V1',
    description: '专为编程场景优化的免费模型，擅长代码补全、调试和解释。',
    provider: 'Kat',
    inputPrice: '￥0',
    outputPrice: '￥0',
  },
  {
    id: 'GLM-4.5-Flash',
    name: 'GLM-4.5 Flash',
    description: '智谱 AI 第四代轻量级模型，响应迅速，适合移动端和实时交互应用。',
    provider: 'Zhipu AI',
    inputPrice: '￥0',
    outputPrice: '￥0',
  },
  {
    id: 'glm-4.1v-thinking-flash',
    name: 'GLM-4.1V-Thinking-Flash',
    description: '智谱 AI 最新视觉思考模型，具备强大的视觉理解与逻辑推理能力，免费开放。',
    provider: 'Zhipu AI',
    inputPrice: '￥0',
    outputPrice: '￥0',
    supportVision: true,
  }
];
