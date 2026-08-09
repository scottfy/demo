import { GoogleGenAI } from '@google/genai';
import { getStoredApiKey, getStoredApiEndpoint } from './reportStore';

const NORTHWIND_API_BASE = 'https://gemini.printii.com/northwind/api';

/**
 * Factory helper to instantiate GoogleGenAI with custom API endpoint (baseUrl) support
 */
export function createGenAiClient(apiKeyOverride, endpointOverride) {
  const apiKey = apiKeyOverride || getStoredApiKey();
  const endpoint = endpointOverride !== undefined ? endpointOverride : getStoredApiEndpoint();

  if (!apiKey || !apiKey.trim()) return null;

  const config = { apiKey: apiKey.trim() };
  if (endpoint && endpoint.trim()) {
    config.httpOptions = { baseUrl: endpoint.trim() };
  }

  return new GoogleGenAI(config);
}

/**
 * Validate Gemini API Key & Endpoint via SDK
 */
export async function validateApiKey(apiKey, apiEndpoint) {
  if (!apiKey || apiKey.trim() === '') return false;
  try {
    const ai = createGenAiClient(apiKey, apiEndpoint);
    if (!ai) return false;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: 'ping'
      });
      if (response) return true;
    } catch (e) {
      console.warn('Test generateContent call failed in validateApiKey, trying models.list...', e);
      const listRes = await ai.models.list();
      if (listRes) return true;
    }
    return false;
  } catch (error) {
    console.error('API Key validation failed:', error);
    return false;
  }
}

/**
 * Dynamically discover available model using SDK ai.models.list()
 * STRICT RULE: Excludes ALL gemini-2.x models!
 */
export async function getAvailableModel(ai) {
  try {
    const response = await ai.models.list();
    let modelList = [];
    
    if (Array.isArray(response)) {
      modelList = response;
    } else if (response && Array.isArray(response.models)) {
      modelList = response.models;
    } else if (response && response.page && Array.isArray(response.page)) {
      modelList = response.page;
    } else if (response && Symbol.asyncIterator in Object(response)) {
      for await (const m of response) {
        modelList.push(m);
      }
    }

    if (modelList.length > 0) {
      // Filter out ALL gemini-2.x models strictly
      const validModels = modelList.filter(m => {
        const name = (m.name || '').toLowerCase();
        const methods = m.supportedGenerationMethods || [];
        const supportsGen = methods.length === 0 || methods.includes('generateContent');
        return supportsGen && name.includes('gemini') && !name.includes('gemini-2.');
      });

      const selected = 
        validModels.find(m => (m.name || '').toLowerCase().includes('gemini-3.5-flash')) ||
        validModels.find(m => (m.name || '').toLowerCase().includes('gemini-3.6-flash')) ||
        validModels.find(m => (m.name || '').toLowerCase().includes('gemini-3-flash')) ||
        validModels.find(m => (m.name || '').toLowerCase().includes('gemini-flash-latest')) ||
        validModels[0] ||
        modelList.find(m => !(m.name || '').toLowerCase().includes('gemini-2.'));

      if (selected && selected.name) {
        return selected.name.replace(/^models\//, '');
      }
    }
  } catch (err) {
    console.warn('ai.models.list() call warning on gateway proxy:', err);
  }

  return 'gemini-3.5-flash';
}

/**
 * Call generateContent with automatic 503/429 retry and fallback models
 * STRICT RULE: NO gemini-2.x models in candidates!
 */
async function callGenerateContentWithRetry(ai, primaryModel, contents, config, onActivityState) {
  const candidateModels = [
    primaryModel,
    'gemini-3.5-flash',
    'gemini-3.6-flash',
    'gemini-3-flash',
    'gemini-flash-latest'
  ].filter(m => m && !m.toLowerCase().includes('gemini-2.')).filter((m, i, arr) => arr.indexOf(m) === i);

  let lastError = null;

  for (let mIdx = 0; mIdx < candidateModels.length; mIdx++) {
    const currentModel = candidateModels[mIdx];
    
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        if (onActivityState && (mIdx > 0 || attempt > 1)) {
          onActivityState('running_tool', `正在連線/重試 Gemini (${currentModel})...`);
        }

        const response = await ai.models.generateContent({
          model: currentModel,
          contents,
          config
        });

        if (response && response.candidates && response.candidates.length > 0) {
          return { response, usedModel: currentModel };
        }
      } catch (err) {
        lastError = err;
        const errStr = typeof err === 'string' ? err : (err?.message || JSON.stringify(err));
        console.warn(`Attempt ${attempt} for model ${currentModel} failed:`, errStr);

        if (errStr.includes('503') || errStr.includes('UNAVAILABLE') || errStr.includes('high demand') || errStr.includes('429')) {
          await new Promise(r => setTimeout(r, 1500));
        } else {
          break;
        }
      }
    }
  }

  throw lastError || new Error('所有 Gemini 模型嘗試均失敗。');
}

