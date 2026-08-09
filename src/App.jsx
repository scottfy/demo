import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import SideMenu from './components/SideMenu';
import DashboardView from './components/DashboardView';
import ReportManagerView from './components/ReportManagerView';
import ReportEditorView from './components/ReportEditorView';
import ChatView from './components/ChatView';
import ApiKeyModal from './components/ApiKeyModal';
import { getReports, saveReport, deleteReport } from './services/reportStore';
import { MessageSquare, Sparkles } from 'lucide-react';

export default function App() {
  const [reports, setReports] = useState([]);
  const [activeReport, setActiveReport] = useState(null);
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' | 'manager' | 'editor'
  
  // UI states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load initial reports
  useEffect(() => {
    const loaded = getReports();
    setReports(loaded);
    if (loaded.length > 0) {
      setActiveReport(loaded[0]);
    }
  }, []);

  // When AI generates a new report, save it and open editor view immediately
  const handleReportGenerated = (reportTitle, htmlContent) => {
    const newReport = {
      id: `report-${Date.now()}`,
      title: reportTitle || '新 AI 採購比價報告',
      category: '採購詢價',
      targetItem: 'AI 採購標的品項',
      quantity: 50,
      budgetPerUnit: 15000,
      currency: 'TWD',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'completed',
      itemCount: 22,
      recommendedPrice: 12800,
      credibilityScore: 97,
      activeVersionId: 'v1',
      versions: [
        {
          versionId: 'v1',
          versionLabel: 'V1 - 初步 AI 比價報告',
          createdAt: new Date().toISOString(),
          htmlContent
        }
      ]
    };

    const updatedList = saveReport(newReport);
    setReports(updatedList);
    setActiveReport(newReport);
    setActiveView('editor');
  };

  const handleSaveReport = (updatedReport) => {
    const updatedList = saveReport(updatedReport);
    setReports(updatedList);
    setActiveReport(updatedReport);
  };

  const handleDeleteReport = (id) => {
    const updatedList = deleteReport(id);
    setReports(updatedList);
    if (activeReport?.id === id) {
      setActiveReport(updatedList[0] || null);
    }
  };

  const handleNewReportClick = () => {
    setIsChatOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onNewReportClick={handleNewReportClick}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        activeReport={activeReport}
      />

      {/* Main Layout Container with SideMenu & Main View */}
      <div className="flex-1 flex overflow-hidden">
        <SideMenu
          activeView={activeView}
          setActiveView={setActiveView}
          reports={reports}
          activeReport={activeReport}
          onSelectReport={setActiveReport}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        {/* Center Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {activeView === 'dashboard' && (
            <DashboardView
              reports={reports}
              onSelectReport={setActiveReport}
              onNewReportClick={handleNewReportClick}
              onDeleteReport={handleDeleteReport}
              setActiveView={setActiveView}
            />
          )}

          {activeView === 'manager' && (
            <ReportManagerView
              reports={reports}
              onSelectReport={setActiveReport}
              onDeleteReport={handleDeleteReport}
              onSaveReport={handleSaveReport}
              setActiveView={setActiveView}
            />
          )}

          {activeView === 'editor' && (
            <ReportEditorView
              report={activeReport}
              onSaveReport={handleSaveReport}
              onOpenChatWithPrompt={(prompt) => {
                setIsChatOpen(true);
              }}
            />
          )}
        </main>
      </div>

      {/* Right Side Chat View Panel */}
      <ChatView
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onReportGenerated={handleReportGenerated}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
      />

      {/* Floating Action Button (FAB) when Chat View is closed */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-4 py-3.5 rounded-full shadow-2xl flex items-center gap-2 hover:scale-105 transition-all active:scale-95 group border border-white/20"
        >
          <MessageSquare className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          <span className="text-sm">AI 採購對話助手</span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
        </button>
      )}

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
      />
    </div>
  );
}
