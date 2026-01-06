export interface SearchResult {
  title: string;
  url: string;
  content: string;
}

/**
 * 联网搜索核心函数 (Serper API)
 */
export async function searchWeb(query: string): Promise<string> {
  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': '5ce2ce1aa9cfc6886340c1c9cbba0bb8317690da',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Serper API 错误: ${response.status}`);
    }

    const data = await response.json();
    let resultText = '';

    // 1. 处理直接回答 (Answer Box)
    if (data.answerBox) {
      const { title, answer, snippet } = data.answerBox;
      resultText += `[直接回答] ${title || ''}\n答案: ${answer || snippet}\n\n`;
    }

    // 2. 处理知识图谱 (Knowledge Graph)
    if (data.knowledgeGraph) {
      const { title, description } = data.knowledgeGraph;
      resultText += `[知识图谱] ${title}\n描述: ${description}\n\n`;
    }

    // 3. 处理常规搜索结果 (Organic)
    const organic = data.organic || [];
    if (organic.length > 0) {
      resultText += organic
        .slice(0, 5)
        .map((r: any, i: number) => `[搜索结果 ${i + 1}] ${r.title}\n链接: ${r.link}\n摘要: ${r.snippet}`)
        .join('\n\n');
    }

    if (!resultText) {
      return '未找到相关搜索结果。';
    }

    return resultText;
  } catch (error) {
    console.error('Serper search failed:', error);
    throw error;
  }
}