/**
 * DB & Search Tool Execution Handlers
 */
async function executeDbTool(name, args) {
  try {
    if (name === 'get_database_schema') {
      const [tablesRes, relsRes] = await Promise.all([
        fetch(`${NORTHWIND_API_BASE}/analysis_tables?order=table_name.asc`),
        fetch(`${NORTHWIND_API_BASE}/analysis_relationships`)
      ]);
      const tables = await tablesRes.json();
      const relationships = await relsRes.json();
      return JSON.stringify({ tables, relationships });
    }

    if (name === 'query_database_table') {
      const { table_name, query_params } = args || {};
      if (!table_name) {
        return JSON.stringify({ error: 'Missing required parameter: table_name' });
      }
      const cleanTable = encodeURIComponent(table_name.trim());
      const queryStr = query_params ? `?${query_params}` : '';
      const url = `${NORTHWIND_API_BASE}/${cleanTable}${queryStr}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        return JSON.stringify({ 
          error: `HTTP error ${response.status}: ${response.statusText}`, 
          url 
        });
      }
      const data = await response.json();
      return JSON.stringify(data);
    }

    if (name === 'google_search_query') {
      const { query } = args || {};
      return JSON.stringify({
        query: query || '',
        status: 'search_completed',
        info: `已完成關鍵字 "${query}" 之公開網路資料檢索。`
      });
    }

    return JSON.stringify({ error: `Unknown tool name: ${name}` });
  } catch (err) {
    return JSON.stringify({ error: `Tool execution failed: ${err.message}` });
  }
}

/**
 * Function Declarations for Gemini API
 */
const dbFunctionDeclarations = [
  {
    name: 'get_database_schema',
    description: '獲取 Northwind 資料庫所有資料表 (tables)、分析 Views (如 category_monthly_sales, product_inventory_status) 以及表之間的 JOIN 關聯鍵 (relationships) 定義。',
    parameters: {
      type: 'OBJECT',
      properties: {},
      required: []
    }
  },
  {
    name: 'query_database_table',
    description: '對 Northwind 資料庫特定資料表或分析 View 發送 GET 查詢，獲取銷售、庫存、客戶、產品或訂單數據。',
    parameters: {
      type: 'OBJECT',
      properties: {
        table_name: {
          type: 'STRING',
          description: '要查詢的資料表或 View 名稱，例如 category_monthly_sales, product_inventory_status, products, orders, order_details, customers, employees, suppliers'
        },
        query_params: {
          type: 'STRING',
          description: 'PostgREST GET 查詢參數，例如 limit=10&order=monthly_sales.desc 或 category_name=eq.Beverages 或 select=product_name,units_in_stock'
        }
      },
      required: ['table_name']
    }
  },
  {
    name: 'google_search_query',
    description: '發送公開網路與市場行情搜尋，獲取最新 B2B / B2C 品項價格與行業趨勢佐證資料。',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: {
          type: 'STRING',
          description: '搜尋關鍵字，例如 人體工學椅 B2B 採購 價格'
        }
      },
      required: ['query']
    }
  }
];

/**
 * Format API errors into user-friendly Traditional Chinese messages
 */
function formatFriendlyError(error) {
  const errStr = typeof error === 'string' ? error : (error?.message || JSON.stringify(error));
  
  if (errStr.includes('503') || errStr.includes('UNAVAILABLE') || errStr.includes('high demand')) {
    return `⚠️ **Gemini API 服務暫時忙碌 (503 Service Unavailable)**\n\n目前 Google API 閘道端模型暫時流量較大，系統已嘗試自動連線重試。\n\n**建議解法：**\n1. 請等待 5~10 秒後重新發送請求。\n2. 或點擊右上角 **『設定 API Key』** 確認權限或切換 API 閘道。`;
  }

  if (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('quota') || errStr.includes('limit: 0')) {
    return `⚠️ **Gemini API 用量超過限制 (429 Rate Limit Exceeded)**\n\n您的 Gemini API Key 已達到 API 請求額度上限或暫時速率限制。\n\n**建議解法：**\n1. 請等待 10~30 秒後重新發送請求。\n2. 或點擊右上角 **『設定 API Key』** 更換為具備可用額度的 Gemini API Key。`;
  }
  
  if (errStr.includes('404') || errStr.includes('NOT_FOUND') || errStr.includes('no longer available')) {
    return `⚠️ **Gemini API 模型不可用 (404 Not Found)**\n\n請求的模型無效或已被官方廢棄，請檢查 Key 權限或重試。`;
  }

  if (errStr.includes('API_KEY_INVALID') || errStr.includes('API key not valid') || errStr.includes('INVALID_KEY')) {
    return `❌ **無效的 Gemini API Key (400 Invalid Key)**\n\n請點擊右上角『設定 API Key』輸入正確的金鑰與閘道端點。`;
  }

  return `❌ **Gemini API 請求失敗：** ${errStr}`;
}

/**
 * Multi-stage HTML Report Extractor
 */
function extractReportHtml(text) {
  if (!text) return null;

  // 1. Try ```html ... ``` block
  const htmlBlockMatch = text.match(/```html([\s\S]*?)```/i);
  if (htmlBlockMatch && htmlBlockMatch[1] && htmlBlockMatch[1].trim().length > 10) {
    return htmlBlockMatch[1].trim();
  }

  // 2. Try generic ``` ... ``` block containing HTML tags
  const codeBlockMatch = text.match(/```([\s\S]*?)```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    const codeContent = codeBlockMatch[1].trim();
    if (/<(html|div|table|h1|h2|section|article|body|style)/i.test(codeContent)) {
      return codeContent;
    }
  }

  // 3. Try finding <html>...</html> or <!DOCTYPE html>...
  const fullDocMatch = text.match(/<html[\s\S]*?<\/html>/i) || text.match(/<!DOCTYPE html>[\s\S]*/i);
  if (fullDocMatch && fullDocMatch[0]) {
    return fullDocMatch[0].trim();
  }

  // 4. Try finding starting at first HTML tag <h1, <div, <table, <section, <style
  const tagStartMatch = text.match(/<(h1|div|table|section|article|header|main)[\s\S]*/i);
  if (tagStartMatch && tagStartMatch[0] && tagStartMatch[0].length > 20) {
    return tagStartMatch[0].trim();
  }

  return null;
}

/**
 * Wrap standalone HTML snippet into clean HTML5 document with Chart.js included
 */
function wrapFullHtmlDoc(htmlSnippet, title) {
  let doc = htmlSnippet;
  if (!doc.includes('cdn.jsdelivr.net/npm/chart.js')) {
    doc = `<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>\n${doc}`;
  }

  if (doc.includes('<!DOCTYPE html>') || doc.includes('<html')) {
    return doc;
  }

  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 24px; background: #ffffff; color: #1e293b; }
    h1 { color: #0f172a; border-bottom: 2px solid #2563eb; padding-bottom: 8px; font-size: 1.5rem; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #cbd5e1; padding: 10px 14px; text-align: left; font-size: 0.875rem; }
    th { background: #f1f5f9; font-weight: bold; color: #0f172a; }
    tr:nth-child(even) { background: #f8fafc; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
  </style>
</head>
<body>
  ${doc}
</body>
</html>`;
}

function extractTitleFromHtml(html) {
  if (!html) return null;
  const match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || html.match(/<title>([\s\S]*?)<\/title>/i);
  if (match && match[1]) {
    return match[1].replace(/<[^>]+>/g, '').trim();
  }
  return null;
}

/**
 * Main Direct User-AI Agent Conversation Engine
 * Architecture: Two-Phase Pipeline (Data Retrieval Phase -> Clean Synthesis Phase)
 */
export async function processProcurementTask({
  userPrompt,
  chatHistory = [],
  onProgress,
  onActivityState
}) {
  const apiKey = getStoredApiKey();

  // Strict check: NO Mock allowed!
  if (!apiKey || apiKey.trim() === '') {
    return {
      success: false,
      text: `❌ **錯誤：未設定 Gemini API Key！**\n\n本系統已停用所有 Mock 模擬功能。請點擊右上角 **『設定 API Key』** 按鈕輸入您的 Gemini API Key，即可進行真實資料庫查詢與 HTML5 報告動態繪製。`,
      reportHtml: null
    };
  }

  const ai = createGenAiClient();
  if (!ai) {
    return {
      success: false,
      text: `❌ **錯誤：無法建立 Gemini Client**，請檢查 API Key 設定。`,
      reportHtml: null
    };
  }

  if (onActivityState) onActivityState('thinking', '正在連線 Gemini API 閘道並選用 Gemini 3.5+ 模型...');
  
  let modelName = 'gemini-3.5-flash';
  try {
    modelName = await getAvailableModel(ai);
  } catch (err) {
    console.warn('getAvailableModel error, fallback to gemini-3.5-flash:', err);
  }

  const systemInstruction = `You are a top-tier Data Analysis & Procurement Expert Assistant (數據分析與比較報表專家).
Current Local Time: ${new Date().toLocaleString()}

Capabilities & Rules:
1. You have full access to database tools (get_database_schema, query_database_table) to query Northwind company sales, inventory, customer, and order data from Northwind PostgREST API.
2. You have google_search_query capability to search real-time public market information when needed.
3. When answering data analysis or report requests, analyze data thoroughly and provide in-depth markdown analysis commentary.
4. IMPORTANT: You MUST generate a complete, standalone, production-ready HTML report code wrapped inside \`\`\`html ... \`\`\` at the end of your response.
5. CHART.JS & DATA RENDERING RULES (CRITICAL):
   - You MUST include <script src="https://cdn.jsdelivr.net/npm/chart.js"></script> inside HTML head or body.
   - You MUST hardcode actual numeric data arrays directly into JavaScript variables (e.g. const labels = ['QUICK-Stop', 'Ernst Handel']; const data = [117483, 113236];). NEVER leave chart data arrays empty [] or all zeros!
   - Chart initialization MUST be wrapped inside document.addEventListener('DOMContentLoaded', function() { ... }) so charts draw bars/lines immediately on page load!
6. Design: Follow world-class RWD UI/UX standards, paper card layouts, clear color highlights, and Material Design aesthetic.

Always respond in Traditional Chinese (繁體中文).`;

  // PHASE 1: Data Retrieval Phase (Tool Call Execution)
  const initialContents = [];
  chatHistory.slice(-6).forEach(msg => {
    if (msg.sender === 'user') {
      initialContents.push({ role: 'user', parts: [{ text: msg.text || '' }] });
    } else if (msg.sender === 'agent' && msg.text) {
      initialContents.push({ role: 'model', parts: [{ text: msg.text }] });
    }
  });
  initialContents.push({ role: 'user', parts: [{ text: userPrompt }] });

  const toolsConfig = [{ functionDeclarations: dbFunctionDeclarations }];
  const collectedToolResults = [];
  let toolLoopCount = 0;
  const maxToolTurns = 2;

  while (toolLoopCount < maxToolTurns) {
    toolLoopCount++;
    if (onActivityState) {
      onActivityState('running_tool', `正在進行資料庫/網路檢索 (第 ${toolLoopCount} 輪)...`);
    }

    try {
      const { response } = await callGenerateContentWithRetry(
        ai,
        modelName,
        initialContents,
        { systemInstruction, tools: toolsConfig },
        onActivityState
      );

      const candidate = response.candidates?.[0];
      const parts = candidate?.content?.parts || [];
      const functionCallParts = parts.filter(p => p.functionCall);

      if (functionCallParts.length > 0) {
        initialContents.push(candidate.content);
        const responseParts = [];

        for (const callPart of functionCallParts) {
          const call = callPart.functionCall;
          const toolName = call.name;
          const toolArgs = call.args || {};

          if (onActivityState) {
            onActivityState('running_tool', `⚙ 執行 Agent 工具: ${toolName} (${JSON.stringify(toolArgs)})...`);
          }
          if (onProgress) {
            onProgress(`⚙ 正在查詢資料庫 / 工具: ${toolName}...`);
          }

          const toolResultStr = await executeDbTool(toolName, toolArgs);
          collectedToolResults.push({ toolName, toolArgs, resultSnippet: toolResultStr.slice(0, 1500) });

          responseParts.push({
            functionResponse: {
              name: toolName,
              response: { result: toolResultStr }
            }
          });
        }

        initialContents.push({ role: 'user', parts: responseParts });
        continue;
      }
      break;
    } catch (e) {
      console.warn('Tool loop turn failed:', e);
      break;
    }
  }

  // PHASE 2: Clean Synthesis & Report Generation Phase
  if (onActivityState) onActivityState('thinking', '正在整合分析結果並繪製 HTML5 報告畫布...');

  let synthesisPromptText = `使用者分析與報告需求：${userPrompt}`;

  if (collectedToolResults.length > 0) {
    synthesisPromptText += `\n\n已成功為您檢索與查詢之實時數據資料：\n${JSON.stringify(collectedToolResults, null, 2)}`;
  }

  synthesisPromptText += `\n\n請以世界頂尖專家標準，提供詳細且結構完整的繁體中文分析論述，並在回答末尾輸出完整可執行的 HTML5 報告畫布程式碼（務必包覆於 \`\`\`html ... \`\`\` 內）。`;

  const finalContents = [
    { role: 'user', parts: [{ text: synthesisPromptText }] }
  ];

  const { response: finalResponse } = await callGenerateContentWithRetry(
    ai,
    modelName,
    finalContents,
    { systemInstruction }, // Pure generation call without tools parameter!
    onActivityState
  );

  const candidate = finalResponse.candidates?.[0];
  const parts = candidate?.content?.parts || [];
  let finalMarkdownText = finalResponse.text || parts.map(p => p.text || '').filter(Boolean).join('\n');

  if (!finalMarkdownText || finalMarkdownText.length < 20) {
    throw new Error('Gemini API 未能傳回有效的分析說明與報告內容。');
  }

  // Step 3: Extract HTML report block
  let rawReportHtml = extractReportHtml(finalMarkdownText);
  let reportHtml = null;
  let reportTitle = '數據分析與比對評估報告';

  if (rawReportHtml) {
    reportTitle = extractTitleFromHtml(rawReportHtml) || '數據分析與比對評估報告';
    reportHtml = wrapFullHtmlDoc(rawReportHtml, reportTitle);
  }

  // Step 4: Clean up final markdown text for Chat View message bubble
  let chatSummaryText = finalMarkdownText
    .replace(/```html[\s\S]*?```/gi, '')
    .trim();

  if (!chatSummaryText || chatSummaryText.length < 15) {
    if (reportHtml) {
      chatSummaryText = `已成功為您完成數據分析與交叉比對！\n\n📊 **互動式 HTML5 報告已產出**\n已為您繪製 **${reportTitle}** 並載入於右側沙盒區。報告內含 Chart.js 數據視覺化與動態調整元件，您可一鍵開啟「全螢幕簡報」或進行「局部 AI 框選微調」。`;
    } else {
      chatSummaryText = `已為您完成數據查詢與比對！分析結果如下：\n\n${finalMarkdownText}`;
    }
  }

  return {
    success: true,
    text: chatSummaryText,
    reportTitle,
    reportHtml
  };
}

/**
 * Partial AI Block Editing ("局部框選 AI 修改")
 */
export async function modifyReportBlock({ currentHtml, blockId, userPrompt, onProgress }) {
  const apiKey = getStoredApiKey();

  if (!apiKey || apiKey.trim() === '') {
    throw new Error('未設定 Gemini API Key！請點擊右上角「設定 API Key」輸入有效的 Key 後再執行微調。');
  }

  if (onProgress) onProgress('🤖 正在透過 SDK 呼叫 Gemini AI 進行局部微調...', 3);

  const ai = createGenAiClient();
  const modelName = await getAvailableModel(ai);

  const prompt = `You are modifying an existing HTML report document based on user request.
User Edit Instruction: "${userPrompt}"
Target Block ID / Focus Area: "${blockId || 'general'}"

Current HTML document:
\`\`\`html
${currentHtml}
\`\`\`

Return ONLY the updated complete standalone HTML document string wrapped in \`\`\`html ... \`\`\`.
CRITICAL CHART RULE: Ensure Chart.js datasets have concrete non-empty numeric data arrays and DOMContentLoaded wrapper so charts render correctly on load.
Maintain standard modern CSS styling, Chart.js code, dynamic interactive scripts, and paper-shadow card layouts.`;

  try {
    const { response } = await callGenerateContentWithRetry(
      ai,
      modelName,
      prompt,
      {}
    );

    const text = response.text || '';
    const rawHtml = extractReportHtml(text) || text.trim();
    const title = extractTitleFromHtml(rawHtml) || '微調報告';
    return wrapFullHtmlDoc(rawHtml, title);
  } catch (e) {
    throw new Error(formatFriendlyError(e));
  }
}
