/**
 * Gemini API Integration Service for AI Newsroom Co-Pilot
 */

const GEMINI_MODEL = 'gemini-1.5-flash';
const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Common System Instructions for Newsroom Assistant
 */
export const NEWS_SYSTEM_PROMPT = `
你是一位頂尖的資深新聞編輯與新聞採訪專家 (Senior Newsroom Co-Pilot)。
你的職責是輔助記者與編輯完成高品質的新聞報導：
1. 撰寫客觀、專業、客觀中立且具吸引力的新聞內容。
2. 遵循新聞原則（5W1H：Who, What, When, Where, Why, How）。
3. 大標題必須震撼且具吸引力（新聞性強，拒絕標題黨但要抓人眼球）。
4. 副標題補充關鍵亮點與新聞脈絡。
5. 內文段落清晰，善用小標題 (H3) 與關鍵引述 (Blockquote) 增添層次感。
6. 請始終以 繁體中文 (Traditional Chinese) 回答，風格符合權威媒體報導規範。
`;

/**
 * Call Gemini API directly via REST
 */
export async function callGeminiApi(apiKey, { prompt, history = [], toneStyle = '客觀新聞' }) {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('請先在右上角設定您的 Gemini API Key 才能執行 AI 採編任務！');
  }

  const cleanKey = apiKey.trim();
  const url = `${API_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${cleanKey}`;

  // Format contents array with optional conversation history
  const contents = [];

  if (history && history.length > 0) {
    history.forEach(msg => {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      });
    });
  }

  contents.push({
    role: 'user',
    parts: [{ text: prompt }]
  });

  const requestBody = {
    contents,
    systemInstruction: {
      parts: [{ text: `${NEWS_SYSTEM_PROMPT}\n目前指定報導風格語氣：【${toneStyle}】。` }]
    },
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = errData?.error?.message || `API 請求失敗 (HTTP ${response.status})`;
      throw new Error(msg);
    }

    const data = await response.json();
    const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!replyText) {
      throw new Error('Gemini API 未能回傳有效的文本回應。');
    }

    return replyText;
  } catch (err) {
    console.error('Gemini API Error:', err);
    throw err;
  }
}

/**
 * Generate Structured News Article JSON
 */
export async function generateStructuredArticle(apiKey, topicPrompt, toneStyle = '客觀中立報導') {
  const prompt = `
請針對以下新聞主題/素材，生成一份結構完整的新聞報導：
【新聞主題/素材】：${topicPrompt}
【報導風格/語氣】：${toneStyle}

請直接回傳嚴格符合 JSON 格式的數據，切勿包含額外的 Markdown code block 標記或引號外文字。JSON 格式規範如下：
{
  "category": "新聞分類（例如：科技快訊 / 財經趨勢 / 國際焦點 / 社會觀察 / 深度報導）",
  "mainTitle": "強有力的新聞大標題（15-28字，簡明有魄力）",
  "subTitle": "新聞副標題（補充關鍵人物/數據/背景細節，18-35字）",
  "summary": "100字以內的新聞摘要與核心發言",
  "body": "新聞報導內文 HTML 格式字串。段落請用語義化 <p>標籤包裹，重點小標題請用 <h3>標籤包裹，關鍵引述請用 <blockquote>包裹。內文需具備5W1H結構，字數約 600-1000 字。"
}
`;

  const rawText = await callGeminiApi(apiKey, { prompt, toneStyle });
  
  // Clean potential JSON markdown blocks like ```json ... ```
  let jsonString = rawText.trim();
  if (jsonString.startsWith('```')) {
    jsonString = jsonString.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '').trim();
  }

  try {
    const parsed = JSON.parse(jsonString);
    return parsed;
  } catch (e) {
    // If strict JSON parsing fails, fallback parser
    console.warn('Fallback JSON extraction from Gemini response');
    const firstBrace = jsonString.indexOf('{');
    const lastBrace = jsonString.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      const extracted = jsonString.substring(firstBrace, lastBrace + 1);
      return JSON.parse(extracted);
    }
    throw new Error('解析 AI 生成的新聞結構失敗，請重試。');
  }
}

/**
 * Inline AI Text Edit (Selected text polish)
 */
export async function inlineAiEdit(apiKey, { selectedText, fullContext, action, customPrompt = '' }) {
  let instruction = '';
  switch (action) {
    case 'expand':
      instruction = '請將以下選取的文字進行擴寫與補充，加入更多專業細節與背景描述，保持新聞語氣連貫：';
      break;
    case 'summarize':
      instruction = '請將以下選取的文字進行精簡凝練，保留核心事實與數據，使其更精煉：';
      break;
    case 'rewrite':
      instruction = '請將以下選取的文字進行重寫優化，提升新聞語感流暢度與專業詞彙質感：';
      break;
    case 'headline':
      instruction = '請將以下選取的文字改寫成 3 個震撼力十足的新聞小標題或亮點引言：';
      break;
    case 'custom':
      instruction = `請根據以下指令優化選取文字【指令：${customPrompt}】：`;
      break;
    default:
      instruction = '請潤飾以下選取文字：';
  }

  const prompt = `
${instruction}

【選取的原始內文片段】：
"${selectedText}"

【整篇新聞上下文參考】：
"${fullContext.substring(0, 500)}..."

請直接回傳潤飾/優化後的文本結果，無需包含額外說明或開頭問候。
`;

  return await callGeminiApi(apiKey, { prompt });
}
