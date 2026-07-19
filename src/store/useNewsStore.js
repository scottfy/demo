import React, { createContext, useContext, useState, useEffect } from 'react';
import { generateNewsCoverImage } from '../services/imageService.js';

// Initial sample news article to populate state on first launch
const INITIAL_ARTICLE = {
  category: '科技快訊',
  mainTitle: '突破性 Quantum-AI 晶片問世：運算效能提升 100 倍，掀起下一世代新聞採編革命',
  subTitle: '全球科研團隊發表最新架構，結合多模態神經網路與光子邏輯元件，預計 2027 年全面商業化應用。',
  coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
  author: 'AI 採編團隊 / 科技資深記者',
  publishedAt: new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
  body: `
<p>在人工智慧發展史上的重要里程碑中，全球頂尖聯合實驗室今日正式發表全新「Quantum-AI」晶片。該架構採用突破性的光子邏輯傳輸機制，能將大規模語言模型 (LLM) 的運算推論延遲降低至原本的百分之一，同時降低 85% 的能源消耗。</p>

<h3>打破算力瓶頸：新聞與數位內容產業首當其衝</h3>
<p>這項突破不僅意味著超級電腦與資料中心的極限擴充，更將重塑內容創作與現代新聞採編模式。新聞編輯室現在能透過即時多模態分析，在秒級時間內梳理數萬筆現場數據、影音資料與國際通訊社電報，為記者提供極具洞察力的背景整理。</p>

<blockquote>「我們不再只是對語言進行機率預測，而是讓晶片在硬體層級模擬類神經邏輯流動，這將徹底改寫人機協作寫作的邊界。」—— 首席架構師受訪表示。</blockquote>

<p>展望未來，科技界普遍預測該晶片將於 2027 年正式進入數據中心量產階段。屆時，智慧輔助工具將不再只是文字處理器，而是能深層輔助事實查核、觀點多角度剖析與國際情勢交叉比對的數位智囊。</p>
  `.trim()
};

const INITIAL_MESSAGES = [
  {
    id: 'msg-1',
    role: 'model',
    content: '👋 您好！我是您的 **AI 新聞採編助手 (AI Newsroom Co-Pilot)**。\n\n我可以協助您：\n- 💡 發想爆款新聞大標題與副標題\n- 📝 快速梳理採訪素材生成標準 5W1H 新聞稿\n- 🔍 微調報導風格（客觀報導、深度調查、科技快訊）\n- ✂️ 針對右側文章的任意段落進行擴寫、精簡與流暢重寫\n\n請問今天想撰寫什麼主題的新聞報導呢？',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
];

const NewsContext = createContext(null);

export function NewsProvider({ children }) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [toneStyle, setToneStyle] = useState('客觀中立報導');
  const [chatHistory, setChatHistory] = useState(INITIAL_MESSAGES);
  const [article, setArticle] = useState(INITIAL_ARTICLE);
  const [versionHistory, setVersionHistory] = useState([
    {
      id: 'v-1',
      timestamp: new Date().toLocaleTimeString(),
      label: '初始範例草稿',
      article: INITIAL_ARTICLE
    }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Sync API Key to localStorage
  const saveApiKey = (key) => {
    setApiKey(key);
    if (key) {
      localStorage.setItem('gemini_api_key', key);
    } else {
      localStorage.removeItem('gemini_api_key');
    }
  };

  // Add snapshot to history
  const createSnapshot = (label = '編輯快照') => {
    const newSnapshot = {
      id: `v-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      label,
      article: { ...article }
    };
    setVersionHistory(prev => [newSnapshot, ...prev]);
  };

  // Update article content partially or completely
  const updateArticle = (updates, createAutoSnapshot = true) => {
    setArticle(prev => {
      const next = { ...prev, ...updates };
      return next;
    });
    if (createAutoSnapshot) {
      createSnapshot('修改自動儲存');
    }
  };

  // Add message to chat
  const addChatMessage = (msg) => {
    setChatHistory(prev => [...prev, {
      id: `msg-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...msg
    }]);
  };

  return (
    <NewsContext.Provider value={{
      apiKey,
      saveApiKey,
      toneStyle,
      setToneStyle,
      chatHistory,
      addChatMessage,
      setChatHistory,
      article,
      updateArticle,
      setArticle,
      versionHistory,
      createSnapshot,
      isGenerating,
      setIsGenerating,
      isApiKeyModalOpen,
      setIsApiKeyModalOpen,
      isHistoryModalOpen,
      setIsHistoryModalOpen
    }}>
      {children}
    </NewsContext.Provider>
  );
}

export function useNewsStore() {
  const context = useContext(NewsContext);
  if (!context) {
    throw new Error('useNewsStore must be used within a NewsProvider');
  }
  return context;
}
