import React, { useState } from 'react';
import { Key, Check, AlertCircle, Loader2, X, Shield, ExternalLink } from 'lucide-react';
import { getStoredApiKey, setStoredApiKey } from '../services/reportStore';
import { validateApiKey } from '../services/geminiAgent';

export default function ApiKeyModal({ isOpen, onClose }) {
  const [keyInput, setKeyInput] = useState(getStoredApiKey());
  const [isValidating, setIsValidating] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!keyInput.trim()) {
      setStoredApiKey('');
      setStatusMessage({ type: 'info', text: '已改為模擬測試模式。' });
      setTimeout(onClose, 800);
      return;
    }

    setIsValidating(true);
    setStatusMessage(null);

    const valid = await validateApiKey(keyInput.trim());
    setIsValidating(false);

    if (valid) {
      setStoredApiKey(keyInput.trim());
      setStatusMessage({ type: 'success', text: '✅ Gemini API Key 驗證成功！已儲存。' });
      setTimeout(onClose, 1000);
    } else {
      setStatusMessage({ type: 'error', text: '❌ API Key 驗證失敗，請檢查 Key 是否正確或具備存取權限。' });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 relative animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg">設定 Gemini API 金鑰</h3>
            <p className="text-xs text-slate-500">啟用真實大語言模型進行多平台比價與 HTML5 報告繪製</p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 text-xs text-blue-800 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-blue-900">
            <Shield className="w-4 h-4 text-blue-600" /> 金鑰安全聲明
          </div>
          <p className="text-blue-700 leading-relaxed">
            API Key 僅於您的個人瀏覽器端以 `@google/genai` 進行驗證，絕不會傳送至本機以外的第三方伺服器。若未輸入，系統將使用預載強大比價引擎 (Mock Engine)。
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Google Gemini API Key (AIZA... 開頭)
            </label>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="貼上 AIZA... 開頭的金鑰"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Status Alert Message */}
          {statusMessage && (
            <div className={`p-3 rounded-xl text-xs font-semibold ${
              statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
              statusMessage.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
              'bg-slate-100 text-slate-700'
            }`}>
              {statusMessage.text}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              取得免費 Gemini Key <ExternalLink className="w-3 h-3" />
            </a>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                取消
              </button>

              <button
                type="submit"
                disabled={isValidating}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>驗證中...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>儲存與驗證</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
