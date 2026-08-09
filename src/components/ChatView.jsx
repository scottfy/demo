import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  User, 
  Send, 
  Plus, 
  Mic, 
  MicOff, 
  Paperclip, 
  Image as ImageIcon, 
  X, 
  PlusCircle, 
  History, 
  Trash2, 
  Loader2, 
  Key,
  Sparkles,
  Database,
  Search
} from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { processProcurementTask } from '../services/geminiAgent';
import { getSessions, saveSessions, getStoredApiKey } from '../services/reportStore';

export default function ChatView({ 
  isOpen, 
  onClose, 
  onReportGenerated,
  onOpenApiKeyModal
}) {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState('');
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isComposing, setIsComposing] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  
  // Web Speech API Voice Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recognitionRef = useRef(null);
  const recordingTimerRef = useRef(null);

  // Agent Activity state
  const [agentState, setAgentState] = useState('idle'); // idle | thinking | running_tool
  const [activityTimer, setActivityTimer] = useState(0);
  const [activityText, setActivityText] = useState('');

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load sessions on mount
  useEffect(() => {
    const loaded = getSessions();
    setSessions(loaded);
    if (loaded.length > 0) {
      setActiveSessionId(loaded[0].id);
    }
  }, []);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messages = activeSession?.messages || [];

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, agentState, activityText]);

  // Activity timer effect
  useEffect(() => {
    let timer;
    if (agentState !== 'idle') {
      setActivityTimer(0);
      timer = setInterval(() => {
        setActivityTimer(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [agentState]);

  // Web Speech API Initialization & Toggle
  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    } else {
      // Start recording using browser Web Speech API
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert('您的瀏覽器不支援 Web Speech 語音識別 API，請切換至 Chrome 或 Edge 瀏覽器嘗試。');
        return;
      }

      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'zh-TW';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript) {
            setInputText(prev => (prev ? `${prev} ${transcript}` : transcript));
          }
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
          clearInterval(recordingTimerRef.current);
        };

        recognition.onend = () => {
          setIsRecording(false);
          clearInterval(recordingTimerRef.current);
        };

        recognition.start();
        recognitionRef.current = recognition;
        setIsRecording(true);

        setRecordingSeconds(0);
        recordingTimerRef.current = setInterval(() => {
          setRecordingSeconds(s => s + 1);
        }, 1000);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  // Handle File Upload
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type.startsWith('image/') ? 'image' : 'file',
      size: (file.size / 1024).toFixed(1) + ' KB',
      url: URL.createObjectURL(file)
    }));
    setAttachments(prev => [...prev, ...newAttachments]);
    setShowAttachmentMenu(false);
  };

  // Handle Send Message
  const handleSend = async (textToSend = inputText) => {
    const cleanText = textToSend.trim();
    if (!cleanText && attachments.length === 0) return;
    if (agentState !== 'idle') return;

    const apiKey = getStoredApiKey();
    if (!apiKey) {
      if (onOpenApiKeyModal) onOpenApiKeyModal();
      return;
    }

    // Create User Message
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: cleanText,
      attachments: [...attachments],
      timestamp: new Date().toISOString()
    };

    // Update Session Messages
    const updatedMessages = [...messages, userMsg];
    updateActiveSessionMessages(updatedMessages);

    setInputText('');
    setAttachments([]);
    setAgentState('thinking');
    setActivityText('AI 正在思考與規劃分析維度...');

    // Call Direct AI Agent Engine
    const result = await processProcurementTask({
      userPrompt: cleanText,
      chatHistory: updatedMessages,
      onActivityState: (state, text) => {
        setAgentState(state);
        setActivityText(text);
      }
    });

    // Create Agent Response Message
    const agentMsg = {
      id: `agent-${Date.now()}`,
      sender: 'agent',
      text: result.text,
      timestamp: new Date().toISOString(),
      quickReplies: result.reportHtml ? [
        '開啟全螢幕簡報',
        '進行局部 AI 框選微調',
        '查詢更多庫存細節'
      ] : undefined
    };

    const finalMessages = [...updatedMessages, agentMsg];
    updateActiveSessionMessages(finalMessages);

    setAgentState('idle');
    setActivityText('');

    if (result.reportHtml && onReportGenerated) {
      onReportGenerated(result.reportTitle, result.reportHtml);
    }
  };

  const updateActiveSessionMessages = (newMsgs) => {
    const updated = sessions.map(s => {
      if (s.id === activeSessionId) {
        return { ...s, messages: newMsgs, updatedAt: new Date().toISOString() };
      }
      return s;
    });
    setSessions(updated);
    saveSessions(updated);
  };

  const handleNewSession = () => {
    const newSess = {
      id: `session-${Date.now()}`,
      title: `數據分析對話 ${sessions.length + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `msg-welcome`,
          sender: 'agent',
          text: '您好！我是您的 **數據分析與比較報表小幫手**。\n\n我可以協助您查詢 Northwind 銷售庫存資料庫、搜尋公開市場數據，並繪製包含 Chart.js 的互動式 HTML5 報告。請直接說明您的分析或比價目標！',
          timestamp: new Date().toISOString()
        }
      ]
    };
    const updated = [newSess, ...sessions];
    setSessions(updated);
    setActiveSessionId(newSess.id);
    saveSessions(updated);
  };

  const handleDeleteSession = (id, e) => {
    e.stopPropagation();
    if (sessions.length <= 1) return;
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    setActiveSessionId(updated[0].id);
    saveSessions(updated);
  };

  if (!isOpen) return null;

  const apiKeyMissing = !getStoredApiKey();

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full sm:w-[440px] h-[660px] max-h-[88vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
      
      {/* Top Bar / Header */}
      <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between z-10 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm leading-none text-white">分析報表小幫手</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[180px]">
              {activeSession?.title || '數據分析對話'}
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleNewSession}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="開啟新對話 Session"
          >
            <PlusCircle className="w-4 h-4" />
          </button>

          {/* Session History Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="歷史對話紀錄"
            >
              <History className="w-4 h-4" />
            </button>

            {showHistoryDropdown && (
              <div className="absolute right-0 top-8 w-60 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 py-2 z-50 text-xs">
                <div className="px-3 py-1 font-bold text-slate-400 uppercase text-[10px]">
                  歷史對話 ({sessions.length})
                </div>
                <div className="max-h-52 overflow-y-auto divide-y divide-slate-100">
                  {sessions.map(s => (
                    <div
                      key={s.id}
                      onClick={() => {
                        setActiveSessionId(s.id);
                        setShowHistoryDropdown(false);
                      }}
                      className={`px-3 py-2 cursor-pointer flex items-center justify-between hover:bg-slate-50 ${
                        s.id === activeSessionId ? 'bg-blue-50 font-bold text-blue-600' : ''
                      }`}
                    >
                      <span className="truncate pr-2">{s.title}</span>
                      {sessions.length > 1 && (
                        <button
                          onClick={(e) => handleDeleteSession(s.id, e)}
                          className="text-slate-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="關閉對話視窗"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* API Key Missing Notice Banner */}
      {apiKeyMissing && (
        <div className="bg-amber-500 text-slate-900 px-4 py-2 flex items-center justify-between text-xs font-bold border-b border-amber-600">
          <div className="flex items-center gap-1.5">
            <Key className="w-4 h-4" />
            <span>未設定 API Key，無法呼叫 Gemini API。</span>
          </div>
          <button
            onClick={onOpenApiKeyModal}
            className="bg-slate-900 text-white px-2.5 py-1 rounded-md text-[11px] hover:bg-slate-800 transition-colors"
          >
            立即設定 Key
          </button>
        </div>
      )}

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl p-3.5 shadow-sm text-sm ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none prose-chat shadow-slate-100'
              }`}
            >
              {/* Render User Attachments */}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {msg.attachments.map(att => (
                    <span key={att.id} className="inline-flex items-center gap-1 text-xs bg-black/20 text-white px-2 py-1 rounded-md">
                      <Paperclip className="w-3 h-3" /> {att.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Message Body Content */}
              {msg.sender === 'agent' ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(marked.parse(msg.text || ''))
                  }}
                />
              ) : (
                <p className="whitespace-pre-wrap">{msg.text}</p>
              )}
            </div>

            {/* Quick Replies Action Chips */}
            {msg.quickReplies && (
              <div className="flex flex-wrap gap-1.5 mt-2 max-w-[88%]">
                {msg.quickReplies.map((qr, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(qr)}
                    className="text-xs font-semibold bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 px-2.5 py-1 rounded-full shadow-sm transition-all"
                  >
                    {qr}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Agent Activity Bar (真實工具執行狀態) */}
        {agentState !== 'idle' && (
          <div className="flex items-center gap-2.5 text-xs text-slate-700 bg-blue-50/90 p-3 rounded-xl border border-blue-200 shadow-sm animate-pulse">
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
            <span className="font-semibold">{activityText || 'AI 正在進行資料分析與工具調用...'}</span>
            <span className="text-[10px] text-blue-500 font-mono ml-auto">{activityTimer}s</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Attachments Preview Bar */}
      {attachments.length > 0 && (
        <div className="bg-slate-100 px-3 py-2 border-t border-slate-200 flex items-center gap-2 overflow-x-auto">
          {attachments.map(att => (
            <div key={att.id} className="bg-white border border-slate-300 text-xs px-2 py-1 rounded-lg flex items-center gap-1 flex-shrink-0">
              <Paperclip className="w-3 h-3 text-slate-400" />
              <span className="truncate max-w-[100px]">{att.name}</span>
              <button onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))} className="text-slate-400 hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Web Speech Voice Recording Status Bar */}
      {isRecording && (
        <div className="bg-red-500 text-white px-4 py-2 flex items-center justify-between text-xs animate-pulse font-bold">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 animate-bounce" />
            <span>語音辨識錄音中 ({recordingSeconds}s)... 說完請點擊結束</span>
          </div>
          <button onClick={toggleRecording} className="bg-white text-red-600 px-2.5 py-1 rounded-md text-[11px]">
            結束語音帶入
          </button>
        </div>
      )}

      {/* Attachment Popover Menu */}
      {showAttachmentMenu && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xl p-2 absolute bottom-16 left-4 z-50 space-y-1 text-xs font-semibold">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 rounded-lg text-slate-700"
          >
            <Paperclip className="w-4 h-4 text-blue-600" /> 上傳數據文件 (CSV / PDF / TXT)
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 rounded-lg text-slate-700"
          >
            <ImageIcon className="w-4 h-4 text-emerald-600" /> 上傳圖檔 / 規格圖片
          </button>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        multiple
        className="hidden"
      />

      {/* Bottom Input Area Structure per ai-agent-ui-support: [+] ___input___ [MIC][SEND] */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
      >
        {/* [+] Attachment Button */}
        <button
          type="button"
          onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
          title="上傳附件 [+]"
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* Text Input with IME Protection */}
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (isComposing || e.keyCode === 229) return;
              if (!e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }
          }}
          placeholder={apiKeyMissing ? "請先點擊上方設定 API Key..." : "輸入數據分析需求或報表生成指令..."}
          className="flex-1 bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          disabled={agentState !== 'idle' || apiKeyMissing}
        />

        {/* [MIC] Speech-to-Text Button */}
        <button
          type="button"
          onClick={toggleRecording}
          disabled={apiKeyMissing}
          className={`p-2 rounded-xl transition-colors ${
            isRecording ? 'bg-red-100 text-red-600 animate-pulse' : 'text-slate-500 hover:bg-slate-100'
          }`}
          title="語音轉文字 [MIC]"
        >
          <Mic className="w-5 h-5" />
        </button>

        {/* [SEND] Button */}
        <button
          type="submit"
          disabled={agentState !== 'idle' || (!inputText.trim() && attachments.length === 0) || apiKeyMissing}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white p-2 rounded-xl transition-all shadow-sm flex-shrink-0"
          title="發送對話 [SEND]"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
