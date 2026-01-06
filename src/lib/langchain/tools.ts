import { DynamicTool } from "@langchain/core/tools";
import { searchWeb } from "../search";

export const webSearchTool = new DynamicTool({
  name: "web_search",
  description: "用于在互联网上搜索实时信息、最新事件或知识库中没有的信息。输入应该是精准的关键词。",
  func: async (query) => {
    try {
      return await searchWeb(query);
    } catch (error) {
      return `搜索失败: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});
