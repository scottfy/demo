import React from 'react';
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  FileCode2, 
  History, 
  BarChart3, 
  ShieldCheck, 
  HelpCircle,
  ChevronRight,
  TrendingDown
} from 'lucide-react';

export default function SideMenu({ 
  activeView, 
  setActiveView, 
  reports = [], 
  activeReport,
  onSelectReport,
  mobileMenuOpen,
  setMobileMenuOpen
}) {
  const menuItems = [
    {
      id: 'dashboard',
      label: '採購主控台 (Dashboard)',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'manager',
      label: '報告管理員 (Report Manager)',
      icon: FileSpreadsheet,
      badge: reports.length
    },
    {
      id: 'editor',
      label: '報告檢視與 AI 編輯器',
      icon: FileCode2,
      badge: activeReport ? '開啟中' : null
    }
  ];

  const handleItemClick = (id) => {
    setActiveView(id);
    if (setMobileMenuOpen) setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed lg:static top-[57px] bottom-0 left-0 z-40
        w-64 bg-white border-r border-slate-200 flex flex-col justify-between
        transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Navigation Menu Links */}
        <div className="p-4 space-y-6 overflow-y-auto">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              主要視窗 (Navigation)
            </div>
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className={`
                      w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition-all
                      ${isActive 
                        ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm border border-blue-100' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                    `}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Recent Reports Section */}
          <div>
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <History className="w-3 h-3" /> 近期報告清單
              </span>
              <button 
                onClick={() => handleItemClick('manager')}
                className="text-[11px] text-blue-600 hover:underline font-medium"
              >
                查看全部
              </button>
            </div>
            
            <div className="space-y-1">
              {reports.slice(0, 4).map((report) => (
                <button
                  key={report.id}
                  onClick={() => {
                    onSelectReport(report);
                    handleItemClick('editor');
                  }}
                  className={`
                    w-full text-left p-2.5 rounded-lg transition-all group border border-transparent
                    ${activeReport?.id === report.id 
                      ? 'bg-slate-50 border-slate-200 text-blue-700 font-medium' 
                      : 'hover:bg-slate-50 text-slate-700'}
                  `}
                >
                  <div className="text-xs font-semibold truncate group-hover:text-blue-600">
                    {report.title}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>{report.itemCount || 20} 項商品</span>
                    <span className="text-emerald-600 font-semibold">TWD ${report.recommendedPrice?.toLocaleString()}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Procurement Impact Widget at bottom */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 m-3 rounded-2xl border">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-1">
            <TrendingDown className="w-4 h-4 text-emerald-600" />
            <span>採購效益統計</span>
          </div>
          <p className="text-[11px] text-slate-500 mb-2">
            AI 協助企業節約採購成本
          </p>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-white p-2 rounded-lg border border-slate-200/60">
              <div className="text-[10px] text-slate-400 font-medium">平均節省</div>
              <div className="text-sm font-extrabold text-emerald-600">14.6%</div>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-200/60">
              <div className="text-[10px] text-slate-400 font-medium">候選資料庫</div>
              <div className="text-sm font-extrabold text-blue-600">20~50項</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
