import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { TeachingSession, VerificationStatus } from '../types';
import { exportSessionsToCsv } from '../utils/csvExport';
import { exportBranchReportPdf, exportTeacherSlipPdf } from '../utils/pdfExport';
import { formatIndonesianDecimal } from '../utils/numberFormat';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Search,
  Filter,
  Users,
  Building2,
  DollarSign,
  TrendingUp,
  Layers,
  Send,
  Sparkles,
  ChevronRight,
  Eye,
  CheckSquare,
  Square,
  AlertCircle,
  HelpCircle,
  UserCheck,
  Pencil,
  X,
  MessageSquare,
} from 'lucide-react';

interface AdminDashboardProps {
  onOpenDisputeReviewModal: (session: TeachingSession) => void;
  onOpenBroadcastModal: () => void;
  onOpenUserManagement: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onOpenDisputeReviewModal,
  onOpenBroadcastModal,
  onOpenUserManagement,
}) => {
  const {
    sessions,
    verifications,
    batchApproveFinance,
    sendNotification,
    verifySession,
    saveFinanceResponse,
    pendingApprovalCount,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'sessions' | 'branches' | 'teachers' | 'disputes'>('sessions');
  const [searchTerm, setSearchTerm] = useState('');
  const [responseModalSession, setResponseModalSession] = useState<TeachingSession | null>(null);
  const [responseText, setResponseText] = useState('');
  const [responseDecisionStatus, setResponseDecisionStatus] = useState<VerificationStatus | 'KEEP'>('KEEP');

  const handleOpenResponseModal = (session: TeachingSession) => {
    const v = verifications[session.id];
    setResponseModalSession(session);
    setResponseText(v?.financeNote || '');
    setResponseDecisionStatus(v?.status === 'SANGGAHAN' ? 'DISETUJUI_KEUANGAN' : 'KEEP');
  };
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);

  // Compute Overall Stats
  const overallStats = useMemo(() => {
    let totNegeri = 0;
    let totSwasta = 0;
    let totKonsNegeri = 0;
    let totKonsSwasta = 0;
    let totJagaTesNegeri = 0;
    let totJagaTesSwasta = 0;
    let totBelumPresensi = 0;
    let totSangsiNegeri = 0;
    let totSangsiSwasta = 0;
    let totInsentifNegeri = 0;
    let totInsentifSwasta = 0;

    let countBelum = 0;
    let countGuru = 0;
    let countLokasi = 0;
    let countDisetujui = 0;
    let countSanggahan = 0;

    sessions.forEach((s) => {
      totNegeri += s.sesiMengajarNegeri;
      totSwasta += s.sesiMengajarSwasta;
      totKonsNegeri += s.sesiKonsultasiNegeri;
      totKonsSwasta += s.sesiKonsultasiSwasta;
      totJagaTesNegeri += s.jagaTesNegeri;
      totJagaTesSwasta += s.jagaTesSwasta;
      totBelumPresensi += s.belumPresensi;
      totSangsiNegeri += s.menitSangsiMengajarNegeri;
      totSangsiSwasta += s.menitSangsiMengajarSwasta;
      totInsentifNegeri += s.insentifHadirMengajarNegeri;
      totInsentifSwasta += s.insentifHadirMengajarSwasta;

      const v = verifications[s.id];
      const status = v?.status || 'BELUM_VERIFIKASI';
      if (status === 'BELUM_VERIFIKASI') countBelum++;
      else if (status === 'SESUAI_GURU') countGuru++;
      else if (status === 'SESUAI_LOKASI') countLokasi++;
      else if (status === 'DISETUJUI_KEUANGAN') countDisetujui++;
      else if (status === 'SANGGAHAN') countSanggahan++;
    });

    return {
      totalMengajar: parseFloat((totNegeri + totSwasta).toFixed(2)),
      totMengajarNegeri: parseFloat(totNegeri.toFixed(2)),
      totMengajarSwasta: parseFloat(totSwasta.toFixed(2)),
      totalKonsultasi: parseFloat((totKonsNegeri + totKonsSwasta).toFixed(2)),
      totKonsultasiNegeri: parseFloat(totKonsNegeri.toFixed(2)),
      totKonsultasiSwasta: parseFloat(totKonsSwasta.toFixed(2)),
      totalJagaTes: parseFloat((totJagaTesNegeri + totJagaTesSwasta).toFixed(2)),
      totJagaTesNegeri: parseFloat(totJagaTesNegeri.toFixed(2)),
      totJagaTesSwasta: parseFloat(totJagaTesSwasta.toFixed(2)),
      totBelumPresensi,
      totalSangsi: parseFloat((totSangsiNegeri + totSangsiSwasta).toFixed(2)),
      totalInsentif: parseFloat((totInsentifNegeri + totInsentifSwasta).toFixed(2)),
      countBelum,
      countGuru,
      countLokasi,
      countDisetujui,
      countSanggahan,
      totalRecords: sessions.length,
    };
  }, [sessions, verifications]);

  // Unique branches
  const uniqueBranches = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => {
      if (s.lokasi) set.add(s.lokasi);
    });
    return Array.from(set).sort();
  }, [sessions]);

  // Aggregated per branch
  const branchAggregates = useMemo(() => {
    const map = new Map<
      string,
      {
        lokasi: string;
        lok: string;
        teacherCount: Set<string>;
        totalMengajar: number;
        totalKonsultasi: number;
        belumPresensi: number;
        verifiedCount: number;
        disputeCount: number;
        sessions: TeachingSession[];
      }
    >();

    sessions.forEach((s) => {
      if (!map.has(s.lokasi)) {
        map.set(s.lokasi, {
          lokasi: s.lokasi,
          lok: s.lok,
          teacherCount: new Set(),
          totalMengajar: 0,
          totalKonsultasi: 0,
          belumPresensi: 0,
          verifiedCount: 0,
          disputeCount: 0,
          sessions: [],
        });
      }
      const item = map.get(s.lokasi)!;
      item.teacherCount.add(s.nopeg);
      item.totalMengajar += s.totalSesiMengajar;
      item.totalKonsultasi += s.totalSesiKonsultasi;
      item.belumPresensi += s.belumPresensi;
      item.sessions.push(s);

      const v = verifications[s.id];
      if (v?.status === 'DISETUJUI_KEUANGAN' || v?.status === 'SESUAI_LOKASI') {
        item.verifiedCount++;
      } else if (v?.status === 'SANGGAHAN') {
        item.disputeCount++;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalMengajar - a.totalMengajar);
  }, [sessions, verifications]);

  // Aggregated per teacher
  const teacherAggregates = useMemo(() => {
    const map = new Map<
      string,
      {
        nopeg: string;
        nama: string;
        branchCount: Set<string>;
        totalMengajar: number;
        totalKonsultasi: number;
        belumPresensi: number;
        disputeCount: number;
        sessions: TeachingSession[];
      }
    >();

    sessions.forEach((s) => {
      if (!map.has(s.nopeg)) {
        map.set(s.nopeg, {
          nopeg: s.nopeg,
          nama: s.namaPengajar,
          branchCount: new Set(),
          totalMengajar: 0,
          totalKonsultasi: 0,
          belumPresensi: 0,
          disputeCount: 0,
          sessions: [],
        });
      }
      const item = map.get(s.nopeg)!;
      item.branchCount.add(s.lokasi);
      item.totalMengajar += s.totalSesiMengajar;
      item.totalKonsultasi += s.totalSesiKonsultasi;
      item.belumPresensi += s.belumPresensi;
      item.sessions.push(s);

      const v = verifications[s.id];
      if (v?.status === 'SANGGAHAN') {
        item.disputeCount++;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalMengajar - a.totalMengajar);
  }, [sessions, verifications]);

  // Sessions filtered for main table
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchSearch =
        s.namaPengajar.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nopeg.includes(searchTerm) ||
        s.lokasi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.kode.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (branchFilter !== 'ALL' && s.lokasi !== branchFilter) return false;

      if (statusFilter !== 'ALL') {
        const v = verifications[s.id];
        const status = v?.status || 'BELUM_VERIFIKASI';
        if (status !== statusFilter) return false;
      }

      return true;
    });
  }, [sessions, searchTerm, branchFilter, statusFilter, verifications]);

  // Disputes list
  const disputeSessions = useMemo(() => {
    return sessions.filter((s) => verifications[s.id]?.status === 'SANGGAHAN');
  }, [sessions, verifications]);

  // Batch Selection
  const handleSelectAllOnPage = () => {
    if (selectedSessionIds.length === filteredSessions.length) {
      setSelectedSessionIds([]);
    } else {
      setSelectedSessionIds(filteredSessions.map((s) => s.id));
    }
  };

  const handleToggleSelectSession = (id: string) => {
    setSelectedSessionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBatchApprove = () => {
    if (selectedSessionIds.length === 0) {
      alert('Pilih minimal 1 sesi yang akan disetujui.');
      return;
    }
    if (
      confirm(
        `Setujui ${selectedSessionIds.length} sesi mengajar yang terpilih untuk proses?`
      )
    ) {
      batchApproveFinance(selectedSessionIds, 'Disetujui Final oleh Admin Keuangan.');
      setSelectedSessionIds([]);
    }
  };

  const handleSendReminderToUnverified = () => {
    sendNotification(
      'Peringatan Batas Akhir Verifikasi Sesi',
      'Kepada Bapak/Ibu Guru yang belum melakukan pengecekan sesi mengajar periode berjalan, dimohon segera melakukan konfirmasi sebelum rekap honor ditutup.',
      'warning',
      'guru'
    );
    alert('Pengingat berhasil dikirimkan ke seluruh Guru!');
  };

  return (
    <div className="space-y-6">
      {/* Alert Banner for Pending User Registrations */}
      {pendingApprovalCount > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-950">
                  {pendingApprovalCount} Pendaftaran Akun Baru Menunggu Persetujuan Admin Wilayah
                </span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                  Perlu Tindakan
                </span>
              </div>
              <p className="text-[11px] text-amber-800/90 mt-0.5">
                Terdapat guru / staf yang baru mendaftar melalui form pendaftaran mandiri dan menunggu verifikasi Anda sebelum dapat login.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenUserManagement}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition flex items-center justify-center gap-1.5 shrink-0"
          >
            <UserCheck className="w-3.5 h-3.5" />
            Tinjau Pendaftaran ({pendingApprovalCount})
          </button>
        </div>
      )}

      {/* Financial Overview Hero Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-3">
              <Shield className="w-3.5 h-3.5" />
              Pusat Pelaporan & Verifikasi Keuangan
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Dashboard Rekapitulasi Sesi Mengajar
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Periode 25 Agt - 24 Sep: Pantau kesesuaian sesi mengajar real-time di seluruh cabang, validasi persetujuan, dan kelola sanggahan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() =>
                exportSessionsToCsv(sessions, verifications, 'Rekap_Keuangan_Semua_Cabang.csv')
              }
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs border border-white/15 flex items-center gap-2 transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Ekspor CSV Lengkap
            </button>

            <button
              onClick={handleSendReminderToUnverified}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
            >
              <Send className="w-4 h-4" />
              Kirim Pengingat Masal
            </button>
          </div>
        </div>

        {/* Financial KPI Numbers */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8 pt-6 border-t border-white/10">
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
              Total Sesi Mengajar
            </span>
            <span className="text-2xl font-black text-white mt-1 block">
              {formatIndonesianDecimal(overallStats.totalMengajar)}
            </span>
            <div className="text-[11px] mt-1.5 flex items-center gap-1.5 flex-wrap">
              <span className="text-indigo-300 font-semibold">
                Negeri: {formatIndonesianDecimal(overallStats.totMengajarNegeri)}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-300 font-semibold">
                Swasta: {formatIndonesianDecimal(overallStats.totMengajarSwasta)}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
              Total Sesi Konsultasi
            </span>
            <span className="text-2xl font-black text-indigo-300 mt-1 block">
              {formatIndonesianDecimal(overallStats.totalKonsultasi)}
            </span>
            <div className="text-[11px] mt-1.5 flex items-center gap-1.5 flex-wrap">
              <span className="text-amber-300 font-semibold">
                Negeri: {formatIndonesianDecimal(overallStats.totKonsultasiNegeri)}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-amber-300 font-semibold">
                Swasta: {formatIndonesianDecimal(overallStats.totKonsultasiSwasta)}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
              Sesi Jaga Tes
            </span>
            <span className="text-2xl font-black text-white mt-1 block">
              {formatIndonesianDecimal(overallStats.totalJagaTes)}
            </span>
            <div className="text-[11px] mt-1.5 flex items-center gap-1.5 flex-wrap">
              <span className="text-indigo-300 font-semibold">
                Negeri: {formatIndonesianDecimal(overallStats.totJagaTesNegeri)}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-300 font-semibold">
                Swasta: {formatIndonesianDecimal(overallStats.totJagaTesSwasta)}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
              Belum Presensi
            </span>
            <span
              className={`text-2xl font-black mt-1 block ${
                overallStats.totBelumPresensi > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {overallStats.totBelumPresensi}
            </span>
            <span className="text-[10px] text-slate-400">Perlu Verifikasi</span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
              Sanggahan Selisih
            </span>
            <span
              className={`text-2xl font-black mt-1 block ${
                overallStats.countSanggahan > 0 ? 'text-amber-400' : 'text-slate-300'
              }`}
            >
              {overallStats.countSanggahan}
            </span>
            <span className="text-[10px] text-slate-400">Perlu Tindakan</span>
          </div>
        </div>
      </div>

      {/* Verification Status Funnel Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Progres Verifikasi Sesi Keseluruhan
            </h3>
            <p className="text-xs text-slate-500">
              Total {overallStats.totalRecords} catatan mengajar di {uniqueBranches.length} cabang
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="text-emerald-600">
              Disetujui: {overallStats.countDisetujui}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-blue-600">
              Lokasi: {overallStats.countLokasi}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-indigo-600">
              Guru: {overallStats.countGuru}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-rose-600">
              Sanggahan: {overallStats.countSanggahan}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-amber-600">
              Belum: {overallStats.countBelum}
            </span>
          </div>
        </div>

        {/* Progress Multi-bar */}
        <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden">
          <div
            title={`Disetujui Keuangan: ${overallStats.countDisetujui}`}
            style={{
              width: `${(overallStats.countDisetujui / overallStats.totalRecords) * 100}%`,
            }}
            className="bg-emerald-500 transition-all duration-300"
          ></div>
          <div
            title={`Divalidasi Lokasi: ${overallStats.countLokasi}`}
            style={{
              width: `${(overallStats.countLokasi / overallStats.totalRecords) * 100}%`,
            }}
            className="bg-blue-500 transition-all duration-300"
          ></div>
          <div
            title={`Diverifikasi Guru: ${overallStats.countGuru}`}
            style={{
              width: `${(overallStats.countGuru / overallStats.totalRecords) * 100}%`,
            }}
            className="bg-indigo-500 transition-all duration-300"
          ></div>
          <div
            title={`Sanggahan Diajukan: ${overallStats.countSanggahan}`}
            style={{
              width: `${(overallStats.countSanggahan / overallStats.totalRecords) * 100}%`,
            }}
            className="bg-rose-500 transition-all duration-300"
          ></div>
          <div
            title={`Belum Verifikasi: ${overallStats.countBelum}`}
            style={{
              width: `${(overallStats.countBelum / overallStats.totalRecords) * 100}%`,
            }}
            className="bg-amber-400 transition-all duration-300"
          ></div>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('sessions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeSubTab === 'sessions'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Semua Sesi & Monitoring ({filteredSessions.length})
        </button>

        <button
          onClick={() => setActiveSubTab('branches')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeSubTab === 'branches'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          Rekapitulasi per Cabang ({branchAggregates.length})
        </button>

        <button
          onClick={() => setActiveSubTab('teachers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeSubTab === 'teachers'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Rekapitulasi per Pengajar ({teacherAggregates.length})
        </button>

        <button
          onClick={() => setActiveSubTab('disputes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeSubTab === 'disputes'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Kotak Sanggahan / Selisih ({disputeSessions.length})
        </button>
      </div>

      {/* SUB-TAB 1: All Sessions & Monitoring Table */}
      {activeSubTab === 'sessions' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Filter Bar & Batch Actions */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Batch Approve Button */}
              {selectedSessionIds.length > 0 && (
                <button
                  onClick={handleBatchApprove}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Setujui {selectedSessionIds.length} Sesi Terpilih
                </button>
              )}

              {/* Branch filter */}
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700"
              >
                <option value="ALL">Semua Cabang ({uniqueBranches.length})</option>
                {uniqueBranches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700"
              >
                <option value="ALL">Semua Status</option>
                <option value="BELUM_VERIFIKASI">Belum Verifikasi</option>
                <option value="SESUAI_GURU">Sesuai Guru</option>
                <option value="SESUAI_LOKASI">Sesuai Lokasi</option>
                <option value="DISETUJUI_KEUANGAN">Disetujui Keuangan</option>
                <option value="SANGGAHAN">Ada Sanggahan</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari guru, nopeg, cabang..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-2 w-8 text-center sticky left-0 bg-slate-50 z-20">
                    <button
                      type="button"
                      onClick={handleSelectAllOnPage}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      {selectedSessionIds.length === filteredSessions.length &&
                      filteredSessions.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-2.5 px-2.5 text-left sticky left-8 bg-slate-50 z-20 shadow-xs max-w-[160px]">
                    Nama Pengajar & Nopeg
                  </th>
                  <th className="py-2.5 px-2 text-left">Cabang / Lokasi</th>
                  <th
                    className="py-2 px-1.5 text-right text-indigo-950 bg-indigo-50/60 font-semibold"
                    title="Dur Mengajar Negeri"
                  >
                    <div className="leading-tight text-[11px] whitespace-normal">
                      Dur Mengajar
                      <span className="block text-[10px] text-indigo-600 font-normal">
                        Negeri
                      </span>
                    </div>
                  </th>
                  <th
                    className="py-2 px-1.5 text-right text-indigo-950 bg-indigo-50/60 font-semibold"
                    title="Menit Sangsi Mengajar Negeri"
                  >
                    <div className="leading-tight text-[11px] whitespace-normal">
                      Menit Sangsi
                      <span className="block text-[10px] text-indigo-600 font-normal">
                        Negeri
                      </span>
                    </div>
                  </th>
                  <th
                    className="py-2 px-1.5 text-right text-indigo-950 bg-indigo-50/60 font-semibold"
                    title="Insentif Hadir Mengajar Negeri"
                  >
                    <div className="leading-tight text-[11px] whitespace-normal">
                      Insentif Hadir
                      <span className="block text-[10px] text-indigo-600 font-normal">
                        Negeri
                      </span>
                    </div>
                  </th>
                  <th
                    className="py-2 px-1.5 text-right text-indigo-950 bg-indigo-50/60 font-semibold"
                    title="Jaga Tes Negeri"
                  >
                    <div className="leading-tight text-[11px] whitespace-normal">
                      Jaga Tes
                      <span className="block text-[10px] text-indigo-600 font-normal">
                        Negeri
                      </span>
                    </div>
                  </th>
                  <th
                    className="py-2 px-1.5 text-right text-emerald-950 bg-emerald-50/60 font-semibold"
                    title="Dur Mengajar Swasta"
                  >
                    <div className="leading-tight text-[11px] whitespace-normal">
                      Dur Mengajar
                      <span className="block text-[10px] text-emerald-600 font-normal">
                        Swasta
                      </span>
                    </div>
                  </th>
                  <th
                    className="py-2 px-1.5 text-right text-emerald-950 bg-emerald-50/60 font-semibold"
                    title="Menit Sangsi Mengajar Swasta"
                  >
                    <div className="leading-tight text-[11px] whitespace-normal">
                      Menit Sangsi
                      <span className="block text-[10px] text-emerald-600 font-normal">
                        Swasta
                      </span>
                    </div>
                  </th>
                  <th
                    className="py-2 px-1.5 text-right text-emerald-950 bg-emerald-50/60 font-semibold"
                    title="Insentif Hadir Mengajar Swasta"
                  >
                    <div className="leading-tight text-[11px] whitespace-normal">
                      Insentif Hadir
                      <span className="block text-[10px] text-emerald-600 font-normal">
                        Swasta
                      </span>
                    </div>
                  </th>
                  <th
                    className="py-2 px-1.5 text-right text-emerald-950 bg-emerald-50/60 font-semibold"
                    title="Jaga TesSwasta"
                  >
                    <div className="leading-tight text-[11px] whitespace-normal">
                      Jaga Tes
                      <span className="block text-[10px] text-emerald-600 font-normal">
                        Swasta
                      </span>
                    </div>
                  </th>
                  <th
                    className="py-2 px-1.5 text-right text-amber-950 bg-amber-50/60 font-semibold"
                    title="Dur Konsultasi Negeri"
                  >
                    <div className="leading-tight text-[11px] whitespace-normal">
                      Dur Konsultasi
                      <span className="block text-[10px] text-amber-700 font-normal">
                        Negeri
                      </span>
                    </div>
                  </th>
                  <th
                    className="py-2 px-1.5 text-right text-amber-950 bg-amber-50/60 font-semibold"
                    title="Inst Konsultasi Negeri"
                  >
                    <div className="leading-tight text-[11px] whitespace-normal">
                      Inst Konsultasi
                      <span className="block text-[10px] text-amber-700 font-normal">
                        Negeri
                      </span>
                    </div>
                  </th>
                  <th
                    className="py-2 px-1.5 text-right text-amber-950 bg-amber-50/60 font-semibold"
                    title="Dur Konsultasi Swasta"
                  >
                    <div className="leading-tight text-[11px] whitespace-normal">
                      Dur Konsultasi
                      <span className="block text-[10px] text-amber-700 font-normal">
                        Swasta
                      </span>
                    </div>
                  </th>
                  <th
                    className="py-2 px-1.5 text-right text-amber-950 bg-amber-50/60 font-semibold"
                    title="Inst Konsultasi Swasta"
                  >
                    <div className="leading-tight text-[11px] whitespace-normal">
                      Inst Konsultasi
                      <span className="block text-[10px] text-amber-700 font-normal">
                        Swasta
                      </span>
                    </div>
                  </th>
                  <th
                    className="py-2 px-1.5 text-center text-rose-950 bg-rose-50/60 font-semibold"
                    title="Belum Presensi"
                  >
                    <div className="leading-tight text-[11px] whitespace-normal">
                      Belum
                      <span className="block text-[10px] text-rose-700 font-normal">
                        Presensi
                      </span>
                    </div>
                  </th>
                  <th className="py-2.5 px-2.5 text-center font-semibold">Status Verifikasi</th>
                  <th className="py-2.5 px-2.5 text-center font-semibold">Aksi Keuangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan={18} className="py-12 text-center text-slate-400">
                      Tidak ada data sesi mengajar yang sesuai filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map((s) => {
                    const v = verifications[s.id];
                    const status = v?.status || 'BELUM_VERIFIKASI';
                    const isSelected = selectedSessionIds.includes(s.id);

                    return (
                      <tr
                        key={s.id}
                        className={`hover:bg-slate-50/80 transition ${
                          isSelected ? 'bg-indigo-50/40' : ''
                        }`}
                      >
                        <td className="py-2.5 px-2 text-center sticky left-0 bg-white z-10">
                          <button
                            type="button"
                            onClick={() => handleToggleSelectSession(s.id)}
                            className="text-slate-400 hover:text-slate-700"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="py-2.5 px-2.5 font-medium text-slate-900 sticky left-8 bg-white z-10 shadow-xs max-w-[160px]">
                          <span className="font-bold block truncate max-w-[150px]">
                            {s.namaPengajar}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            {s.nopeg} • {s.kode}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 whitespace-nowrap">
                          <span className="font-semibold text-slate-800 block text-xs">
                            {s.lokasi}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            Lok: {s.lok}
                          </span>
                        </td>
                        <td className="py-2 px-1.5 text-right font-mono text-[11px] font-medium text-slate-800 bg-indigo-50/20 whitespace-nowrap">
                          {formatIndonesianDecimal(s.durMengajarNegeri)}
                        </td>
                        <td
                          className={`py-2 px-1.5 text-right font-mono text-[11px] font-medium bg-indigo-50/20 whitespace-nowrap ${
                            s.menitSangsiMengajarNegeri < 0
                              ? 'text-rose-600 font-bold'
                              : 'text-slate-800'
                          }`}
                        >
                          {formatIndonesianDecimal(s.menitSangsiMengajarNegeri)}
                        </td>
                        <td className="py-2 px-1.5 text-right font-mono text-[11px] font-medium text-slate-800 bg-indigo-50/20 whitespace-nowrap">
                          {formatIndonesianDecimal(s.insentifHadirMengajarNegeri)}
                        </td>
                        <td className="py-2 px-1.5 text-right font-mono text-[11px] font-medium text-slate-800 bg-indigo-50/20 whitespace-nowrap">
                          {formatIndonesianDecimal(s.jagaTesNegeri)}
                        </td>
                        <td className="py-2 px-1.5 text-right font-mono text-[11px] font-medium text-slate-800 bg-emerald-50/20 whitespace-nowrap">
                          {formatIndonesianDecimal(s.durMengajarSwasta)}
                        </td>
                        <td
                          className={`py-2 px-1.5 text-right font-mono text-[11px] font-medium bg-emerald-50/20 whitespace-nowrap ${
                            s.menitSangsiMengajarSwasta < 0
                              ? 'text-rose-600 font-bold'
                              : 'text-slate-800'
                          }`}
                        >
                          {formatIndonesianDecimal(s.menitSangsiMengajarSwasta)}
                        </td>
                        <td className="py-2 px-1.5 text-right font-mono text-[11px] font-medium text-slate-800 bg-emerald-50/20 whitespace-nowrap">
                          {formatIndonesianDecimal(s.insentifHadirMengajarSwasta)}
                        </td>
                        <td className="py-2 px-1.5 text-right font-mono text-[11px] font-medium text-slate-800 bg-emerald-50/20 whitespace-nowrap">
                          {formatIndonesianDecimal(s.jagaTesSwasta)}
                        </td>
                        <td className="py-2 px-1.5 text-right font-mono text-[11px] font-medium text-slate-800 bg-amber-50/20 whitespace-nowrap">
                          {formatIndonesianDecimal(s.durKonsultasiNegeri)}
                        </td>
                        <td className="py-2 px-1.5 text-right font-mono text-[11px] font-medium text-slate-800 bg-amber-50/20 whitespace-nowrap">
                          {formatIndonesianDecimal(s.instKonsultasiNegeri)}
                        </td>
                        <td className="py-2 px-1.5 text-right font-mono text-[11px] font-medium text-slate-800 bg-amber-50/20 whitespace-nowrap">
                          {formatIndonesianDecimal(s.durKonsultasiSwasta)}
                        </td>
                        <td className="py-2 px-1.5 text-right font-mono text-[11px] font-medium text-slate-800 bg-amber-50/20 whitespace-nowrap">
                          {formatIndonesianDecimal(s.instKonsultasiSwasta)}
                        </td>
                        <td className="py-2 px-1.5 text-center bg-rose-50/20 whitespace-nowrap">
                          {s.belumPresensi > 0 ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              {s.belumPresensi}
                            </span>
                          ) : (
                            <span className="font-mono text-slate-400 text-[11px]">0</span>
                          )}
                        </td>
                        <td className="py-2.5 px-2.5 text-center whitespace-normal min-w-[140px] max-w-[180px]">
                          {status === 'DISETUJUI_KEUANGAN' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Disetujui
                            </span>
                          )}
                          {status === 'SESUAI_LOKASI' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              <CheckCircle2 className="w-3 h-3 text-blue-600" />
                              Valid Lokasi
                            </span>
                          )}
                          {status === 'SESUAI_GURU' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                              Valid Guru
                            </span>
                          )}
                          {status === 'SANGGAHAN' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              Sanggahan
                            </span>
                          )}
                          {status === 'BELUM_VERIFIKASI' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Menunggu
                            </span>
                          )}

                          {/* Catatan / Sanggahan Guru */}
                          {(v?.claim?.reason || v?.teacherNote) && (
                            <div
                              title={v?.claim?.reason || v?.teacherNote}
                              className="text-[10px] text-amber-900 bg-amber-50/90 border border-amber-200/80 rounded-md px-1.5 py-0.5 mt-1.5 truncate max-w-[155px] mx-auto text-left"
                            >
                              <span className="font-bold">Guru:</span> "{v?.claim?.reason || v?.teacherNote}"
                            </div>
                          )}

                          {/* Catatan Staf Lokasi */}
                          {v?.staffNote && (
                            <div
                              title={v.staffNote}
                              className="text-[10px] text-blue-900 bg-blue-50/90 border border-blue-200/80 rounded-md px-1.5 py-0.5 mt-1 truncate max-w-[155px] mx-auto text-left"
                            >
                              <span className="font-bold">Staf:</span> "{v.staffNote}"
                            </div>
                          )}

                          {/* Respon Keuangan Wilayah */}
                          {v?.financeNote && (
                            <div
                              title={v.financeNote}
                              className="text-[10px] text-purple-900 bg-purple-50/90 border border-purple-200/80 rounded-md px-1.5 py-0.5 mt-1 truncate max-w-[155px] mx-auto text-left"
                            >
                              <span className="font-bold">Wilayah:</span> "{v.financeNote}"
                            </div>
                          )}

                          {/* Tombol + Beri Respon (sesuai gambar) */}
                          <div className="mt-1 flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => handleOpenResponseModal(s)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                              title="Beri respon terhadap catatan staf atau sanggahan guru"
                            >
                              <span>+ Beri Respon</span>
                              <Pencil className="w-3 h-3 text-indigo-600" />
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            {status === 'SANGGAHAN' ? (
                              <button
                                onClick={() => onOpenDisputeReviewModal(s)}
                                className="px-2 py-1 rounded-lg text-[11px] font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs flex items-center gap-1"
                              >
                                Tinjau Sanggahan
                              </button>
                            ) : status !== 'DISETUJUI_KEUANGAN' ? (
                              <button
                                onClick={() =>
                                  verifySession(
                                    s.id,
                                    'DISETUJUI_KEUANGAN',
                                    'Disetujui Final oleh Admin Keuangan.'
                                  )
                                }
                                className="px-2 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-200 transition"
                              >
                                Setujui
                              </button>
                            ) : (
                              <span className="text-[10px] text-emerald-600 font-semibold">
                                Final
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Rekapitulasi per Cabang */}
      {activeSubTab === 'branches' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branchAggregates.map((b) => (
            <div
              key={b.lokasi}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{b.lokasi}</h4>
                    <span className="text-[10px] font-mono text-slate-400">
                      Kode: {b.lok}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                    {b.teacherCount.size} Guru
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Sesi Mengajar:</span>
                    <span className="font-extrabold text-slate-900 text-base">
                      {formatIndonesianDecimal(b.totalMengajar)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Konsultasi:</span>
                    <span className="font-extrabold text-indigo-700 text-base">
                      {formatIndonesianDecimal(b.totalKonsultasi)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Belum Presensi:</span>
                  <span
                    className={`font-bold ${
                      b.belumPresensi > 0 ? 'text-rose-600' : 'text-slate-700'
                    }`}
                  >
                    {b.belumPresensi} kali
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() =>
                    exportBranchReportPdf(
                      b.lokasi,
                      b.sessions[0]?.periode || 'Periode Berjalan',
                      b.sessions,
                      verifications
                    )
                  }
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Cetak Rekap Cabang PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUB-TAB 3: Rekapitulasi per Pengajar */}
      {activeSubTab === 'teachers' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              Rekapitulasi Total Sesi per Guru
            </h3>
            <p className="text-xs text-slate-500">
              Total sesi mengajar gabungan lintas cabang untuk perhitungan.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nama Pengajar & Nopeg</th>
                  <th className="py-3 px-3 text-center">Jml Cabang</th>
                  <th className="py-3 px-3 text-right">Total Sesi Mengajar</th>
                  <th className="py-3 px-3 text-right">Total Konsultasi</th>
                  <th className="py-3 px-3 text-right">Grand Total Sesi</th>
                  <th className="py-3 px-3 text-center">Belum Presensi</th>
                  <th className="py-3 px-4 text-center">Cetak Slip PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teacherAggregates.map((t) => (
                  <tr key={t.nopeg} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      <span className="font-bold block">{t.nama}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Nopeg: {t.nopeg}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                        {t.branchCount.size} lokasi
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-semibold text-slate-900">
                      {formatIndonesianDecimal(t.totalMengajar)} sesi
                    </td>
                    <td className="py-3.5 px-3 text-right font-semibold text-indigo-700">
                      {formatIndonesianDecimal(t.totalKonsultasi)} sesi
                    </td>
                    <td className="py-3.5 px-3 text-right font-extrabold text-slate-900">
                      {formatIndonesianDecimal(t.totalMengajar + t.totalKonsultasi)} sesi
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      {t.belumPresensi > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                          {t.belumPresensi}x
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() =>
                          exportTeacherSlipPdf(
                            t.nama,
                            t.nopeg,
                            t.sessions[0]?.periode || 'Periode Berjalan',
                            t.sessions,
                            verifications
                          )
                        }
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs transition"
                      >
                        <FileText className="w-3.5 h-3.5 text-rose-600" />
                        Slip PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: Kotak Sanggahan / Selisih */}
      {activeSubTab === 'disputes' && (
        <div className="space-y-4">
          {disputeSessions.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-900">
                Tidak Ada Sanggahan Aktif
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Semua guru dan staf telah sepakat dengan data sesi mengajar saat ini.
              </p>
            </div>
          ) : (
            disputeSessions.map((s) => {
              const v = verifications[s.id];
              return (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl p-5 border border-rose-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-rose-100 text-rose-800">
                        Sanggahan Sesi
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">
                        {s.namaPengajar} ({s.nopeg})
                      </h4>
                      <span className="text-xs text-slate-500">• {s.lokasi}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100 text-xs text-slate-800 mt-2">
                      <p className="font-semibold text-rose-950">
                        Alasan / Catatan Guru:
                      </p>
                      <p className="mt-0.5 italic">
                        "{v?.claim?.reason || v?.teacherNote || 'Tidak ada keterangan tertulis'}"
                      </p>
                      {v?.claim && (
                        <div className="mt-2 text-[11px] text-slate-600 flex items-center gap-3">
                          <span>
                            Bidang Selisih: <strong>{v.claim.claimedField}</strong>
                          </span>
                          <span>
                            Tercatat: <strong>{v.claim.currentValue}</strong>
                          </span>
                          <span>
                            Klaim Guru: <strong>{v.claim.claimedValue}</strong>
                          </span>
                        </div>
                      )}
                      {v?.staffNote && (
                        <div className="mt-2 pt-2 border-t border-rose-200/50 text-[11px] text-blue-900">
                          <span className="font-bold">Catatan Staf Lokasi:</span> "{v.staffNote}"
                        </div>
                      )}
                      {v?.financeNote && (
                        <div className="mt-2 pt-2 border-t border-rose-200/50 text-[11px] text-purple-900">
                          <span className="font-bold">Respon Wilayah / Keuangan:</span> "{v.financeNote}"
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenResponseModal(s)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition"
                      title="Beri respon terhadap catatan staf / sanggahan guru"
                    >
                      <span>+ Beri Respon</span>
                      <Pencil className="w-3.5 h-3.5 text-indigo-600" />
                    </button>
                    <button
                      onClick={() => onOpenDisputeReviewModal(s)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
                    >
                      Proses Keputusan Keuangan
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal Beri Respon Keuangan Wilayah */}
      {responseModalSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-1.5 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Respon Keuangan Wilayah</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {responseModalSession.namaPengajar}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Nopeg: {responseModalSession.nopeg} • Cabang: {responseModalSession.lokasi}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setResponseModalSession(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 my-4">
              {/* Catatan / Sanggahan Guru */}
              {(() => {
                const v = verifications[responseModalSession.id];
                const teacherText = v?.claim?.reason || v?.teacherNote;
                return (
                  <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs">
                    <span className="font-bold text-amber-900 block mb-1">
                      Catatan / Sanggahan Guru:
                    </span>
                    {v?.claim && (
                      <div className="mb-2 text-[11px] text-amber-950 font-medium bg-white/70 p-2 rounded-lg border border-amber-200/60">
                        <div>Bidang: <span className="font-bold">{v.claim.claimedField}</span></div>
                        <div className="flex gap-3 mt-0.5">
                          <span>Tercatat: <strong>{v.claim.currentValue}</strong></span>
                          <span>Klaim Guru: <strong className="text-rose-600">{v.claim.claimedValue}</strong></span>
                        </div>
                      </div>
                    )}
                    <p className="italic text-slate-700">
                      "{teacherText || 'Tidak ada catatan tertulis dari guru.'}"
                    </p>
                  </div>
                );
              })()}

              {/* Catatan Staf Lokasi */}
              {(() => {
                const v = verifications[responseModalSession.id];
                return (
                  <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs">
                    <span className="font-bold text-blue-900 block mb-1">
                      Catatan Staf Lokasi ({v?.staffVerifiedBy || 'Staf Lokasi'}):
                    </span>
                    <p className="italic text-slate-700">
                      "{v?.staffNote || 'Tidak ada catatan khusus dari staf lokasi.'}"
                    </p>
                  </div>
                );
              })()}

              {/* Input Respon Keuangan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Respon / Tanggapan Keuangan Wilayah
                </label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Tuliskan respon resmi dari keuangan wilayah untuk guru dan staf lokasi (contoh: Telah diperiksa dengan log fingerprint cabang, selisih 2 sesi disetujui untuk penyesuaian honorarium)..."
                  rows={4}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Status Pilihan */}
              {(() => {
                const v = verifications[responseModalSession.id];
                const status = v?.status || 'BELUM_VERIFIKASI';
                if (status === 'SANGGAHAN') {
                  return (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                      <span className="font-semibold text-slate-700 block">
                        Tindakan Status Verifikasi:
                      </span>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="decisionStatus"
                            checked={responseDecisionStatus === 'DISETUJUI_KEUANGAN'}
                            onChange={() => setResponseDecisionStatus('DISETUJUI_KEUANGAN')}
                            className="text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="font-medium text-slate-800">Setujui Final</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="decisionStatus"
                            checked={responseDecisionStatus === 'REVISI_DITERIMA'}
                            onChange={() => setResponseDecisionStatus('REVISI_DITERIMA')}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-medium text-slate-800">Revisi Diterima</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="decisionStatus"
                            checked={responseDecisionStatus === 'KEEP'}
                            onChange={() => setResponseDecisionStatus('KEEP')}
                            className="text-slate-600 focus:ring-slate-500"
                          />
                          <span className="font-medium text-slate-800">Tetap Sanggahan</span>
                        </label>
                      </div>
                    </div>
                  );
                } else if (status !== 'DISETUJUI_KEUANGAN') {
                  return (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={responseDecisionStatus === 'DISETUJUI_KEUANGAN'}
                          onChange={(e) =>
                            setResponseDecisionStatus(e.target.checked ? 'DISETUJUI_KEUANGAN' : 'KEEP')
                          }
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="font-medium text-slate-800">
                          Sekaligus Setujui Final sesi ini
                        </span>
                      </label>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setResponseModalSession(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!responseText.trim()) {
                    alert('Mohon tuliskan teks respon terlebih dahulu.');
                    return;
                  }
                  const newStatus = responseDecisionStatus === 'KEEP' ? undefined : responseDecisionStatus;
                  saveFinanceResponse(responseModalSession.id, responseText.trim(), newStatus);
                  setResponseModalSession(null);
                }}
                className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Kirim Respon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
