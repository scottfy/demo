import React, { useState } from 'react';
import { NewsProvider } from './store/useNewsStore.js';
import Header from './components/Header.jsx';
import ChatView from './components/ChatView.jsx';
import ArticleView from './components/ArticleView.jsx';
import ApiKeyModal from './components/ApiKeyModal.jsx';
import VersionHistoryModal from './components/VersionHistoryModal.jsx';
import { Bot, Newspaper } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'article' for mobile

  return (
    <div className="flex flex-col min-h-screen relative z-10">
      
      {/* Background Ambient Orbs */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      {/* Main Header */}
      <Header />

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex items-center justify-center p-2 bg-[#0d1322] border-b border-white/10">
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 w-full max-w-sm">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'chat'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>AI 採編助手</span>
          </button>
          <button
            onClick={() => setActiveTab('article')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'article'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Newspaper className="w-4 h-4" />
            <span>新聞報導視窗</span>
          </button>
        </div>
      </div>

      {/* Split-Pane Main Layout */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto p-3 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 min-h-[calc(100vh-80px)]">
        
        {/* Left Column: AI Chat View */}
        <div className={`lg:col-span-5 h-[calc(100vh-110px)] ${activeTab === 'chat' ? 'block' : 'hidden lg:block'}`}>
          <ChatView />
        </div>

        {/* Right Column: Article View */}
        <div className={`lg:col-span-7 h-[calc(100vh-110px)] ${activeTab === 'article' ? 'block' : 'hidden lg:block'}`}>
          <ArticleView />
        </div>

      </main>

      {/* Global Modals */}
      <ApiKeyModal />
      <VersionHistoryModal />

    </div>
  );
}

export default function App() {
  return (
    <NewsProvider>
      <AppContent />
    </NewsProvider>
  );
}
