import React, { useState, useRef, useEffect } from 'react';
import { useNewsStore } from '../store/useNewsStore.js';
import { generateNewsCoverImage, generateCanvasCoverPoster } from '../services/imageService.js';
import InlineAiToolbar from './InlineAiToolbar.jsx';
import { 
  Image as ImageIcon, RefreshCw, Sparkles, Clock, FileText, User, Tag, Check, Edit3, Eye, Layers
} from 'lucide-react';

const CATEGORY_OPTIONS = ['科技快訊', '財經趨勢', '國際焦點', '深度報導', '社會觀察', '政治評論'];

export default function ArticleView() {
  const { article, updateArticle } = useNewsStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [selectionInfo, setSelectionInfo] = useState(null);
  
  const bodyRef = useRef(null);

  // Compute Word Count & Read Time
  const plainTextBody = article.body ? article.body.replace(/<[^>]+>/g, '') : '';
  const wordCount = plainTextBody.length;
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 400));

  // Handle Text Selection for Floating AI Toolbar
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSelectionInfo(null);
      return;
    }

    const selectedText = selection.toString().trim();
    if (!selectedText || selectedText.length < 3) {
      setSelectionInfo(null);
      return;
    }

    // Check if selection is within our article container
    if (bodyRef.current && bodyRef.current.contains(selection.anchorNode)) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = bodyRef.current.getBoundingClientRect();

      setSelectionInfo({
        text: selectedText,
        range,
        top: rect.top - containerRect.top,
        left: rect.left - containerRect.left
      });
    }
  };

  // Replace Selected Text with AI Result
  const handleApplyInlineEdit = (newText) => {
    if (!selectionInfo || !selectionInfo.range) return;

    const range = selectionInfo.range;
    range.deleteContents();
    range.insertNode(document.createTextNode(newText));

    // Update body HTML in store
    if (bodyRef.current) {
      updateArticle({ body: bodyRef.current.innerHTML });
    }
    setSelectionInfo(null);
  };

  // Regenerate Unsplash / AI Cover Image
  const handleRegenerateCover = async () => {
    setIsGeneratingCover(true);
    try {
      const newCoverUrl = await generateNewsCoverImage(article.mainTitle, article.category);
      updateArticle({ coverImage: newCoverUrl });
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingCover(false);
    }
  };

  // Generate Canvas Cyber Poster Cover
  const handleCanvasPoster = () => {
    setIsGeneratingCover(true);
    setTimeout(() => {
      const posterDataUrl = generateCanvasCoverPoster(article.mainTitle, article.category);
      updateArticle({ coverImage: posterDataUrl });
      setIsGeneratingCover(false);
    }, 400);
  };

  return (
    <div className="relative flex flex-col h-full glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
      
      {/* Article Top Bar */}
      <div className="px-6 py-3.5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-3">
          {/* Category Tag Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
            <Tag className="w-3.5 h-3.5" />
            <select
              value={article.category}
              onChange={(e) => updateArticle({ category: e.target.value })}
              className="bg-transparent text-cyan-300 focus:outline-none cursor-pointer font-bold"
            >
              {CATEGORY_OPTIONS.map(cat => (
                <option key={cat} value={cat} className="bg-slate-900 text-slate-200">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Reading Stats */}
          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              {wordCount} 字
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              約 {readTimeMinutes} 分鐘閱讀
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isEditing
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
            }`}
          >
            {isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            <span>{isEditing ? '儲存模式' : '編輯模式'}</span>
          </button>
        </div>
      </div>

      {/* Main Article Container */}
      <div 
        className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6"
        onMouseUp={handleTextSelection}
        keyup={handleTextSelection}
      >
        
        {/* Cover Image Block */}
        <div className="relative group rounded-2xl overflow-hidden border border-white/10 bg-slate-900/60 shadow-xl max-h-[320px] flex items-center justify-center">
          {article.coverImage ? (
            <img
              src={article.coverImage}
              alt="新聞報導封面配圖"
              className="w-full h-64 md:h-80 object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-500 text-xs">
              點擊右上角生成 AI 新聞封面圖片
            </div>
          )}

          {/* Floating Cover Action Buttons */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-95 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleRegenerateCover}
              disabled={isGeneratingCover}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-cyan-500 hover:text-black transition-all shadow-lg"
              title="隨機檢索匹配主題的高畫質新聞劇照"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingCover ? 'animate-spin' : ''}`} />
              <span>{isGeneratingCover ? '生成中...' : '換張 AI 寫實圖'}</span>
            </button>
            <button
              onClick={handleCanvasPoster}
              disabled={isGeneratingCover}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-pink-600 border border-white/20 text-white hover:brightness-110 transition-all shadow-lg"
              title="繪製極光毛玻璃風格的新聞大圖"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>生成霓虹海報圖</span>
            </button>
          </div>
        </div>

        {/* Metadata Line */}
        <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <input
              type="text"
              value={article.author}
              onChange={(e) => updateArticle({ author: e.target.value })}
              className="bg-transparent font-medium text-slate-300 focus:outline-none hover:text-white border-b border-transparent focus:border-cyan-500"
            />
          </div>
          <span className="font-mono text-[11px]">{article.publishedAt}</span>
        </div>

        {/* Article Headline (Editable H1) */}
        <div>
          <h1
            contentEditable={isEditing}
            suppressContentEditableWarning
            onBlur={(e) => updateArticle({ mainTitle: e.target.innerText })}
            className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-snug font-sans editable-title"
          >
            {article.mainTitle}
          </h1>
        </div>

        {/* Article Sub-headline (Editable H2) */}
        <div>
          <h2
            contentEditable={isEditing}
            suppressContentEditableWarning
            onBlur={(e) => updateArticle({ subTitle: e.target.innerText })}
            className="text-base md:text-lg font-medium text-slate-300 leading-relaxed font-sans border-l-2 border-cyan-400 pl-4 py-1 italic"
          >
            {article.subTitle}
          </h2>
        </div>

        {/* Article Body Content */}
        <div className="relative pt-4">
          
          {/* Floating Selection AI Toolbar */}
          <InlineAiToolbar
            selectionInfo={selectionInfo}
            onClose={() => setSelectionInfo(null)}
            onApplyEdit={handleApplyInlineEdit}
          />

          <div
            ref={bodyRef}
            contentEditable={isEditing}
            suppressContentEditableWarning
            onBlur={(e) => updateArticle({ body: e.target.innerHTML })}
            dangerouslySetInnerHTML={{ __html: article.body }}
            className="article-body-content focus:outline-none min-h-[300px]"
          />
        </div>

      </div>

    </div>
  );
}
