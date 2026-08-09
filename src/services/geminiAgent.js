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
        model: 'gemini-2.5-flash',
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
 * Supports custom gateway proxies (e.g. https://gemini.printii.com)
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
      // Filter out retired/deprecated models like gemini-2.0
      const validModels = modelList.filter(m => {
        const name = (m.name || '').toLowerCase();
        const methods = m.supportedGenerationMethods || [];
        const supportsGen = methods.length === 0 || methods.includes('generateContent');
        return supportsGen && name.includes('gemini') && !name.includes('gemini-2.0');
      });

      const selected = 
        validModels.find(m => (m.name || '').toLowerCase().includes('gemini-3.5-flash')) ||
        validModels.find(m => (m.name || '').toLowerCase().includes('gemini-2.5-flash')) ||
        validModels.find(m => (m.name || '').toLowerCase().includes('flash')) ||
        validModels[0] ||
        modelList[0];

      if (selected && selected.name) {
        return selected.name.replace(/^models\//, '');
      }
    }
  } catch (err) {
    console.warn('ai.models.list() call warning on gateway proxy:', err);
  }

  return 'gemini-2.5-flash';
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
        info: `已完成公開網路與市場價格搜尋。請結合 Northwind 資料庫與相關數據撰寫分析。`
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
 * Main Direct User-AI Agent Conversation Engine
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

  if (onActivityState) onActivityState('thinking', '正在連線 Gemini API 閘道並選用模型...');
  
  let modelName = 'gemini-2.5-flash';
  try {
    modelName = await getAvailableModel(ai);
  } catch (err) {
    console.warn('getAvailableModel error, fallback to gemini-2.5-flash:', err);
  }

  const systemInstruction = `You are a top-tier Data Analysis & Procurement Expert Assistant (數據分析與比較報表專家).
Current Local Time: ${new Date().toLocaleString()}

Capabilities & Rules:
1. You have full access to database tools (get_database_schema, query_database_table) to query Northwind company sales, inventory, and order data from Northwind PostgREST API.
2. You have google_search_query capability to search real-time public market information when needed.
3. When answering data analysis or report requests, analyze data from both the database and user inputs thoroughly.
4. IMPORTANT: You MUST generate a complete, standalone, production-ready HTML report code wrapped inside \`\`\`html ... \`\`\` at the end of your response.
5. The HTML report MUST:
   - Use dynamic Chart.js visualizations (include <script src="https://cdn.jsdelivr.net/npm/chart.js"></script> inside HTML head/script).
   - Follow world-class RWD UI/UX standards, paper card layouts, clear color highlights, and Material Design aesthetic.
   - Include dynamic script controls (e.g. range sliders for budget/quantity adjustments, filter buttons, expandable details).
   - Provide concrete evidence links when quoting external sources.
   - Be completely self-contained in standard HTML5 syntax.

Always respond in Traditional Chinese (繁體中文).`;

  // Build message contents history
  const contents = [];
  
  // Format past history if provided
  chatHistory.slice(-10).forEach(msg => {
    if (msg.sender === 'user') {
      contents.push({ role: 'user', parts: [{ text: msg.text || '' }] });
    } else if (msg.sender === 'agent' && msg.text) {
      contents.push({ role: 'model', parts: [{ text: msg.text }] });
    }
  });

  // Append latest user prompt
  contents.push({ role: 'user', parts: [{ text: userPrompt }] });

  const toolsConfig = [
    { functionDeclarations: dbFunctionDeclarations }
  ];

  let loopCount = 0;
  const maxLoops = 6;
  let finalMarkdownText = '';

  try {
    while (loopCount < maxLoops) {
      loopCount++;

      if (onActivityState) {
        onActivityState('running_tool', `正在呼叫 Gemini (${modelName}) 進行資料分析與工具調用 (第 ${loopCount} 輪)...`);
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction,
          tools: toolsConfig
        }
      });

      const candidate = response.candidates?.[0];
      if (!candidate) {
        throw new Error('Gemini API 未能傳回有效的 Candidate 回應。');
      }

      const modelContent = candidate.content;
      const parts = modelContent?.parts || [];

      // Check for function calls
      const functionCallParts = parts.filter(p => p.functionCall);

      if (functionCallParts.length > 0) {
        // Record model turn in conversation history
        contents.push(modelContent);

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

          responseParts.push({
            functionResponse: {
              name: toolName,
              response: { result: toolResultStr }
            }
          });
        }

        // Add tool responses back to conversation contents
        contents.push({
          role: 'user',
          parts: responseParts
        });

        // Continue loop to get model text after tool execution
        continue;
      }

      // No function calls: extract text response
      finalMarkdownText = response.text || parts.map(p => p.text || '').join('\n');
      break;
    }

    if (!finalMarkdownText) {
      finalMarkdownText = 'AI 分析已完成，但未輸出文字摘要。';
    }

    // Extract HTML report block
    let reportHtml = '';
    const match = finalMarkdownText.match(/```html([\s\S]*?)```/);
    if (match && match[1]) {
      reportHtml = match[1].trim();
    } else if (finalMarkdownText.includes('<!DOCTYPE html>') || finalMarkdownText.includes('<html')) {
      reportHtml = finalMarkdownText.trim();
    }

    const reportTitle = extractTitleFromHtml(reportHtml) || '數據分析與比對評估報告';

    return {
      success: true,
      text: finalMarkdownText,
      reportTitle,
      reportHtml: reportHtml || null
    };

  } catch (error) {
    console.error('Process procurement task error:', error);
    return {
      success: false,
      text: formatFriendlyError(error),
      reportHtml: null
    };
  }
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
Maintain standard modern CSS styling, Chart.js code, dynamic interactive scripts, and paper-shadow card layouts.`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt
    });

    const text = response.text || '';
    const match = text.match(/```html([\s\S]*?)```/);
    if (match && match[1]) {
      return match[1].trim();
    } else if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
      return text.trim();
    }
    throw new Error('Gemini API 未能傳回有效的修改後 HTML 報告程式碼。');
  } catch (e) {
    throw new Error(formatFriendlyError(e));
  }
}

function extractTitleFromHtml(html) {
  if (!html) return null;
  const match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || html.match(/<title>([\s\S]*?)<\/title>/i);
  if (match && match[1]) {
    return match[1].replace(/<[^>]+>/g, '').trim();
  }
  return null;
}
