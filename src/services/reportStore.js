// Local Storage Persistence Store for AI Procurement Assistant (No Mock Data)

const STORAGE_KEYS = {
  REPORTS: 'ai_procurement_reports_v2',
  SESSIONS: 'ai_procurement_sessions_v2',
  API_KEY: 'gemini_api_key'
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
            text: '您好！我是您的 **AI 採購比價助手**。\n\n⚠️ **請注意**：本系統已停用 Mock 模擬數據。請先點選右上角 **『設定 API Key』** 輸入您的 Gemini API Key，然後在此說明採購目標需求（如品項、預算、數量），我將為您執行比價並產出動態 HTML5 報告。',
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
