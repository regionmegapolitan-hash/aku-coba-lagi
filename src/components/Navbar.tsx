import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Bell,
  RefreshCw,
  LogOut,
  User as UserIcon,
  Shield,
  Building2,
  GraduationCap,
  Users,
  Database,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  ChevronDown,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenDataSource: () => void;
  onOpenUserManagement: () => void;
  onOpenSendBroadcast: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenDataSource,
  onOpenUserManagement,
  onOpenSendBroadcast,
}) => {
  const {
    currentUser,
    logout,
    syncData,
    isSyncing,
    dataSourceConfig,
    notifications,
    pendingApprovalCount,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserSwitcher, setShowUserSwitcher] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  const handleSyncClick = async () => {
    const res = await syncData();
    setSyncToast(res.message);
    setTimeout(() => setSyncToast(null), 4000);
  };

  const roleBadge = () => {
    if (!currentUser) return null;
    switch (currentUser.role) {
      case 'admin_keuangan':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Shield className="w-3.5 h-3.5" />
            Admin Wilayah
          </span>
        );
      case 'staf_lokasi':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Building2 className="w-3.5 h-3.5" />
            Staf: {currentUser.assignedLocation || 'Cabang'}
          </span>
        );
      case 'guru':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <GraduationCap className="w-3.5 h-3.5" />
            Guru ({currentUser.nopeg ? `Nopeg: ${currentUser.nopeg}` : currentUser.name})
          </span>
        );
    }
  };

  const filteredNotifs = notifications.filter((n) => {
    if (!currentUser) return false;
    const matchRole = !n.targetRole || n.targetRole === 'ALL' || n.targetRole === currentUser.role;
    const matchNopeg = !n.targetNopeg || n.targetNopeg === currentUser.nopeg;
    return matchRole && matchNopeg;
  });

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">
                  SI-SESI
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-slate-100 text-slate-600 rounded">
                  v2.0 Real-Time
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">
                Sistem Pengecekan & Verifikasi Sesi Mengajar
              </p>
            </div>
          </div>

          {/* Navigation Items (Role-based tabs) */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
            {currentUser?.role === 'admin_keuangan' && (
              <>
                <button
                  onClick={() => setActiveTab('admin_dashboard')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'admin_dashboard'
                      ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Dashboard Wilayah
                </button>
                <button
                  onClick={() => setActiveTab('staff_view')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'staff_view'
                      ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Dashboard Lokasi
                </button>
                <button
                  onClick={() => setActiveTab('teacher_view')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'teacher_view'
                      ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Dashboard Guru
                </button>
              </>
            )}

            {currentUser?.role === 'staf_lokasi' && (
              <>
                <button
                  onClick={() => setActiveTab('staff_view')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'staff_view'
                      ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Dashboard Lokasi
                </button>
                <button
                  onClick={() => setActiveTab('teacher_view')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'teacher_view'
                      ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Dashboard Guru
                </button>
              </>
            )}

            {currentUser?.role === 'guru' && (
              <button
                onClick={() => setActiveTab('teacher_view')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  activeTab === 'teacher_view'
                    ? 'bg-white text-amber-800 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Dashboard Guru
              </button>
            )}
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            {/* Live Sync Status Pill & Button */}
            <button
              onClick={handleSyncClick}
              disabled={isSyncing}
              title="Sinkronisasi Data Real-Time dari Spreadsheet"
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                isSyncing
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : 'text-slate-500'}`}
              />
              <span className="hidden sm:inline">
                {isSyncing ? 'Menyinkronkan...' : 'Sync Real-Time'}
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </button>

            {/* Data Source Configuration button */}
            <button
              onClick={onOpenDataSource}
              title="Pengaturan Sumber Data (Google Sheets / Excel)"
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition"
            >
              <Database className="w-4 h-4" />
            </button>

            {/* Admin User Management Button */}
            {currentUser?.role === 'admin_keuangan' && (
              <>
                <button
                  onClick={onOpenUserManagement}
                  title="Manajemen Pengguna & Persetujuan Akun"
                  className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition"
                >
                  <Users className="w-4 h-4" />
                  {pendingApprovalCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs animate-pulse">
                      {pendingApprovalCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={onOpenSendBroadcast}
                  title="Kirim Notifikasi / Pengumuman ke Guru & Staf"
                  className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                >
                  <Bell className="w-3.5 h-3.5" />
                  Broadcast
                </button>
              </>
            )}

            {/* Notification Center */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition"
                title="Notifikasi Verifikasi"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-slate-700" />
                      <h4 className="text-xs font-bold text-slate-900">
                        Notifikasi Verifikasi ({filteredNotifs.length})
                      </h4>
                    </div>
                    {unreadNotificationCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-[11px] text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Tandai Semua Dibaca
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 mt-1">
                    {filteredNotifs.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        Tidak ada notifikasi saat ini
                      </div>
                    ) : (
                      filteredNotifs.map((n) => {
                        const isUnread = currentUser && !n.readBy.includes(currentUser.id);
                        return (
                          <div
                            key={n.id}
                            onClick={() => {
                              markNotificationRead(n.id);
                              if (n.title.toLowerCase().includes('pendaftaran') || n.message.toLowerCase().includes('pendaftaran')) {
                                setShowNotifications(false);
                                onOpenUserManagement();
                              }
                            }}
                            className={`p-2.5 rounded-xl cursor-pointer transition ${
                              isUnread ? 'bg-blue-50/60 font-medium' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {n.type === 'dispute' && (
                                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                              )}
                              {n.type === 'warning' && (
                                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                              )}
                              {n.type === 'success' && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              )}
                              {n.type === 'info' && (
                                <Bell className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1">
                                <p className="text-xs text-slate-800 leading-tight">
                                  {n.title}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                                  {n.message}
                                </p>
                                <span className="text-[10px] text-slate-400 mt-1 block">
                                  {new Date(n.createdAt).toLocaleTimeString('id-ID', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}{' '}
                                  WIB
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Current User Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserSwitcher(!showUserSwitcher)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 border border-slate-200 transition"
                title="Profil Pengguna"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                  {currentUser?.name.charAt(0) || 'U'}
                </div>
                <div className="hidden md:block text-left text-xs leading-none">
                  <div className="font-semibold text-slate-900 truncate max-w-[130px]">
                    {currentUser?.name}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 capitalize">
                    {currentUser?.role.replace('_', ' ')}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Profile Dropdown */}
              {showUserSwitcher && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                      Akun Aktif
                    </p>
                    <p className="text-sm font-extrabold text-slate-900 mt-0.5 truncate">
                      {currentUser?.name}
                    </p>
                    {currentUser?.email && (
                      <p className="text-[11px] font-mono text-slate-500 mt-0.5 truncate">
                        {currentUser.email}
                      </p>
                    )}
                    <div className="mt-2">{roleBadge()}</div>
                  </div>

                  {currentUser?.role === 'admin_keuangan' && (
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setShowUserSwitcher(false);
                          onOpenUserManagement();
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-xl text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition"
                      >
                        <Users className="w-4 h-4 text-slate-400" />
                        <span>Kelola Pengguna & Persetujuan</span>
                      </button>
                    </div>
                  )}

                  <div className="pt-2 mt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        logout();
                        setShowUserSwitcher(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-100 transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Keluar Akun (Logout)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sync Toast Feedback */}
      {syncToast && (
        <div className="bg-indigo-600 text-white text-xs py-1.5 px-4 text-center font-medium shadow-sm transition">
          {syncToast}
        </div>
      )}
    </header>
  );
};
