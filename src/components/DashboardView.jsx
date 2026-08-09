import React from 'react';
import { 
  PlusCircle, 
  FileText, 
  TrendingUp, 
  ShieldCheck, 
  Search, 
  ArrowRight, 
  Sparkles,
  Calendar,
  Eye,
  Trash2,
  AlertCircle
} from 'lucide-react';

export default function DashboardView({ 
  reports = [], 
  onSelectReport, 
  onNewReportClick,
  onDeleteReport,
  setActiveView 
}) {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Welcome & Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" /> AI 智慧採購比價助手 2.5 (Pure AI Mode)
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              輕鬆完成採購比價、策略擬定與 HTML5 報告繪製
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              透過 Gemini AI 自動進行多平台比價搜尋與規格對齊、總成本試算與供應商可信度評估。
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onNewReportClick}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <PlusCircle className="w-5 h-5" />
              <span>建立新採購報告</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">已建立比價報告</div>
            <div className="text-2xl font-black text-slate-900">{reports.length} 份</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">預估節省比例</div>
            <div className="text-2xl font-black text-emerald-600">14.6%</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">平均候選商品數</div>
            <div className="text-2xl font-black text-slate-900">20+ 項 / 案</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">可信度評分標準</div>
            <div className="text-2xl font-black text-slate-900">1~100 分</div>
          </div>
        </div>
      </div>

      {/* Reports Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              近期採購報告列表 (Document Cards)
            </h3>
            <p className="text-xs text-slate-500">
              點擊文件卡片即可開啟動態 HTML5 沙盒檢視與 AI 局部微調編輯器
            </p>
          </div>

          {reports.length > 0 && (
            <button 
              onClick={() => setActiveView('manager')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
            >
              觀看全部報告 ({reports.length}) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Empty State when no reports */}
        {reports.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center space-y-4 max-w-lg mx-auto">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-800">尚未建立任何採購報告</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                本系統已停用 Mock 假資料。請點選右上角『設定 API Key』輸入金鑰，然後點擊『建立新採購案』向 AI 說明您的採購目標，即可自動生成報告！
              </p>
            </div>
            <button
              onClick={onNewReportClick}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all"
            >
              立即開啟 AI Chat 建立第一個比價案
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <div 
                key={report.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1"
              >
                {/* Card Header & Badge */}
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {report.category || '採購詢價'}
                    </span>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <ShieldCheck className="w-3 h-3" /> 可信度 {report.credibilityScore || 95}
                    </span>
                  </div>

                  {/* Title */}
                  <div>
                    <h4 
                      onClick={() => {
                        onSelectReport(report);
                        setActiveView('editor');
                      }}
                      className="font-bold text-slate-900 text-base leading-snug cursor-pointer group-hover:text-blue-600 line-clamp-2 transition-colors"
                    >
                      {report.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> 
                      更新時間: {new Date(report.updatedAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Pricing & Quantity Info */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">採購目標與數量:</span>
                      <span className="font-semibold text-slate-800">{report.quantity || 1} 件</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">建議最優單價:</span>
                      <span className="font-extrabold text-blue-600">TWD ${report.recommendedPrice?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {report.versions?.length || 1} 個版本歷史
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onDeleteReport(report.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="刪除報告"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        onSelectReport(report);
                        setActiveView('editor');
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" /> 開啟報告
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
