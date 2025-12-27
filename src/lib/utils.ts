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
      // Remove " / M tokens" and "￥"
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
