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
  Camera, 
  X, 
  ChevronDown, 
  PlusCircle, 
  History, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  Maximize2,
  Minimize2,
  ListTodo,
  Loader2,
  FileText
} from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { processProcurementTask } from '../services/geminiAgent';
import { getSessions, saveSessions } from '../services/reportStore';

export default function ChatView({ 
  isOpen, 
  onClose, 
  onReportGenerated,
  initialPrompt = ''
}) {
  const [sessions, setSessions] = useState(getSessions());
  const [activeSessionId, setActiveSessionId] = useState(sessions[0]?.id || 'session-default');
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isComposing, setIsComposing] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  
  // Voice Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef(null);

  // Agent Activity & Task Panel state
  const [agentState, setAgentState] = useState('idle'); // idle | thinking | running_tool
  const [activityTimer, setActivityTimer] = useState(0);
  const [activityText, setActivityText] = useState('');
  const [taskProgress, setTaskProgress] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messages = activeSession?.messages || [];

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, agentState, taskProgress]);

  // Voice recording timer effect
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);
    } else {
      clearInterval(recordingTimerRef.current);
    }
    return () => clearInterval(recordingTimerRef.current);
  }, [isRecording]);

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

  // Handle Voice Recording toggle
  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      // Insert simulated transcribed text into input box
      const transcribedText = "請幫我評估採購 50 台高階人體工學椅，預算每台 15,000 元，請提供至少 20 項比價方案。";
      setInputText(prev => prev ? `${prev} ${transcribedText}` : transcribedText);
    } else {
      // Start recording
      setIsRecording(true);
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
    setAgentState('running_tool');

    // Call Agent Process Engine
    const result = await processProcurementTask({
      userPrompt: cleanText,
      chatHistory: updatedMessages,
      onProgress: (statusMsg) => {
        setActivityText(statusMsg);
      },
      onTaskUpdate: (tasks) => {
        setTaskProgress(tasks);
      }
    });

    // Create Agent Response Message
    const agentMsg = {
      id: `agent-${Date.now()}`,
      sender: 'agent',
      text: result.text,
      timestamp: new Date().toISOString(),
      quickReplies: [
        '一鍵切換全螢幕檢視',
        '要求 AI 局部微調規格',
        '另提超預算備選方案'
      ]
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
      title: `新採購對話 ${sessions.length + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `msg-welcome`,
          sender: 'agent',
          text: '您好！請在此輸入您的採購目標需求（如：品項、預算、數量、品牌偏好），我將為您發起廣泛比價與 HTML5 報告繪製。',
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

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full sm:w-[420px] h-[640px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
      
      {/* Top Bar / Header */}
      <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm leading-none">AI 採購對話助手</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[180px]">
              {activeSession?.title || '新採購比價討論'}
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
              title="歷史對話"
            >
              <History className="w-4 h-4" />
            </button>

            {showHistoryDropdown && (
              <div className="absolute right-0 top-8 w-56 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs">
                <div className="px-3 py-1 font-bold text-slate-400 uppercase text-[10px]">
                  歷史 Sessions ({sessions.length})
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
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
            title="收闔 Chat View"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3.5 shadow-sm text-sm ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none prose-chat'
              }`}
            >
              {/* Render User Attachments */}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {msg.attachments.map(att => (
                    <span key={att.id} className="inline-flex items-center gap-1 text-xs bg-black/20 text-white px-2 py-1 rounded">
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
              <div className="flex flex-wrap gap-1.5 mt-2 max-w-[85%]">
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

        {/* Task Management Progress Panel (長任務步驟面板) */}
        {taskProgress && agentState !== 'idle' && (
          <div className="bg-white border border-blue-200 rounded-2xl p-3.5 shadow-md space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold text-slate-800 border-b border-slate-100 pb-2">
              <span className="flex items-center gap-1.5 text-blue-600">
                <ListTodo className="w-4 h-4" /> 長任務比價執行進度
              </span>
              <span className="text-[10px] text-slate-400">已執行 {activityTimer}s</span>
            </div>

            <div className="space-y-1.5">
              {taskProgress.map(t => (
                <div key={t.id} className="flex items-center justify-between text-slate-600">
                  <div className="flex items-center gap-2">
                    {t.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    {t.status === 'running' && <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />}
                    {t.status === 'pending' && <Clock className="w-4 h-4 text-slate-300" />}
                    <span className={t.status === 'running' ? 'font-bold text-slate-900' : ''}>
                      {t.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Agent Activity Bar */}
        {agentState !== 'idle' && (
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-blue-50/80 p-2.5 rounded-xl border border-blue-100 animate-pulse">
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            <span>{activityText || 'AI 正在處理中...'} ({activityTimer}s)</span>
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

      {/* Voice Mic Recording Bar */}
      {isRecording && (
        <div className="bg-red-500 text-white px-4 py-2 flex items-center justify-between text-xs animate-pulse font-bold">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 animate-bounce" />
            <span>語音轉文字錄音中 ({recordingSeconds}s)... 說完請點擊結束</span>
          </div>
          <button onClick={toggleRecording} className="bg-white text-red-600 px-2.5 py-1 rounded-md text-[11px]">
            結束並帶入
          </button>
        </div>
      )}

      {/* Attachment Popover Menu */}
      {showAttachmentMenu && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-2 absolute bottom-16 left-4 z-50 space-y-1 text-xs font-semibold">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 rounded-lg text-slate-700"
          >
            <Paperclip className="w-4 h-4 text-blue-600" /> 上傳文件 (CSV / PDF / TXT)
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 rounded-lg text-slate-700"
          >
            <ImageIcon className="w-4 h-4 text-emerald-600" /> 上傳商品/規格圖片
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

      {/* Bottom Input Area Structure per ai-agent-ui-support */}
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
          title="新增附件 [+"
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
          placeholder="輸入採購目標、單價預算或比價要求..."
          className="flex-1 bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          disabled={agentState !== 'idle'}
        />

        {/* [MIC] Speech to Text Button */}
        <button
          type="button"
          onClick={toggleRecording}
          className={`p-2 rounded-xl transition-colors ${
            isRecording ? 'mic-recording' : 'text-slate-500 hover:bg-slate-100'
          }`}
          title="語音轉文字 [MIC]"
        >
          <Mic className="w-5 h-5" />
        </button>

        {/* [SEND] Button */}
        <button
          type="submit"
          disabled={agentState !== 'idle' || (!inputText.trim() && attachments.length === 0)}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white p-2 rounded-xl transition-all shadow-sm flex-shrink-0"
          title="發送訊息 [SEND]"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
