import React, { useState, useEffect, useRef } from 'react';
import { 
  FileCode2, 
  Maximize2, 
  Minimize2, 
  Printer, 
  History, 
  Sparkles, 
  Edit2, 
  Eye, 
  RefreshCw, 
  Send,
  Layers,
  HelpCircle,
  Download
} from 'lucide-react';
import { modifyReportBlock } from '../services/geminiAgent';

export default function ReportEditorView({ 
  report, 
  onSaveReport,
  onOpenChatWithPrompt
}) {
  if (!report) {
    return (
      <div className="p-12 text-center text-slate-500 space-y-4 max-w-md mx-auto">
        <FileCode2 className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="text-lg font-bold text-slate-700">尚未選擇採購報告</h3>
        <p className="text-xs">請至 Dashboard 或 Report Manager 點選一份報告以開啟檢視與編輯。</p>
      </div>
    );
  }

  const [activeVersionId, setActiveVersionId] = useState(
    report.activeVersionId || (report.versions && report.versions[0]?.versionId) || 'v1'
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isModifying, setIsModifying] = useState(false);

  const iframeRef = useRef(null);

  const versions = report.versions || [
    { versionId: 'v1', versionLabel: 'V1 - 原始生成報告', htmlContent: report.htmlContent || '' }
  ];

  const currentVersion = versions.find(v => v.versionId === activeVersionId) || versions[0];
  const activeHtml = currentVersion?.htmlContent || '';

  // Handle printing iframe content
  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.print();
    } else {
      window.print();
    }
  };

  // Block Edit handler
  const handleBlockEditSubmit = async (e) => {
    e.preventDefault();
    if (!editPrompt.trim()) return;

    setIsModifying(true);
    try {
      const updatedHtml = await modifyReportBlock({
        currentHtml: activeHtml,
        blockId: selectedBlockId || 'general',
        userPrompt: editPrompt,
        onProgress: null
      });

      const newVerId = `v${versions.length + 1}`;
      const newVersion = {
        versionId: newVerId,
        versionLabel: `V${versions.length + 1} - AI 局部微調 (${editPrompt.slice(0, 15)}...)`,
        createdAt: new Date().toISOString(),
        htmlContent: updatedHtml
      };

      const updatedReport = {
        ...report,
        activeVersionId: newVerId,
        versions: [newVersion, ...versions]
      };

      onSaveReport(updatedReport);
      setActiveVersionId(newVerId);
      setEditPrompt('');
      setSelectedBlockId(null);
      setIsEditMode(false);
    } catch (err) {
      console.error('Block modification failed:', err);
    } finally {
      setIsModifying(false);
    }
  };

  return (
    <div className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-900' : 'h-[calc(100vh-57px)]'}`}>
      {/* Report Editor Top Action Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between z-20 flex-wrap gap-2">
        {/* Title & Version Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="font-extrabold text-slate-900 text-sm truncate max-w-xs md:max-w-md">
              {report.title}
            </h2>
          </div>

          {/* Version Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <select
              value={activeVersionId}
              onChange={(e) => setActiveVersionId(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
            >
              {versions.map((v) => (
                <option key={v.versionId} value={v.versionId}>
                  {v.versionLabel || v.versionId}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher: Preview vs Edit */}
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center gap-1">
            <button
              onClick={() => setIsEditMode(false)}
              className={`text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1 transition-all ${
                !isEditMode
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> 預覽模式
            </button>
            <button
              onClick={() => setIsEditMode(true)}
              className={`text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1 transition-all ${
                isEditMode
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit2 className="w-3.5 h-3.5" /> 局部 AI 框選編輯
            </button>
          </div>

          {/* Print / PDF Button */}
          <button
            onClick={handlePrint}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border border-slate-200"
            title="列印或下載為 PDF 文件"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">列印 / PDF</span>
          </button>

          {/* Fullscreen Toggle Button */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
            title={isFullscreen ? '退出全螢幕' : '全螢幕簡報模式'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? '退出全螢幕' : '全螢幕簡報'}</span>
          </button>
        </div>
      </div>

      {/* Edit Mode Prompt Banner Overlay */}
      {isEditMode && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 px-6 flex items-center justify-between text-xs z-20 shadow-md">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-200 animate-spin" />
            <span className="font-bold">局部 AI 框選微調模式：</span>
            <span className="text-blue-100 hidden sm:inline">
              點擊下方報告中的任何區塊，或直接輸入提示詞讓 AI 修改該區域排版、價格或內文。
            </span>
          </div>

          <form onSubmit={handleBlockEditSubmit} className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <input
              type="text"
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              placeholder="例如：將試算器調整為最大200台，並加上含稅說明..."
              className="px-3 py-1.5 bg-white/10 text-white placeholder-blue-200 border border-white/20 rounded-lg text-xs w-64 focus:outline-none focus:bg-white/20"
              disabled={isModifying}
            />
            <button
              type="submit"
              disabled={isModifying}
              className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all disabled:opacity-50"
            >
              <Send className="w-3 h-3" />
              <span>{isModifying ? '修改中...' : '要求 AI 微調'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Paper Canvas Sandbox Container */}
      <div className="flex-1 bg-slate-900 overflow-y-auto p-4 md:p-8 flex justify-center items-start">
        <div 
          className={`
            bg-white transition-all duration-300 relative
            ${isFullscreen ? 'w-full max-w-full rounded-none min-h-screen' : 'w-full max-w-5xl rounded-lg shadow-2xl min-h-[900px] my-4'}
            ${isEditMode ? 'ring-4 ring-blue-500/50' : ''}
          `}
        >
          {/* Paper Shadow Header Bar inside paper */}
          <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 rounded-t-lg" />

          {/* HTML5 Iframe Sandbox */}
          <iframe
            ref={iframeRef}
            srcDoc={activeHtml}
            title={report.title}
            sandbox="allow-scripts allow-same-origin allow-modals allow-popups"
            className="w-full min-h-[850px] border-none rounded-b-lg"
            style={{ height: isFullscreen ? 'calc(100vh - 60px)' : '900px' }}
          />
        </div>
      </div>
    </div>
  );
}
