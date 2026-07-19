import React, { useState } from 'react';
import { useNewsStore } from '../store/useNewsStore.js';
import { Sparkles, Key, History, Download, Newspaper, Check, FileText, Code } from 'lucide-react';

const TONE_OPTIONS = [
  { label: '⚖️ 客觀中立報導', value: '客觀中立報導' },
  { label: '⚡ 科技快訊 / 爆點', value: '科技快訊' },
  { label: '🔍 深度調查 / 專題', value: '深度調查' },
  { label: '📈 財經與產業專訪', value: '財經專訪' },
  { label: '✒️ 觀點與權威社論', value: '社論觀點' }
];

export default function Header() {
  const { 
    apiKey, 
    setIsApiKeyModalOpen, 
    toneStyle, 
    setToneStyle, 
    versionHistory, 
    setIsHistoryModalOpen,
    article 
  } = useNewsStore();

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Export handlers
  const handleExportMarkdown = () => {
    const md = `# ${article.category} | ${article.mainTitle}\n\n## ${article.subTitle}\n\n*作者: ${article.author} | 發布時間: ${article.publishedAt}*\n\n---\n\n${article.body.replace(/<p>/g, '').replace(/<\/p>/g, '\n\n').replace(/<h3>/g, '### ').replace(/<\/h3>/g, '\n\n').replace(/<blockquote>/g, '> ').replace(/<\/blockquote>/g, '\n\n')}`;
    
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${article.mainTitle.substring(0, 15)}_新聞稿.md`;
    link.click();
    setIsExportOpen(false);
  };

  const handleExportHTML = () => {
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${article.mainTitle}</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.8; color: #1e293b; }
  h1 { font-size: 2.2em; color: #0f172a; margin-bottom: 10px; }
  h2 { font-size: 1.3em; color: #475569; font-weight: normal; margin-bottom: 20px; }
  .meta { color: #64748b; font-size: 0.9em; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 30px; }
  .cover { width: 100%; max-height: 400px; object-fit: cover; border-radius: 8px; margin-bottom: 30px; }
  blockquote { border-left: 4px solid #0284c7; margin: 20px 0; padding: 10px 20px; background: #f0f9ff; }
</style>
</head>
<body>
  <div class="category">${article.category}</div>
  <h1>${article.mainTitle}</h1>
  <h2>${article.subTitle}</h2>
  <div class="meta">記者: ${article.author} | 發布時間: ${article.publishedAt}</div>
  ${article.coverImage ? `<img src="${article.coverImage}" class="cover" alt="新聞封面">` : ''}
  <div class="body">${article.body}</div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${article.mainTitle.substring(0, 15)}_新聞稿.html`;
    link.click();
    setIsExportOpen(false);
  };

  const handleCopyText = () => {
    const plainText = `${article.mainTitle}\n\n${article.subTitle}\n\n${article.body.replace(/<[^>]+>/g, '')}`;
    navigator.clipboard.writeText(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setIsExportOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-white/10 px-4 lg:px-8 py-3 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-pink-500 p-[1px] shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-[#0d1424] rounded-[11px] flex items-center justify-center">
              <Newspaper className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-lg tracking-tight text-white font-sans">
                AI <span className="text-gradient-cyan">Newsroom</span> Co-Pilot
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 rounded-full uppercase">
                v2.5 Pro
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">智慧新聞採編與高質感報導創作 Agent</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Tone Selector */}
          <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">風格：</span>
            <select 
              value={toneStyle} 
              onChange={(e) => setToneStyle(e.target.value)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              {TONE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-200">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* API Key Modal Button */}
          <button
            onClick={() => setIsApiKeyModalOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              apiKey 
                ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20' 
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 animate-pulse'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>{apiKey ? 'API 已連線' : '請設定 API Key'}</span>
          </button>

          {/* Version History Button */}
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all"
            title="檢視編輯快照歷程"
          >
            <History className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">歷史快照</span>
            <span className="px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 rounded-full text-[10px] font-bold">
              {versionHistory.length}
            </span>
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20 hover:brightness-110 active:scale-95 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>匯出報導</span>
            </button>

            {isExportOpen && (
              <div 
                className="absolute right-0 mt-2 w-48 glass-panel rounded-xl shadow-2xl py-2 z-50 border border-white/15 animate-fade-in"
                onMouseLeave={() => setIsExportOpen(false)}
              >
                <button
                  onClick={handleExportMarkdown}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-200 hover:bg-cyan-500/10 hover:text-cyan-300 text-left transition-colors"
                >
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>下載 Markdown (.md)</span>
                </button>
                <button
                  onClick={handleExportHTML}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-200 hover:bg-cyan-500/10 hover:text-cyan-300 text-left transition-colors"
                >
                  <Code className="w-4 h-4 text-indigo-400" />
                  <span>下載完整 HTML (.html)</span>
                </button>
                <div className="my-1 border-t border-white/10" />
                <button
                  onClick={handleCopyText}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-200 hover:bg-cyan-500/10 hover:text-cyan-300 text-left transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <FileText className="w-4 h-4 text-emerald-400" />}
                  <span>{copied ? '已複製到剪貼簿！' : '複製純文字報導'}</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
