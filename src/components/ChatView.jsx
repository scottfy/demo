import React, { useState, useRef, useEffect } from 'react';
import { useNewsStore } from '../store/useNewsStore.js';
import { callGeminiApi, generateStructuredArticle } from '../services/gemini.js';
import { generateNewsCoverImage } from '../services/imageService.js';
import { 
  Send, Sparkles, Bot, User, ArrowRight, Zap, RefreshCw, Key, MessageSquareText, FileCheck 
} from 'lucide-react';

const QUICK_PROMPTS = [
  { icon: '💡', text: '發想 3 個抓人眼球的爆款大標與副標' },
  { icon: '📝', text: '針對目前主題生成 500 字標準新聞大綱' },
  { icon: '🔍', text: '補充此新聞事件背景數據與專家觀點' },
  { icon: '🚀', text: '請生成一篇完整新聞報導並帶入右側' }
];

export default function ChatView() {
  const { 
    apiKey, 
    toneStyle, 
    chatHistory, 
    addChatMessage, 
    updateArticle, 
    setIsApiKeyModalOpen,
    isGenerating,
    setIsGenerating
  } = useNewsStore();

  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isGenerating]);

  const handleSendMessage = async (customPrompt = null) => {
    const messageToSend = customPrompt || inputMessage;
    if (!messageToSend.trim()) return;

    if (!apiKey) {
      setIsApiKeyModalOpen(true);
      return;
    }

    // Add User Message
    addChatMessage({
      role: 'user',
      content: messageToSend
    });

    if (!customPrompt) {
      setInputMessage('');
    }

    setIsGenerating(true);

    try {
      // Check if user specifically requested full article generation
      const isFullArticleRequest = messageToSend.includes('帶入右側') || messageToSend.includes('生成一篇完整新聞') || messageToSend.includes('完整報導');

      if (isFullArticleRequest) {
        const structuredData = await generateStructuredArticle(apiKey, messageToSend, toneStyle);
        
        // Generate cover image matching topic
        const coverUrl = await generateNewsCoverImage(messageToSend, structuredData.category);

        const newArticleData = {
          category: structuredData.category || '科技快訊',
          mainTitle: structuredData.mainTitle || '無標題新聞',
          subTitle: structuredData.subTitle || '',
          coverImage: coverUrl,
          publishedAt: new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          body: structuredData.body || ''
        };

        // Sync to right article view
        updateArticle(newArticleData);

        addChatMessage({
          role: 'model',
          content: `✅ 已為您成功生成報導並同步帶入右側文章視窗！\n\n**大標題**：${structuredData.mainTitle}\n**副標題**：${structuredData.subTitle}\n\n您可以隨時在右側點擊內文進行人工編修，或是選取任意文字進行 AI 局部潤飾。`,
          suggestedArticle: newArticleData
        });
      } else {
        // Normal conversational exchange
        const reply = await callGeminiApi(apiKey, {
          prompt: messageToSend,
          history: chatHistory,
          toneStyle
        });

        addChatMessage({
          role: 'model',
          content: reply
        });
      }
    } catch (err) {
      addChatMessage({
        role: 'model',
        content: `❌ **發生錯誤**：${err.message || '無法連線至 Gemini API'}`
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyToArticle = async (msg) => {
    if (msg.suggestedArticle) {
      updateArticle(msg.suggestedArticle);
    } else {
      // If pure text, parse or generate structured
      setIsGenerating(true);
      try {
        const structured = await generateStructuredArticle(apiKey, msg.content, toneStyle);
        const coverUrl = await generateNewsCoverImage(msg.content, structured.category);
        updateArticle({
          ...structured,
          coverImage: coverUrl,
          publishedAt: new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        });
      } catch (err) {
        alert('解析失敗: ' + err.message);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-full glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
      
      {/* Panel Header */}
      <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              AI 採編助手視窗
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </h2>
            <p className="text-[11px] text-slate-400">討論報導主題、大綱與風格設定</p>
          </div>
        </div>

        {/* Quick Clear or Status */}
        <div className="text-[11px] text-slate-400 bg-white/5 px-2.5 py-1 rounded-md">
          {toneStyle}
        </div>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* API Key Missing Warning Banner */}
        {!apiKey && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400 shrink-0" />
              <span>目前尚未輸入 API Key，請先設定以開啟 AI 採編功能。</span>
            </div>
            <button
              onClick={() => setIsApiKeyModalOpen(true)}
              className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg font-semibold shrink-0 transition-colors"
            >
              設定 Key
            </button>
          </div>
        )}

        {chatHistory.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 p-[1px] shrink-0 mt-1 shadow-md shadow-cyan-500/20">
                <div className="w-full h-full bg-[#0c1322] rounded-[11px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
            )}

            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none shadow-lg shadow-cyan-600/20'
                : 'glass-panel border border-white/10 text-slate-200 rounded-tl-none'
            }`}>
              {/* Message Content */}
              <div className="whitespace-pre-wrap font-sans">
                {msg.content}
              </div>

              {/* Apply to Article Button if model reply */}
              {msg.role === 'model' && (
                <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400 font-mono">{msg.timestamp}</span>
                  <button
                    onClick={() => handleApplyToArticle(msg)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 active:scale-95 transition-all"
                  >
                    <ArrowRight className="w-3 h-3" />
                    <span>帶入右側文章視窗</span>
                  </button>
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {/* Loading Indicator */}
        {isGenerating && (
          <div className="flex items-center gap-3 text-cyan-400 text-xs py-2 animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
            </div>
            <span>AI 記者採編撰寫中，請稍候...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Container */}
      <div className="px-4 py-2 bg-black/20 border-t border-white/5 flex gap-2 overflow-x-auto no-scrollbar">
        {QUICK_PROMPTS.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(item.text)}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:border-cyan-500/40 hover:text-cyan-300 transition-all shrink-0 disabled:opacity-50"
          >
            <span>{item.icon}</span>
            <span>{item.text}</span>
          </button>
        ))}
      </div>

      {/* Chat Input Area */}
      <div className="p-3 bg-black/30 border-t border-white/10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="輸入新聞素材、採訪摘要或對話內容..."
            disabled={isGenerating}
            className="flex-1 px-4 py-2.5 rounded-xl glass-input text-xs sm:text-sm placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isGenerating || !inputMessage.trim()}
            className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:brightness-110 active:scale-95 disabled:opacity-40 transition-all shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
}
