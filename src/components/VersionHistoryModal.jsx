import React from 'react';
import { useNewsStore } from '../store/useNewsStore.js';
import { History, RotateCcw, Clock, X, FileText } from 'lucide-react';

export default function VersionHistoryModal() {
  const { 
    versionHistory, 
    setArticle, 
    isHistoryModalOpen, 
    setIsHistoryModalOpen 
  } = useNewsStore();

  if (!isHistoryModalOpen) return null;

  const handleRestore = (item) => {
    setArticle(item.article);
    setIsHistoryModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl glass-panel rounded-2xl p-6 border border-white/20 shadow-2xl max-h-[85vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">新聞報導版本歷史記錄</h2>
              <p className="text-xs text-slate-400">查看與還原至先前儲存的編修快照</p>
            </div>
          </div>
          <button
            onClick={() => setIsHistoryModalOpen(false)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Snapshot List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
          {versionHistory.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              尚無編輯歷程記錄
            </div>
          ) : (
            versionHistory.map((item, index) => (
              <div 
                key={item.id}
                className="group flex items-start justify-between p-3.5 rounded-xl glass-panel-hover border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] transition-all"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0 pr-3">
                  <div className="p-2 rounded-lg bg-white/5 text-slate-400 group-hover:text-cyan-400 shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-cyan-300 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                        {item.label || `版本 #${versionHistory.length - index}`}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                        <Clock className="w-3 h-3" />
                        {item.timestamp}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-200 truncate">
                      {item.article.mainTitle || '無標題草稿'}
                    </p>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {item.article.subTitle || '無副標題'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleRestore(item)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 active:scale-95 transition-all shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>還原此版本</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex justify-end">
          <button
            onClick={() => setIsHistoryModalOpen(false)}
            className="px-4 py-2 text-xs font-semibold bg-white/10 hover:bg-white/15 text-slate-200 rounded-xl transition-all"
          >
            關閉視窗
          </button>
        </div>

      </div>
    </div>
  );
}
