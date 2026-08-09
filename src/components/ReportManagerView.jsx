import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  Download, 
  Sparkles,
  Calendar,
  Layers,
  Filter,
  Check
} from 'lucide-react';

export default function ReportManagerView({ 
  reports = [], 
  onSelectReport, 
  onDeleteReport, 
  onSaveReport,
  setActiveView 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [renamingReport, setRenamingReport] = useState(null);
  const [newTitle, setNewTitle] = useState('');

  const categories = ['ALL', ...new Set(reports.map(r => r.category).filter(Boolean))];

  const filteredReports = reports.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (r.targetItem && r.targetItem.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'ALL' || r.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenRename = (report) => {
    setRenamingReport(report);
    setNewTitle(report.title);
  };

  const handleConfirmRename = () => {
    if (!renamingReport || !newTitle.trim()) return;
    const updated = { ...renamingReport, title: newTitle.trim() };
    onSaveReport(updated);
    setRenamingReport(null);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            採購報告管理員 (Report Manager)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            檢視、搜尋、更名、版本管理與開啟歷史採購比價報告
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
            共 {filteredReports.length} 份報告
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜尋報告名稱、商品名稱或關鍵字..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-slate-400 mr-1 flex-shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex-shrink-0 ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'ALL' ? '全部類別' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Table View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">報告名稱與品項</th>
                <th className="px-4 py-4">類別</th>
                <th className="px-4 py-4">建議最優單價</th>
                <th className="px-4 py-4">候選廠商</th>
                <th className="px-4 py-4">可信度</th>
                <th className="px-4 py-4">更新日期</th>
                <th className="px-6 py-4 text-right">操作按鈕</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Title & Target */}
                  <td className="px-6 py-4">
                    <div 
                      onClick={() => {
                        onSelectReport(report);
                        setActiveView('editor');
                      }}
                      className="font-bold text-slate-900 cursor-pointer hover:text-blue-600 transition-colors"
                    >
                      {report.title}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      目標: {report.targetItem || '未設定規格'} ({report.quantity || 1} 件)
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-4">
                    <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-md">
                      {report.category || '採購詢價'}
                    </span>
                  </td>

                  {/* Best Price */}
                  <td className="px-4 py-4 font-black text-blue-600">
                    TWD ${report.recommendedPrice?.toLocaleString()}
                  </td>

                  {/* Item Count */}
                  <td className="px-4 py-4 text-slate-600 font-medium">
                    {report.itemCount || 20} 家
                  </td>

                  {/* Credibility */}
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {report.credibilityScore || 95} 分
                    </span>
                  </td>

                  {/* Updated At */}
                  <td className="px-4 py-4 text-xs text-slate-500 whitespace-nowrap">
                    {new Date(report.updatedAt).toLocaleDateString()}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenRename(report)}
                        className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="更名報告"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onDeleteReport(report.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="刪除報告"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          onSelectReport(report);
                          setActiveView('editor');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" /> 開啟
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rename Modal */}
      {renamingReport && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-blue-600" /> 更名採購報告
            </h3>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="請輸入新的報告標題..."
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRenamingReport(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-semibold"
              >
                取消
              </button>
              <button
                onClick={handleConfirmRename}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-1"
              >
                <Check className="w-4 h-4" /> 儲存變更
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
