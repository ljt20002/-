import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { TokenUsage } from "../types";
import { AVAILABLE_MODELS } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateCost(usage: TokenUsage, modelId: string): string | null {
  const model = AVAILABLE_MODELS.find(m => m.id === modelId);
  if (!model || !model.inputPrice || !model.outputPrice) return null;

  try {
    const parsePrice = (priceStr: string) => {
      // 移除 " / M tokens" 和 "￥"
      return parseFloat(priceStr.replace('￥', '').replace(' / M tokens', ''));
    };

    const inputPrice = parsePrice(model.inputPrice);
    const outputPrice = parsePrice(model.outputPrice);

    const inputCost = (usage.prompt_tokens / 1_000_000) * inputPrice;
    const outputCost = (usage.completion_tokens / 1_000_000) * outputPrice;
    const totalCost = inputCost + outputCost;

    return `￥${totalCost.toFixed(6)}`;
  } catch (e) {
    console.error('Error calculating cost:', e);
    return null;
  }
}

/**
 * 播放一个轻微的提示音
 * 使用 Web Audio API 合成，无需外部音频文件
 */
export function playNotificationSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // 渐清的频率：从 880Hz (A5) 到 1320Hz (E6)
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    console.error('Failed to play notification sound:', e);
  }
}
