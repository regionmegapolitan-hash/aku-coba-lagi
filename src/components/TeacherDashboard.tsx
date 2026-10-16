import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { TeachingSession, VerificationStatus } from '../types';
import { exportTeacherSlipPdf } from '../utils/pdfExport';
import { exportSessionsToCsv } from '../utils/csvExport';
import { formatIndonesianDecimal } from '../utils/numberFormat';
import {
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  FileText,
  FileSpreadsheet,
  Building2,
  Calendar,
  Search,
  Filter,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

interface TeacherDashboardProps {
  onOpenDisputeModal: (session: TeachingSession) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  onOpenDisputeModal,
}) => {
  const { currentUser, sessions, verifications, verifySession, verifyAllTeacherSessions } =
    useApp();

  // If currentUser is guru, default to their Nopeg; otherwise allow selecting teacher
  const [selectedNopeg, setSelectedNopeg] = useState<string>(
    currentUser?.role === 'guru' ? currentUser.nopeg || '724174' : '724174'
  );
  const [searchFilter, setSearchFilter] = useState('');

  // Extract all unique teachers from sessions
  const teacherList = useMemo(() => {
    const map = new Map<string, { nopeg: string; nama: string }>();
    sessions.forEach((s) => {
      if (!map.has(s.nopeg)) {
        map.set(s.nopeg, { nopeg: s.nopeg, nama: s.namaPengajar });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.nama.localeCompare(b.nama));
  }, [sessions]);

  // Selected teacher's sessions
  const teacherSessions = useMemo(() => {
    return sessions.filter((s) => s.nopeg === selectedNopeg);
  }, [sessions, selectedNopeg]);

  const currentTeacher = useMemo(() => {
    return (
      teacherList.find((t) => t.nopeg === selectedNopeg) || {
        nopeg: selectedNopeg,
        nama: teacherSessions[0]?.namaPengajar || 'Pengajar',
      }
    );
  }, [teacherList, selectedNopeg, teacherSessions]);

  // Aggregate stats
  const stats = useMemo(() => {
    let totNegeri = 0;
    let totSwasta = 0;
    let totKonsNegeri = 0;
    let totKonsSwasta = 0;
    let totJagaTesNegeri = 0;
    let totJagaTesSwasta = 0;
    let totBelumPresensi = 0;
    let verifiedCount = 0;
    let disputeCount = 0;

    teacherSessions.forEach((s) => {
      totNegeri += s.sesiMengajarNegeri;
      totSwasta += s.sesiMengajarSwasta;
      totKonsNegeri += s.sesiKonsultasiNegeri;
      totKonsSwasta += s.sesiKonsultasiSwasta;
      totJagaTesNegeri += s.jagaTesNegeri;
      totJagaTesSwasta += s.jagaTesSwasta;
      totBelumPresensi += s.belumPresensi;

      const v = verifications[s.id];
      if (v?.status === 'SESUAI_GURU' || v?.status === 'SESUAI_LOKASI' || v?.status === 'DISETUJUI_KEUANGAN') {
        verifiedCount++;
      } else if (v?.status === 'SANGGAHAN') {
        disputeCount++;
      }
    });

    return {
      totalMengajar: parseFloat((totNegeri + totSwasta).toFixed(2)),
      totMengajarNegeri: parseFloat(totNegeri.toFixed(2)),
      totMengajarSwasta: parseFloat(totSwasta.toFixed(2)),
      totalKonsultasi: parseFloat((totKonsNegeri + totKonsSwasta).toFixed(2)),
      totKonsultasiNegeri: parseFloat(totKonsNegeri.toFixed(2)),
      totKonsultasiSwasta: parseFloat(totKonsSwasta.toFixed(2)),
      totJagaTes: parseFloat((totJagaTesNegeri + totJagaTesSwasta).toFixed(2)),
      totJagaTesNegeri: parseFloat(totJagaTesNegeri.toFixed(2)),
      totJagaTesSwasta: parseFloat(totJagaTesSwasta.toFixed(2)),
      totBelumPresensi,
      totalCabang: teacherSessions.length,
      verifiedCount,
      disputeCount,
      isAllVerified: teacherSessions.length > 0 && verifiedCount === teacherSessions.length,
    };
  }, [teacherSessions, verifications]);

  const filteredSessions = useMemo(() => {
    if (!searchFilter) return teacherSessions;
    return teacherSessions.filter(
      (s) =>
        s.lokasi.toLowerCase().includes(searchFilter.toLowerCase()) ||
        s.lok.toLowerCase().includes(searchFilter.toLowerCase())
    );
  }, [teacherSessions, searchFilter]);

  const handleExportPdf = () => {
    const periode = teacherSessions[0]?.periode || 'Periode Berjalan';
    exportTeacherSlipPdf(
      currentTeacher.nama,
      currentTeacher.nopeg,
      periode,
      teacherSessions,
      verifications
    );
  };

  const handleExportCsv = () => {
    exportSessionsToCsv(
      teacherSessions,
      verifications,
      `Rekap_Sesi_${currentTeacher.nopeg}_${currentTeacher.nama.replace(/\s+/g, '_')}.csv`
    );
  };

  const handleVerifyAll = () => {
    if (confirm(`Konfirmasi seluruh ${teacherSessions.length} lokasi mengajar telah sesuai?`)) {
      verifyAllTeacherSessions(selectedNopeg, 'SESUAI_GURU');
    }
  };

  return (
    <div className="space-y-6">
      {/* Teacher Header & Selection Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold text-xl border border-amber-200">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900">
                  {currentTeacher.nama}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-slate-100 text-slate-700">
                  Nopeg: {currentTeacher.nopeg}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                Periode:{' '}
                <span className="font-medium text-slate-700">
                  {teacherSessions[0]?.periode || '2026-08-25 sd 2026-09-24'}
                </span>
                <span>•</span>
                <span>{stats.totalCabang} Cabang Mengajar</span>
              </p>
            </div>
          </div>

          {/* Action Export & Switcher if admin/staff */}
          <div className="flex flex-wrap items-center gap-2">
            {currentUser?.role !== 'guru' && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-500">
                  Pilih Guru:
                </label>
                <select
                  value={selectedNopeg}
                  onChange={(e) => setSelectedNopeg(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                >
                  {teacherList.map((t) => (
                    <option key={t.nopeg} value={t.nopeg}>
                      {t.nama} ({t.nopeg})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={handleExportPdf}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs transition"
            >
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              Cetak Slip PDF
            </button>

            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Ekspor CSV
            </button>
          </div>
        </div>

        {/* Verification Status Banner */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {stats.isAllVerified ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Semua Sesi Telah Diverifikasi ({stats.verifiedCount}/{stats.totalCabang})
              </div>
            ) : stats.disputeCount > 0 ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Terdapat {stats.disputeCount} Sanggahan Sedang Ditinjau Keuangan
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                <Clock className="w-4 h-4 text-amber-600" />
                {stats.totalCabang - stats.verifiedCount} Lokasi Belum Dikonfirmasi
              </div>
            )}
            <span className="text-xs text-slate-500 hidden sm:inline">
              Silakan periksa jam mengajar dan sesi di masing-masing cabang di bawah ini.
            </span>
          </div>

          {!stats.isAllVerified && (
            <button
              onClick={handleVerifyAll}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              Konfirmasi Semua Sesuai (1-Klik)
            </button>
          )}
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Total Sesi Mengajar
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {formatIndonesianDecimal(stats.totalMengajar)}
            </span>
            <span className="text-xs font-medium text-slate-500">Sesi</span>
          </div>
          <div className="text-[11px] mt-1.5 flex items-center gap-1.5 flex-wrap">
            <span className="text-indigo-700 font-semibold">
              Negeri: {formatIndonesianDecimal(stats.totMengajarNegeri)}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 font-semibold">
              Swasta: {formatIndonesianDecimal(stats.totMengajarSwasta)}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Total Sesi Konsultasi
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-extrabold text-indigo-600">
              {formatIndonesianDecimal(stats.totalKonsultasi)}
            </span>
            <span className="text-xs font-medium text-slate-500">Sesi</span>
          </div>
          <div className="text-[11px] mt-1.5 flex items-center gap-1.5 flex-wrap">
            <span className="text-amber-700 font-semibold">
              Negeri: {formatIndonesianDecimal(stats.totKonsultasiNegeri)}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-amber-700 font-semibold">
              Swasta: {formatIndonesianDecimal(stats.totKonsultasiSwasta)}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Jaga Tes & Pengawasan
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {formatIndonesianDecimal(stats.totJagaTes)}
            </span>
            <span className="text-xs font-medium text-slate-500">Sesi</span>
          </div>
          <div className="text-[11px] mt-1.5 flex items-center gap-1.5 flex-wrap">
            <span className="text-indigo-700 font-semibold">
              Negeri: {formatIndonesianDecimal(stats.totJagaTesNegeri)}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 font-semibold">
              Swasta: {formatIndonesianDecimal(stats.totJagaTesSwasta)}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Belum Presensi
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span
              className={`text-2xl font-extrabold ${
                stats.totBelumPresensi > 0 ? 'text-rose-600' : 'text-slate-900'
              }`}
            >
              {stats.totBelumPresensi}
            </span>
            <span className="text-xs font-medium text-slate-500">kali</span>
          </div>
          <span
            className={`text-[11px] font-medium mt-1 block ${
              stats.totBelumPresensi > 0 ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {stats.totBelumPresensi > 0
              ? 'Perlu konfirmasi ke staf lokasi'
              : 'Presensi lengkap & tertib'}
          </span>
        </div>
      </div>

      {/* Sessions Per Location Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Rincian Sesi per Cabang / Lokasi
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Klik "Sesuai" jika data cocok, atau "Ajukan Sanggahan" jika terdapat selisih sesi / sangsi.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Cari nama lokasi..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 sticky left-0 bg-slate-50 z-20 shadow-xs max-w-[170px]">
                  Lokasi / Cabang
                </th>
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
                <th className="py-2.5 px-2.5 text-center font-semibold">Aksi Pengecekan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={16} className="py-8 text-center text-slate-400">
                    Tidak ada sesi ditemukan
                  </td>
                </tr>
              ) : (
                filteredSessions.map((s) => {
                  const v = verifications[s.id];
                  const status = v?.status || 'BELUM_VERIFIKASI';

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 font-medium text-slate-900 sticky left-0 bg-white z-10 shadow-xs max-w-[170px]">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <div>
                            <span className="font-semibold block truncate max-w-[150px]">
                              {s.lokasi}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono block">
                              Kode Lok: {s.lok}
                            </span>
                          </div>
                        </div>
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
                      <td className="py-3.5 px-3 text-center">
                        {status === 'SESUAI_GURU' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Diverifikasi Guru
                          </span>
                        )}
                        {status === 'SESUAI_LOKASI' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <CheckCircle2 className="w-3 h-3 text-blue-600" />
                            Divalidasi Lokasi
                          </span>
                        )}
                        {status === 'DISETUJUI_KEUANGAN' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            <ShieldCheck className="w-3 h-3 text-purple-600" />
                            Disetujui Keuangan
                          </span>
                        )}
                        {status === 'SANGGAHAN' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Sanggahan Diajukan
                          </span>
                        )}
                        {status === 'BELUM_VERIFIKASI' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Belum Pengecekan
                          </span>
                        )}

                        {(v?.claim?.reason || v?.teacherNote) && (
                          <p
                            title={v?.claim?.reason || v?.teacherNote}
                            className="text-[10px] text-slate-500 mt-1 italic truncate max-w-[130px] mx-auto"
                          >
                            "{v?.claim?.reason || v?.teacherNote}"
                          </p>
                        )}
                        {v?.staffNote && (
                          <p
                            title={v.staffNote}
                            className="text-[10px] text-blue-700 mt-0.5 italic truncate max-w-[130px] mx-auto"
                          >
                            "Staf: {v.staffNote}"
                          </p>
                        )}
                        {v?.financeNote && (
                          <p
                            title={v.financeNote}
                            className="text-[10px] text-purple-700 font-semibold mt-0.5 italic truncate max-w-[130px] mx-auto"
                          >
                            "Wilayah: {v.financeNote}"
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => verifySession(s.id, 'SESUAI_GURU')}
                            title="Konfirmasi Sesi di Cabang ini Sesuai"
                            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                              status === 'SESUAI_GURU' || status === 'DISETUJUI_KEUANGAN'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Sesuai</span>
                          </button>

                          <button
                            onClick={() => onOpenDisputeModal(s)}
                            title="Ajukan Sanggahan / Koreksi Selisih Sesi"
                            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                              status === 'SANGGAHAN'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-slate-100 hover:bg-rose-600 hover:text-white text-slate-700'
                            }`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Sanggah</span>
                          </button>
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
    </div>
  );
};
