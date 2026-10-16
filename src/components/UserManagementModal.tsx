import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { User, UserRole } from '../types';
import {
  X,
  Users,
  UserPlus,
  Shield,
  Building2,
  GraduationCap,
  Key,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Search,
  Clock,
  Check,
  XCircle,
  Mail,
  UserCheck,
  CheckCheck,
  RotateCcw,
  Sparkles,
  Info,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'approvals' | 'list' | 'add';
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  initialTab,
}) => {
  const {
    users,
    addUser,
    updateUser,
    deleteUser,
    approveUserRegistration,
    batchApproveUserRegistrations,
    rejectUserRegistration,
    revokeUserApproval,
    pendingApprovalCount,
    currentUser,
    sessions,
  } = useApp();

  // Tab State
  const [activeTab, setActiveTab] = useState<'approvals' | 'list' | 'add'>(
    initialTab || (pendingApprovalCount > 0 ? 'approvals' : 'list')
  );

  // Sync tab if initialTab changes or when pending approvals change
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    } else if (pendingApprovalCount > 0) {
      setActiveTab('approvals');
    }
  }, [isOpen, initialTab, pendingApprovalCount]);

  // Approvals sub-filter: 'pending' | 'approved' | 'rejected' | 'all'
  const [approvalFilter, setApprovalFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>(
    'pending'
  );
  const [approvalSearch, setApprovalSearch] = useState('');

  // Rejection modal dialog state
  const [rejectingUser, setRejectingUser] = useState<User | null>(null);
  const [selectedRejectReason, setSelectedRejectReason] = useState<string>(
    'Nomor Pegawai (Nopeg) tidak sesuai dengan jadwal mengajar.'
  );
  const [customRejectReason, setCustomRejectReason] = useState('');

  // Feedback toast banner
  const [toastFeedback, setToastFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Search & filter for "Semua Pengguna" tab
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');

  // Form State for manual new user
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('guru');
  const [nopeg, setNopeg] = useState('');
  const [assignedLocation, setAssignedLocation] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Distinct locations for staff branch assignment
  const allLocations = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => {
      if (s.lokasi) set.add(s.lokasi);
    });
    return Array.from(set).sort();
  }, [sessions]);

  // Set of known teacher nopegs in system dataset for verification check
  const knownNopegs = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => {
      if (s.nopeg) set.add(s.nopeg);
    });
    return set;
  }, [sessions]);

  // Distinct teachers from dataset for quick autocomplete
  const teacherSuggestions = useMemo(() => {
    const map = new Map<string, string>();
    sessions.forEach((s) => {
      if (!map.has(s.nopeg)) {
        map.set(s.nopeg, s.namaPengajar);
      }
    });
    return Array.from(map.entries()).map(([nopeg, nama]) => ({ nopeg, nama }));
  }, [sessions]);

  // Registered users counts
  const pendingUsers = useMemo(() => {
    return users.filter((u) => u.approvalStatus === 'pending');
  }, [users]);

  const approvedRegistrations = useMemo(() => {
    return users.filter((u) => u.approvalStatus === 'approved');
  }, [users]);

  const rejectedRegistrations = useMemo(() => {
    return users.filter((u) => u.approvalStatus === 'rejected');
  }, [users]);

  // Filtered registration users for approvals tab
  const filteredApprovalUsers = useMemo(() => {
    return users.filter((u) => {
      // Status filter
      if (approvalFilter === 'pending' && u.approvalStatus !== 'pending') return false;
      if (approvalFilter === 'approved' && u.approvalStatus !== 'approved') return false;
      if (approvalFilter === 'rejected' && u.approvalStatus !== 'rejected') return false;

      // Search filter
      if (approvalSearch.trim()) {
        const q = approvalSearch.toLowerCase();
        const match =
          u.name.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.nopeg && u.nopeg.includes(q)) ||
          (u.assignedLocation && u.assignedLocation.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [users, approvalFilter, approvalSearch]);

  if (!isOpen) return null;

  // Notification helper
  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToastFeedback({ type, message });
    setTimeout(() => {
      setToastFeedback(null);
    }, 4500);
  };

  // 1-Click Approve handler
  const handleSingleApprove = (u: User) => {
    approveUserRegistration(u.id);
    showToast(
      'success',
      `Akun "${u.name}" berhasil disetujui (1-Klik)! Pengguna kini dapat langsung masuk ke Dashboard.`
    );
  };

  // 1-Click Batch Approve All Pending
  const handleBatchApproveAll = () => {
    if (pendingUsers.length === 0) return;
    const ids = pendingUsers.map((u) => u.id);
    batchApproveUserRegistrations(ids);
    showToast(
      'success',
      `Berhasil! Seluruh ${ids.length} akun yang menunggu telah disetujui sekaligus.`
    );
  };

  // Open Rejection Dialog
  const handleOpenRejectModal = (u: User) => {
    setRejectingUser(u);
    setSelectedRejectReason('Nomor Pegawai (Nopeg) tidak sesuai dengan jadwal mengajar.');
    setCustomRejectReason('');
  };

  // Confirm Rejection
  const handleConfirmReject = () => {
    if (!rejectingUser) return;
    const finalReason =
      selectedRejectReason === 'custom'
        ? customRejectReason.trim() || 'Alasan penolakan administratif.'
        : selectedRejectReason;

    rejectUserRegistration(rejectingUser.id, finalReason);
    showToast('error', `Pendaftaran akun "${rejectingUser.name}" telah ditolak.`);
    setRejectingUser(null);
  };

  // Select Teacher Suggestion for Manual Form
  const handleSelectTeacherSuggestion = (t: { nopeg: string; nama: string }) => {
    setName(t.nama);
    setNopeg(t.nopeg);
    setUsername(`guru.${t.nopeg}`);
    setPassword('guru123');
  };

  // Submit Manual User Form
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !username || !password) {
      showToast('error', 'Nama, username, dan password wajib diisi.');
      return;
    }

    const res = addUser({
      name,
      username,
      password,
      role,
      nopeg: role === 'guru' ? nopeg : undefined,
      assignedLocation: role === 'staf_lokasi' ? assignedLocation || allLocations[0] : undefined,
      email: email || undefined,
      phone: phone || undefined,
      active: true,
      approvalStatus: 'approved',
    });

    if (res.success) {
      showToast('success', res.message);
      setName('');
      setUsername('');
      setPassword('');
      setNopeg('');
      setEmail('');
      setPhone('');
      setActiveTab('list');
    } else {
      showToast('error', res.message);
    }
  };

  // Filtered Users for "Semua Pengguna" tab
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.nopeg && u.nopeg.includes(searchTerm)) ||
      (u.assignedLocation && u.assignedLocation.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchSearch) return false;
    if (filterRole !== 'ALL' && u.role !== filterRole) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl border border-slate-100 my-6 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Manajemen Pengguna & Persetujuan Akun
                </h3>
                {pendingApprovalCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                    {pendingApprovalCount} Menunggu
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Pusat verifikasi pendaftaran mandiri & hak akses Dashboard Wilayah, Lokasi, dan Guru
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Toast Feedback */}
        {toastFeedback && (
          <div
            className={`mt-4 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-semibold shrink-0 transition-all ${
              toastFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-300 shadow-sm'
                : toastFeedback.type === 'error'
                ? 'bg-rose-50 text-rose-900 border border-rose-300 shadow-sm'
                : 'bg-indigo-50 text-indigo-900 border border-indigo-300 shadow-sm'
            }`}
          >
            {toastFeedback.type === 'success' && (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            {toastFeedback.type === 'error' && (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            {toastFeedback.type === 'info' && (
              <Info className="w-4 h-4 text-indigo-600 shrink-0" />
            )}
            <span className="flex-1">{toastFeedback.message}</span>
            <button
              onClick={() => setToastFeedback(null)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Top Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-1 shrink-0">
          {/* TAB 1: PERSETUJUAN PENDAFTARAN */}
          <button
            onClick={() => setActiveTab('approvals')}
            className={`relative px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
              activeTab === 'approvals'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Persetujuan Pendaftaran</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'approvals'
                  ? 'bg-white text-emerald-800'
                  : pendingApprovalCount > 0
                  ? 'bg-amber-500 text-white animate-pulse'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {pendingApprovalCount > 0 ? `${pendingApprovalCount} Baru` : pendingApprovalCount}
            </span>
          </button>

          {/* TAB 2: DAFTAR SEMUA PENGGUNA */}
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'list'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Semua Pengguna Terdaftar ({users.length})</span>
          </button>

          {/* TAB 3: TAMBAH PENGGUNA MANUAL */}
          <button
            onClick={() => setActiveTab('add')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'add'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Pengguna Manual</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1 CONTENT: PERSETUJUAN PENDAFTARAN (1-KLIK SETUJUI / TOLAK)           */}
        {/* ========================================================================= */}
        {activeTab === 'approvals' && (
          <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Summary & Batch Action Header Card */}
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs sm:text-sm">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Verifikasi Pendaftaran Mandiri Portal Guru & Staf</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed max-w-xl">
                  Akun yang didaftarkan melalui form registrasi login memerlukan persetujuan Admin Wilayah.
                  Gunakan tombol <strong>1-Klik Setujui Akun</strong> untuk langsung mengaktifkan akun pendaftar.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px]">
                  <span className="font-semibold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200">
                    Menunggu: <strong>{pendingUsers.length}</strong>
                  </span>
                  <span className="font-semibold text-emerald-900 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200">
                    Disetujui: <strong>{approvedRegistrations.length}</strong>
                  </span>
                  <span className="font-semibold text-rose-900 bg-rose-100/80 px-2 py-0.5 rounded-md border border-rose-200">
                    Ditolak: <strong>{rejectedRegistrations.length}</strong>
                  </span>
                </div>
              </div>

              {pendingUsers.length > 0 && (
                <button
                  type="button"
                  onClick={handleBatchApproveAll}
                  className="px-4 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition shrink-0 group"
                >
                  <CheckCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>1-Klik Setujui Semua ({pendingUsers.length} Akun)</span>
                </button>
              )}
            </div>

            {/* Sub-Filters and Search Box */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setApprovalFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    approvalFilter === 'pending'
                      ? 'bg-white text-amber-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Menunggu ({pendingUsers.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setApprovalFilter('approved')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    approvalFilter === 'approved'
                      ? 'bg-white text-emerald-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Disetujui ({approvedRegistrations.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setApprovalFilter('rejected')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    approvalFilter === 'rejected'
                      ? 'bg-white text-rose-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Ditolak ({rejectedRegistrations.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setApprovalFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    approvalFilter === 'all'
                      ? 'bg-white text-indigo-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua ({users.length})
                </button>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={approvalSearch}
                  onChange={(e) => setApprovalSearch(e.target.value)}
                  placeholder="Cari pendaftar, email, nopeg..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 font-medium"
                />
              </div>
            </div>

            {/* List of Registration Cards */}
            <div className="space-y-3">
              {filteredApprovalUsers.length === 0 ? (
                <div className="py-14 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-60" />
                  <p className="font-semibold text-slate-600 text-sm">
                    {approvalFilter === 'pending'
                      ? 'Tidak ada pendaftaran baru yang menunggu persetujuan.'
                      : 'Tidak ada data registrasi yang cocok dengan filter.'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Seluruh calon pengguna telah diproses dengan baik.
                  </p>
                </div>
              ) : (
                filteredApprovalUsers.map((u) => {
                  const isTeacherRecognized = u.role === 'guru' && u.nopeg && knownNopegs.has(u.nopeg);
                  const isPending = u.approvalStatus === 'pending';
                  const isApproved = u.approvalStatus === 'approved';
                  const isRejected = u.approvalStatus === 'rejected';

                  return (
                    <div
                      key={u.id}
                      className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isPending
                          ? 'bg-amber-50/40 border-amber-200 hover:bg-amber-50/70 shadow-2xs'
                          : isApproved
                          ? 'bg-white border-slate-200/80 hover:bg-slate-50/60'
                          : 'bg-rose-50/30 border-rose-200/80 hover:bg-rose-50/50'
                      }`}
                    >
                      {/* Left: User Details */}
                      <div className="flex items-start gap-3.5">
                        {/* Avatar */}
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shrink-0 border shadow-2xs ${
                            u.role === 'guru'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : u.role === 'staf_lokasi'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}
                        >
                          {u.role === 'guru' && <GraduationCap className="w-5 h-5" />}
                          {u.role === 'staf_lokasi' && <Building2 className="w-5 h-5" />}
                          {u.role === 'admin_keuangan' && <Shield className="w-5 h-5" />}
                        </div>

                        {/* Text Information */}
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-sm">{u.name}</span>

                            {/* Status Tag */}
                            {isPending && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                                <Clock className="w-3 h-3 text-amber-600" />
                                Menunggu Persetujuan
                              </span>
                            )}
                            {isApproved && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <Check className="w-3 h-3 text-emerald-600" />
                                Disetujui & Aktif
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                <XCircle className="w-3 h-3 text-rose-600" />
                                Ditolak
                              </span>
                            )}
                          </div>

                          {/* Email & Role Details */}
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-slate-500">
                            <span className="inline-flex items-center gap-1 font-mono text-slate-700 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {u.email || u.username}
                            </span>

                            <span>•</span>

                            <span className="font-semibold text-slate-800 capitalize">
                              {u.role === 'guru'
                                ? 'Dashboard Guru (Pengajar)'
                                : u.role === 'staf_lokasi'
                                ? 'Dashboard Lokasi (Staf)'
                                : 'Dashboard Wilayah (Admin)'}
                            </span>

                            {/* Nopeg or Location */}
                            {u.nopeg && (
                              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 font-mono px-2 py-0.5 rounded-md text-[10px]">
                                Nopeg: <strong>{u.nopeg}</strong>
                                {isTeacherRecognized ? (
                                  <span className="text-emerald-700 font-sans font-bold ml-1">
                                    ✓ Cocok Data Jadwal
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-sans ml-1">(Baru)</span>
                                )}
                              </span>
                            )}

                            {u.assignedLocation && (
                              <span className="bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold px-2 py-0.5 rounded-md text-[10px]">
                                Cabang: <strong>{u.assignedLocation}</strong>
                              </span>
                            )}
                          </div>

                          {/* Rejection Note display if rejected */}
                          {isRejected && u.rejectionReason && (
                            <div className="mt-1.5 p-2 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800 flex items-start gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold">Alasan Penolakan: </span>
                                <span>{u.rejectionReason}</span>
                              </div>
                            </div>
                          )}

                          {/* Registration Date */}
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-0.5">
                            <Calendar className="w-3 h-3 text-slate-300" />
                            <span>Mendaftar: {new Date(u.createdAt).toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {isPending && (
                          <>
                            {/* Tombol Tolak */}
                            <button
                              type="button"
                              onClick={() => handleOpenRejectModal(u)}
                              className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition flex items-center gap-1.5 shadow-2xs"
                              title="Tolak Pendaftaran Akun"
                            >
                              <XCircle className="w-4 h-4 text-rose-600" />
                              <span>Tolak</span>
                            </button>

                            {/* Tombol 1-KLIK SETUJUI AKUN */}
                            <button
                              type="button"
                              onClick={() => handleSingleApprove(u)}
                              className="px-4 py-2 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/30 transition flex items-center gap-2 group active:scale-95"
                              title="1-Klik Setujui & Aktifkan Akun Pengguna"
                            >
                              <Check className="w-4 h-4 text-white group-hover:scale-125 transition-transform" />
                              <span>1-Klik Setujui Akun</span>
                            </button>
                          </>
                        )}

                        {isApproved && (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Dapat Login
                            </span>
                            {u.id !== currentUser?.id && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Batalkan persetujuan akun ${u.name}? Akun akan dinonaktifkan.`)) {
                                    revokeUserApproval(u.id);
                                    showToast('info', `Persetujuan akun "${u.name}" dibatalkan.`);
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                                title="Batalkan Persetujuan"
                              >
                                Batalkan
                              </button>
                            )}
                          </div>
                        )}

                        {isRejected && (
                          <button
                            type="button"
                            onClick={() => handleSingleApprove(u)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition flex items-center gap-1.5 shadow-2xs"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Pulihkan & Setujui</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2 CONTENT: DAFTAR SEMUA PENGGUNA TERDAFTAR                            */}
        {/* ========================================================================= */}
        {activeTab === 'list' && (
          <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari nama, email, nopeg, cabang..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 w-full sm:w-auto"
              >
                <option value="ALL">Semua Peran ({users.length})</option>
                <option value="admin_keuangan">Dashboard Wilayah (Admin)</option>
                <option value="staf_lokasi">Dashboard Lokasi (Staf)</option>
                <option value="guru">Dashboard Guru (Pengajar)</option>
              </select>
            </div>

            <div className="max-h-[50vh] overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-white shadow-2xs">
              {filteredUsers.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  Tidak ada user yang sesuai kriteria pencarian.
                </div>
              ) : (
                filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold shrink-0 border border-slate-200">
                        {u.role === 'admin_keuangan' && <Shield className="w-4 h-4 text-indigo-600" />}
                        {u.role === 'staf_lokasi' && <Building2 className="w-4 h-4 text-emerald-600" />}
                        {u.role === 'guru' && <GraduationCap className="w-4 h-4 text-amber-600" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{u.name}</span>

                          {u.approvalStatus === 'pending' && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-100 text-amber-800 font-bold border border-amber-300">
                              Menunggu
                            </span>
                          )}
                          {u.approvalStatus === 'approved' && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                              Aktif
                            </span>
                          )}
                          {u.approvalStatus === 'rejected' && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-100 text-rose-800 font-bold border border-rose-200">
                              Ditolak
                            </span>
                          )}
                          {!u.active && u.approvalStatus !== 'pending' && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-200 text-slate-700 font-bold">
                              Nonaktif
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                          <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded text-slate-700">
                            {u.email || u.username}
                          </span>
                          <span>•</span>
                          <span className="capitalize">{u.role.replace('_', ' ')}</span>
                          {u.nopeg && <span>(Nopeg: {u.nopeg})</span>}
                          {u.assignedLocation && <span>({u.assignedLocation})</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {u.approvalStatus === 'pending' ? (
                        <button
                          type="button"
                          onClick={() => handleSingleApprove(u)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Setujui
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            const newPass = prompt(`Reset password untuk ${u.name}:`, u.password);
                            if (newPass && newPass.trim()) {
                              updateUser(u.id, { password: newPass.trim() });
                              showToast('success', `Password untuk ${u.name} berhasil diperbarui.`);
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 transition"
                          title="Ganti Password"
                        >
                          <Key className="w-3 h-3" />
                          Reset Pass
                        </button>
                      )}

                      {u.id !== currentUser?.id && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Hapus akun ${u.name} secara permanen?`)) {
                              deleteUser(u.id);
                              showToast('info', `Akun ${u.name} telah dihapus.`);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Hapus Akun"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3 CONTENT: TAMBAH PENGGUNA MANUAL                                     */}
        {/* ========================================================================= */}
        {activeTab === 'add' && (
          <form onSubmit={handleAddSubmit} className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Peran Akun (Role) *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option value="guru">Dashboard Guru (Pengajar)</option>
                  <option value="staf_lokasi">Dashboard Lokasi (Staf Cabang)</option>
                  <option value="admin_keuangan">Dashboard Wilayah (Admin Pusat)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap & Gelar *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Rian Pratama, S.Pd"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email / Username Login *
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="nama@email.com atau guru.rian"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password Awal *
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  required
                />
              </div>

              {role === 'guru' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No. Pegawai (Nopeg) *
                  </label>
                  <input
                    type="text"
                    value={nopeg}
                    onChange={(e) => setNopeg(e.target.value)}
                    placeholder="Contoh: 709027"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                    required={role === 'guru'}
                  />
                </div>
              )}

              {role === 'staf_lokasi' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cabang Penugasan *
                  </label>
                  <select
                    value={assignedLocation}
                    onChange={(e) => setAssignedLocation(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="">-- Pilih Cabang --</option>
                    <option value="ALL">Semua Cabang (Wilayah)</option>
                    {allLocations.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Tambahan (Opsional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="pengajar@nurulfikri.sch.id"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  No. Telepon / WhatsApp (Opsional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812xxxxxxxx"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            {role === 'guru' && teacherSuggestions.length > 0 && (
              <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs">
                <p className="font-bold text-amber-900 mb-1.5">
                  Isi Cepat dari Data Jadwal Spreadsheet:
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {teacherSuggestions.slice(0, 10).map((t) => (
                    <button
                      type="button"
                      key={t.nopeg}
                      onClick={() => handleSelectTeacherSuggestion(t)}
                      className="px-2 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[10px] font-semibold transition"
                    >
                      {t.nama} ({t.nopeg})
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-600/30 transition"
              >
                Daftarkan Pengguna
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* REJECTION REASON MODAL DIALOG                                              */}
        {/* ========================================================================= */}
        {rejectingUser && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-100">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Tolak Pendaftaran Akun
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      {rejectingUser.name} ({rejectingUser.role.replace('_', ' ')})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRejectingUser(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Pilih Alasan Penolakan:
                </label>
                <div className="space-y-2">
                  {[
                    'Nomor Pegawai (Nopeg) tidak sesuai dengan jadwal mengajar.',
                    'Cabang / lokasi penugasan tidak sesuai dengan data operasional.',
                    'Data identitas atau email tidak valid / terindikasi duplikasi.',
                    'custom',
                  ].map((option) => (
                    <label
                      key={option}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                        selectedRejectReason === option
                          ? 'bg-rose-50/70 border-rose-300 text-rose-950 font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="rejectReason"
                        checked={selectedRejectReason === option}
                        onChange={() => setSelectedRejectReason(option)}
                        className="mt-0.5 text-rose-600 focus:ring-rose-500"
                      />
                      <span>
                        {option === 'custom' ? 'Alasan Lainnya (Tulis catatan...)' : option}
                      </span>
                    </label>
                  ))}
                </div>

                {selectedRejectReason === 'custom' && (
                  <textarea
                    value={customRejectReason}
                    onChange={(e) => setCustomRejectReason(e.target.value)}
                    placeholder="Tulis alasan penolakan secara spesifik untuk pendaftar..."
                    rows={3}
                    className="w-full mt-2.5 p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
                    autoFocus
                  />
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectingUser(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  Konfirmasi Tolak
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
