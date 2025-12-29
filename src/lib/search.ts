export interface SearchResult {
  title: string;
  url: string;
  content: string;
}

/**
 * 分析搜索意图并生成搜索关键词
 * 返回 null 表示无需搜索，返回 string[] 表示需要搜索的关键词列表
 */
export async function analyzeSearchIntent(
  query: string,
  config: { apiKey: string; baseUrl: string }
): Promise<string[] | null> {
  const now = new Date();
  const today = `${now.toLocaleDateString()} ${['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][now.getDay()]}`;
  try {
    const response = await fetch(`${config.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: 'GLM-4.5-Flash',
        messages: [
          {
            role: 'system',
            content: `你是一个搜索意图分析专家。当前日期是 ${today}。
你的任务是：
1. 判断用户的问题是否需要联网搜索。如果问题关于实时信息、最新事件、客观事实核实或你知识库可能过时的内容，则需要搜索。
2. 如果需要搜索，请将复杂问题拆解，生成1-3个精准的搜索关键词或短语。
3. 如果不需要搜索（如简单的问候、代码逻辑、纯文本处理、闲聊），请仅输出 "NO_SEARCH"。
4. 如果需要搜索，请以 JSON 数组格式输出搜索词，例如：["关键词1", "关键词2"]。不要有任何其他文字解释。`
          },
          { role: 'user', content: query }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    
    if (content === 'NO_SEARCH') return null;
    
    try {
      // 提取 JSON 数组
      const match = content.match(/\[.*\]/s);
      if (match) {
        return JSON.parse(match[0]);
      }
      return [query]; // 兜底
    } catch (e) {
      return [query];
    }
  } catch (error) {
    console.error('Search intent analysis failed:', error);
    return null;
  }
}

/**
 * 评估现有搜索结果是否足够回答用户问题
 */
export async function evaluateSearchSufficiency(
  userQuery: string,
  currentResults: string,
  config: { apiKey: string; baseUrl: string }
): Promise<{ sufficient: boolean; nextQuery?: string }> {
  const now = new Date();
  const today = `${now.toLocaleDateString()} ${['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][now.getDay()]}`;
  try {
    const response = await fetch(`${config.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: 'GLM-4.5-Flash',
        messages: [
          {
            role: 'system',
            content: `你是一个严谨的信息评估专家。当前日期是 ${today}。
请判断目前的搜索结果是否足以完整、准确地回答用户的问题。
如果信息充足，请输出：{"sufficient": true}
如果信息不足或缺失关键点，请指出缺失的内容并生成一个新的搜索词，输出：{"sufficient": false, "nextQuery": "新的搜索词"}
只输出 JSON，不要任何解释。`
          },
          { role: 'user', content: `用户问题：${userQuery}\n\n当前搜索结果：\n${currentResults}` }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) return { sufficient: true };
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    
    try {
      const match = content.match(/\{.*\}/s);
      if (match) {
        return JSON.parse(match[0]);
      }
    } catch (e) {}
    return { sufficient: true };
  } catch (error) {
    return { sufficient: true };
  }
}

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
