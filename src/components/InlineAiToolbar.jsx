import React, { useState } from 'react';
import { useNewsStore } from '../store/useNewsStore.js';
import { inlineAiEdit } from '../services/gemini.js';
import { Sparkles, Maximize2, Minimize2, RefreshCw, Heading, Wand2, X } from 'lucide-react';

export default function InlineAiToolbar({ selectionInfo, onClose, onApplyEdit }) {
  const { apiKey, article, setIsApiKeyModalOpen } = useNewsStore();
  const [loadingAction, setLoadingAction] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  if (!selectionInfo || !selectionInfo.text) return null;

  const handleAction = async (action) => {
    if (!apiKey) {
      setIsApiKeyModalOpen(true);
      return;
    }

    setLoadingAction(action);
    try {
      const result = await inlineAiEdit(apiKey, {
        selectedText: selectionInfo.text,
        fullContext: article.body,
        action,
        customPrompt
      });

      onApplyEdit(result);
    } catch (err) {
      alert('AI 潤飾失敗: ' + err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div
      style={{
        top: `${Math.max(10, selectionInfo.top - 60)}px`,
        left: `${Math.min(window.innerWidth - 320, Math.max(20, selectionInfo.left))}px`
      }}
      className="absolute z-40 flex flex-col gap-2 p-2 glass-panel rounded-xl border border-cyan-500/40 shadow-2xl shadow-cyan-500/20 animate-fade-in backdrop-blur-xl"
    >
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold text-cyan-300 border-r border-white/10 mr-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI 潤飾</span>
        </div>

        <button
          onClick={() => handleAction('expand')}
          disabled={loadingAction !== null}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-slate-200 hover:bg-cyan-500/20 hover:text-cyan-300 transition-all disabled:opacity-50"
          title="為選取段落擴充細節與新聞脈絡"
        >
          <Maximize2 className="w-3 h-3 text-cyan-400" />
          <span>擴寫</span>
        </button>

        <button
          onClick={() => handleAction('summarize')}
          disabled={loadingAction !== null}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-slate-200 hover:bg-cyan-500/20 hover:text-cyan-300 transition-all disabled:opacity-50"
          title="精簡提煉重點"
        >
          <Minimize2 className="w-3 h-3 text-purple-400" />
          <span>精簡</span>
        </button>

        <button
          onClick={() => handleAction('rewrite')}
          disabled={loadingAction !== null}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-slate-200 hover:bg-cyan-500/20 hover:text-cyan-300 transition-all disabled:opacity-50"
          title="重寫提升語意順暢度"
        >
          <RefreshCw className="w-3 h-3 text-indigo-400" />
          <span>重寫</span>
        </button>

        <button
          onClick={() => handleAction('headline')}
          disabled={loadingAction !== null}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-slate-200 hover:bg-cyan-500/20 hover:text-cyan-300 transition-all disabled:opacity-50"
          title="轉為新聞大標或小標風格"
        >
          <Heading className="w-3 h-3 text-amber-400" />
          <span>標題化</span>
        </button>

        <button
          onClick={() => setShowCustomInput(!showCustomInput)}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="自訂指令"
        >
          <Wand2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors ml-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Custom Prompt Input */}
      {showCustomInput && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (customPrompt.trim()) handleAction('custom');
          }}
          className="flex items-center gap-1.5 pt-1.5 border-t border-white/10"
        >
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="例如: 改成更嚴肅的權威報導語氣..."
            className="flex-1 px-2.5 py-1 rounded-lg glass-input text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loadingAction !== null || !customPrompt.trim()}
            className="px-2.5 py-1 bg-cyan-500 text-black font-bold rounded-lg text-xs hover:brightness-110 disabled:opacity-40"
          >
            執行
          </button>
        </form>
      )}

      {loadingAction && (
        <div className="text-[10px] text-cyan-300 flex items-center justify-center gap-1.5 py-1">
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span>Gemini AI 潤飾中...</span>
        </div>
      )}
    </div>
  );
}
