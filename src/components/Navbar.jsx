import React from 'react';
import { 
  Building2, 
  Key, 
  Menu, 
  Sparkles, 
  Maximize2, 
  PlusCircle, 
  Search,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { getStoredApiKey } from '../services/reportStore';

export default function Navbar({ 
  activeView, 
  setActiveView, 
  onOpenApiKeyModal, 
  onNewReportClick,
  mobileMenuOpen,
  setMobileMenuOpen,
  activeReport
}) {
  const hasKey = !!getStoredApiKey();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm px-4 lg:px-6 py-3 flex items-center justify-between">
      {/* Brand & Mobile Toggle */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600"
          title="切換選單"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div 
          onClick={() => setActiveView('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-slate-900 text-base leading-tight tracking-tight">
                AI 採購比價助手
              </h1>
              <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-blue-600" /> v2.5 HTML5 Sandbox
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              動態 HTML5 沙盒報告繪製與 20+ 多平台比價引擎
            </p>
          </div>
        </div>
      </div>

      {/* Global Controls & Actions */}
      <div className="flex items-center gap-2.5">
        {/* Quick New Report Button */}
        <button
          onClick={onNewReportClick}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>建立新比價案</span>
        </button>

        {/* API Key Setting Modal Trigger */}
        <button
          onClick={onOpenApiKeyModal}
          className={`text-xs font-semibold px-3 py-2 rounded-lg border flex items-center gap-1.5 transition-colors ${
            hasKey
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
          }`}
          title="設定 Gemini API 金鑰"
        >
          <Key className={`w-3.5 h-3.5 ${hasKey ? 'text-emerald-600' : 'text-amber-600'}`} />
          <span className="hidden md:inline">
            {hasKey ? 'Gemini API 已連接' : '模擬測試模式 (點此輸入 Key)'}
          </span>
          <span className="md:hidden">API Key</span>
        </button>
      </div>
    </header>
  );
}
