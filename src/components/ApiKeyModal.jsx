import React, { useState } from 'react';
import { useNewsStore } from '../store/useNewsStore.js';
import { Key, ExternalLink, Check, ShieldAlert, X } from 'lucide-react';

export default function ApiKeyModal() {
  const { apiKey, saveApiKey, isApiKeyModalOpen, setIsApiKeyModalOpen } = useNewsStore();
  const [inputKey, setInputKey] = useState(apiKey);
  const [isSaved, setIsSaved] = useState(false);

  if (!isApiKeyModalOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    saveApiKey(inputKey.trim());
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      setIsApiKeyModalOpen(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md glass-panel rounded-2xl p-6 border border-white/20 shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={() => setIsApiKeyModalOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">設定 Google Gemini API Key</h2>
            <p className="text-xs text-slate-400">連線您的 Gemini API Key 以啟用全功能 AI 新聞採編 Agent</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              API Key (Google AI Studio)
            </label>
            <input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="貼上 AIzaSy..."
              className="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-mono focus:ring-2 focus:ring-cyan-500/50"
              required
            />
          </div>

          {/* Guide Note */}
          <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20 flex items-start gap-2.5 text-xs text-slate-300">
            <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              您的 Key 會安全保存在您的個人瀏覽器 LocalStorage 中，絕不經過中間伺服器轉發。
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 ml-1 text-cyan-400 font-semibold hover:underline"
              >
                免費取得 API Key <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsApiKeyModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl shadow-lg shadow-cyan-500/25 hover:brightness-110 active:scale-95 transition-all"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>已儲存設定！</span>
                </>
              ) : (
                <span>儲存並連線</span>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
