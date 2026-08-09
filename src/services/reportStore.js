// Local Storage Persistence Store for AI Procurement Assistant (No Mock Data)

const STORAGE_KEYS = {
  REPORTS: 'ai_procurement_reports_v2',
  SESSIONS: 'ai_procurement_sessions_v2',
  API_KEY: 'gemini_api_key',
  API_ENDPOINT: 'gemini_api_endpoint'
};

export const getStoredApiKey = () => {
  return localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
};

export const setStoredApiKey = (key) => {
  if (key) {
    localStorage.setItem(STORAGE_KEYS.API_KEY, key.trim());
  } else {
    localStorage.removeItem(STORAGE_KEYS.API_KEY);
  }
};

export const getStoredApiEndpoint = () => {
  return localStorage.getItem(STORAGE_KEYS.API_ENDPOINT) || 'https://gemini.printii.com';
};

export const setStoredApiEndpoint = (endpoint) => {
  if (endpoint) {
    localStorage.setItem(STORAGE_KEYS.API_ENDPOINT, endpoint.trim());
  } else {
    localStorage.removeItem(STORAGE_KEYS.API_ENDPOINT);
  }
};

export const getReports = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.REPORTS);
    if (!data) {
      return [];
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load reports from localStorage', e);
    return [];
  }
};

export const saveReport = (report) => {
  const reports = getReports();
  const index = reports.findIndex(r => r.id === report.id);
  let updated;
  if (index >= 0) {
    updated = [...reports];
    updated[index] = { ...report, updatedAt: new Date().toISOString() };
  } else {
    updated = [report, ...reports];
  }
  localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(updated));
  return updated;
};

export const deleteReport = (id) => {
  const reports = getReports();
  const updated = reports.filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(updated));
  return updated;
};

export const getReportById = (id) => {
  const reports = getReports();
  return reports.find(r => r.id === id) || null;
};

// Chat Sessions Store
export const getSessions = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (!data) {
      const defaultSession = {
        id: 'session-default',
        title: '新採購對話',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [
          {
            id: 'msg-1',
            sender: 'agent',
            text: '您好！我是您的 **數據分析與比較報表小幫手**。\n\n⚠️ **請注意**：本系統已停用 Mock 模擬數據。請先點選右上角 **『設定 API Key』** 設定您的 API Key 與 API 閘道端點 (預設為 `https://gemini.printii.com`)，然後在此說明採購目標與數據分析需求，我將為您發起即時比對與 HTML5 互動報告繪製。',
            timestamp: new Date().toISOString()
          }
        ]
      };
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify([defaultSession]));
      return [defaultSession];
    }
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

export const saveSessions = (sessions) => {
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
};
