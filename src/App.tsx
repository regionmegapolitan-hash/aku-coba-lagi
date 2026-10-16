import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { LoginPage } from './components/LoginPage';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StaffDashboard } from './components/StaffDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { DataSourceModal } from './components/DataSourceModal';
import { UserManagementModal } from './components/UserManagementModal';
import { DisputeModal } from './components/DisputeModal';
import { BroadcastModal } from './components/BroadcastModal';
import { TeachingSession } from './types';
import {
  FileSpreadsheet,
  Shield,
  Building2,
  GraduationCap,
  Database,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

function MainApp() {
  const { currentUser, sessions } = useApp();

  const [activeTab, setActiveTab] = useState<string>(() => {
    if (currentUser?.role === 'guru') return 'teacher_view';
    if (currentUser?.role === 'staf_lokasi') return 'staff_view';
    return 'admin_dashboard';
  });

  // Sync activeTab whenever currentUser changes
  React.useEffect(() => {
    if (currentUser?.role === 'guru') setActiveTab('teacher_view');
    else if (currentUser?.role === 'staf_lokasi') setActiveTab('staff_view');
    else if (currentUser?.role === 'admin_keuangan') setActiveTab('admin_dashboard');
  }, [currentUser]);

  // Modals state
  const [isDataSourceOpen, setIsDataSourceOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [userManagementTab, setUserManagementTab] = useState<'approvals' | 'list' | 'add'>('approvals');
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [disputeModalSession, setDisputeModalSession] = useState<TeachingSession | null>(null);
  const [isReviewDisputeMode, setIsReviewDisputeMode] = useState(false);

  // If user is not logged in, show LoginPage
  if (!currentUser) {
    return <LoginPage />;
  }

  const handleOpenUserManagement = (tab: 'approvals' | 'list' | 'add' = 'approvals') => {
    setUserManagementTab(tab);
    setIsUserManagementOpen(true);
  };

  const handleOpenDispute = (session: TeachingSession) => {
    setDisputeModalSession(session);
    setIsReviewDisputeMode(false);
  };

  const handleOpenReviewDispute = (session: TeachingSession) => {
    setDisputeModalSession(session);
    setIsReviewDisputeMode(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenDataSource={() => setIsDataSourceOpen(true)}
        onOpenUserManagement={() => handleOpenUserManagement('approvals')}
        onOpenSendBroadcast={() => setIsBroadcastOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Render View based on activeTab */}
        {activeTab === 'admin_dashboard' && currentUser.role === 'admin_keuangan' && (
          <AdminDashboard
            onOpenDisputeReviewModal={handleOpenReviewDispute}
            onOpenBroadcastModal={() => setIsBroadcastOpen(true)}
            onOpenUserManagement={() => handleOpenUserManagement('approvals')}
          />
        )}

        {activeTab === 'staff_view' && (
          <StaffDashboard onOpenDisputeModal={handleOpenDispute} />
        )}

        {activeTab === 'teacher_view' && (
          <TeacherDashboard onOpenDisputeModal={handleOpenDispute} />
        )}

        {/* Fallback if role doesn't match activeTab */}
        {activeTab === 'admin_dashboard' && currentUser.role !== 'admin_keuangan' && (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <Shield className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">Akses Terbatas</h3>
            <p className="text-xs text-slate-500 mt-1">
              Menu Dashboard Keuangan hanya dapat diakses oleh Admin Keuangan.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">SI-SESI</span>
            <span>•</span>
            <span>Sistem Pengecekan Sesi Mengajar Real-Time</span>
            <span>•</span>
            <span className="text-slate-400">Periode: 2026-08-25 sd 2026-09-24</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Hak Akses: Admin Keuangan | Staf Lokasi | Guru</span>
            <span>•</span>
            <button
              onClick={() => setIsDataSourceOpen(true)}
              className="text-blue-600 hover:underline font-medium"
            >
              Pengaturan Sumber Data
            </button>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <DataSourceModal
        isOpen={isDataSourceOpen}
        onClose={() => setIsDataSourceOpen(false)}
      />

      <UserManagementModal
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
        initialTab={userManagementTab}
      />

      <DisputeModal
        session={disputeModalSession}
        isOpen={!!disputeModalSession}
        onClose={() => setDisputeModalSession(null)}
        isReviewMode={isReviewDisputeMode}
      />

      <BroadcastModal
        isOpen={isBroadcastOpen}
        onClose={() => setIsBroadcastOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
