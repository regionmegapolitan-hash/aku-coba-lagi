import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { TeachingSession, VerificationStatus } from '../types';
import { exportBranchReportPdf } from '../utils/pdfExport';
import { exportSessionsToCsv } from '../utils/csvExport';
import { formatIndonesianDecimal } from '../utils/numberFormat';
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  FileText,
  FileSpreadsheet,
  Users,
  Search,
  Filter,
  ShieldCheck,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface StaffDashboardProps {
  onOpenDisputeModal: (session: TeachingSession) => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  onOpenDisputeModal,
}) => {
  const { currentUser, sessions, verifications, verifySession } = useApp();

  // Get all unique branch locations
  const allLocations = useMemo(() => {
    const locSet = new Set<string>();
    sessions.forEach((s) => {
      if (s.lokasi) locSet.add(s.lokasi);
    });
    return Array.from(locSet).sort();
  }, [sessions]);

  // Determine initial selected location
  const initialLoc = useMemo(() => {
    if (currentUser?.role === 'staf_lokasi' && currentUser.assignedLocation) {
      if (currentUser.assignedLocation !== 'ALL') {
        return currentUser.assignedLocation;
      }
    }
    return allLocations[0] || 'NF Jatimekar';
  }, [currentUser, allLocations]);

  const [selectedLocation, setSelectedLocation] = useState<string>(initialLoc);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [staffNoteModalSession, setStaffNoteModalSession] = useState<TeachingSession | null>(null);
  const [staffNoteText, setStaffNoteText] = useState('');

  // Sessions filtered by location
  const branchSessions = useMemo(() => {
    return sessions.filter((s) => s.lokasi === selectedLocation);
  }, [sessions, selectedLocation]);

  // Branch statistics
  const branchStats = useMemo(() => {
    let totNegeri = 0;
    let totSwasta = 0;
    let totKonsNegeri = 0;
    let totKonsSwasta = 0;
    let totJagaTesNegeri = 0;
    let totJagaTesSwasta = 0;
    let totBelumPresensi = 0;
    let verifiedCount = 0;
    let disputeCount = 0;

    branchSessions.forEach((s) => {
      totNegeri += s.sesiMengajarNegeri;
      totSwasta += s.sesiMengajarSwasta;
      totKonsNegeri += s.sesiKonsultasiNegeri;
      totKonsSwasta += s.sesiKonsultasiSwasta;
      totJagaTesNegeri += s.jagaTesNegeri;
      totJagaTesSwasta += s.jagaTesSwasta;
      totBelumPresensi += s.belumPresensi;

      const v = verifications[s.id];
      if (
        v?.status === 'SESUAI_GURU' ||
        v?.status === 'SESUAI_LOKASI' ||
        v?.status === 'DISETUJUI_KEUANGAN'
      ) {
        verifiedCount++;
      } else if (v?.status === 'SANGGAHAN') {
        disputeCount++;
      }
    });

    return {
      teacherCount: branchSessions.length,
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
      verifiedCount,
      disputeCount,
      pendingCount: branchSessions.length - verifiedCount - disputeCount,
    };
  }, [branchSessions, verifications]);

  // Filtered session list by search & status
  const filteredList = useMemo(() => {
    return branchSessions.filter((s) => {
      const matchSearch =
        s.namaPengajar.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nopeg.includes(searchTerm) ||
        s.kode.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (statusFilter === 'ALL') return true;
      const v = verifications[s.id];
      const status = v?.status || 'BELUM_VERIFIKASI';
      return status === statusFilter;
    });
  }, [branchSessions, searchTerm, statusFilter, verifications]);

  const handleExportPdf = () => {
    const periode = branchSessions[0]?.periode || 'Periode Berjalan';
    exportBranchReportPdf(selectedLocation, periode, branchSessions, verifications);
  };

  const handleExportCsv = () => {
    exportSessionsToCsv(
      branchSessions,
      verifications,
      `Rekap_Cabang_${selectedLocation.replace(/\s+/g, '_')}.csv`
    );
  };

  const handleValidateAllStaff = () => {
    if (confirm(`Validasi semua data sesi untuk cabang ${selectedLocation} sebagai SESUAI?`)) {
      branchSessions.forEach((s) => {
        verifySession(
          s.id,
          'SESUAI_LOKASI',
          'Divalidasi staf lokasi berdasarkan presensi & jurnal cabang.'
        );
      });
    }
  };

  const handleSaveStaffNote = () => {
    if (!staffNoteModalSession) return;
    verifySession(staffNoteModalSession.id, 'SESUAI_LOKASI', staffNoteText);
    setStaffNoteModalSession(null);
    setStaffNoteText('');
  };

  return (
    <div className="space-y-6">
      {/* Branch Header & Selector */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center font-bold text-xl border border-emerald-200">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900">
                  {selectedLocation}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Operasional Cabang
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Verifikasi kesesuaian mengajar pengajar cabang & laporan pelaporan otomatis
              </p>
            </div>
          </div>

          {/* Action Export & Location Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600">
                Pilih Cabang:
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              >
                {allLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleExportPdf}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs transition"
            >
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              Rekap PDF
            </button>

            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Ekspor CSV
            </button>

            <button
              onClick={handleValidateAllStaff}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Validasi Semua Sesuai
            </button>
          </div>
        </div>
      </div>

      {/* Branch Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Pengajar Aktif
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {branchStats.teacherCount}
            </span>
            <span className="text-xs font-medium text-slate-500">Guru</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1.5 block">
            Terjadwal di cabang {selectedLocation}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Total Sesi Mengajar
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {formatIndonesianDecimal(branchStats.totalMengajar)}
            </span>
            <span className="text-xs font-medium text-slate-500">Sesi</span>
          </div>
          <div className="text-[11px] mt-1.5 flex items-center gap-1.5 flex-wrap">
            <span className="text-indigo-700 font-semibold">
              Negeri: {formatIndonesianDecimal(branchStats.totMengajarNegeri)}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 font-semibold">
              Swasta: {formatIndonesianDecimal(branchStats.totMengajarSwasta)}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Total Sesi Konsultasi
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-extrabold text-indigo-600">
              {formatIndonesianDecimal(branchStats.totalKonsultasi)}
            </span>
            <span className="text-xs font-medium text-slate-500">Sesi</span>
          </div>
          <div className="text-[11px] mt-1.5 flex items-center gap-1.5 flex-wrap">
            <span className="text-amber-700 font-semibold">
              Negeri: {formatIndonesianDecimal(branchStats.totKonsultasiNegeri)}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-amber-700 font-semibold">
              Swasta: {formatIndonesianDecimal(branchStats.totKonsultasiSwasta)}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Sesi Jaga Tes
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {formatIndonesianDecimal(branchStats.totalJagaTes)}
            </span>
            <span className="text-xs font-medium text-slate-500">Sesi</span>
          </div>
          <div className="text-[11px] mt-1.5 flex items-center gap-1.5 flex-wrap">
            <span className="text-indigo-700 font-semibold">
              Negeri: {formatIndonesianDecimal(branchStats.totJagaTesNegeri)}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 font-semibold">
              Swasta: {formatIndonesianDecimal(branchStats.totJagaTesSwasta)}
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
                branchStats.totBelumPresensi > 0 ? 'text-rose-600' : 'text-slate-900'
              }`}
            >
              {branchStats.totBelumPresensi}
            </span>
            <span className="text-xs font-medium text-slate-500">kejadian</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1.5 block">
            Perlu konfirmasi presensi lokal
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Status Validasi
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-extrabold text-emerald-600">
              {branchStats.verifiedCount}/{branchStats.teacherCount}
            </span>
            <span className="text-xs font-medium text-slate-500">Selesai</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1.5 block">
            {branchStats.disputeCount > 0 ? (
              <span className="text-rose-600 font-semibold">
                {branchStats.disputeCount} sanggahan diajukan
              </span>
            ) : (
              'Tidak ada sanggahan'
            )}
          </span>
        </div>
      </div>

      {/* Teachers in this Branch Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Daftar Guru di Cabang {selectedLocation}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cek kesesuaian sesi mengajar dan absensi guru di lokasi Anda.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter by status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700"
            >
              <option value="ALL">Semua Status</option>
              <option value="BELUM_VERIFIKASI">Belum Verifikasi</option>
              <option value="SESUAI_GURU">Sesuai Guru</option>
              <option value="SESUAI_LOKASI">Sesuai Lokasi</option>
              <option value="SANGGAHAN">Ada Sanggahan</option>
              <option value="DISETUJUI_KEUANGAN">Disetujui Keuangan</option>
            </select>

            <div className="relative w-48 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama / nopeg..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 sticky left-0 bg-slate-50 z-20 shadow-xs max-w-[170px]">
                  Nama Pengajar & Nopeg
                </th>
                <th className="py-2.5 px-1.5 text-center">Kode</th>
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
                <th className="py-2.5 px-2.5 text-center font-semibold">Validasi Staf</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={17} className="py-8 text-center text-slate-400">
                    Tidak ada data pengajar di cabang ini yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((s) => {
                  const v = verifications[s.id];
                  const status = v?.status || 'BELUM_VERIFIKASI';

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 font-medium text-slate-900 sticky left-0 bg-white z-10 shadow-xs max-w-[170px]">
                        <span className="font-bold text-slate-900 block truncate max-w-[160px]">
                          {s.namaPengajar}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          Nopeg: {s.nopeg}
                        </span>
                      </td>
                      <td className="py-2.5 px-1.5 text-center">
                        <span className="px-1.5 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-slate-100 text-slate-700">
                          {s.kode || '-'}
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
                      <td className="py-3.5 px-3 text-center">
                        {status === 'SESUAI_LOKASI' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Divalidasi Lokasi
                          </span>
                        )}
                        {status === 'SESUAI_GURU' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <CheckCircle2 className="w-3 h-3 text-blue-600" />
                            Diverifikasi Guru
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
                            Ada Sanggahan
                          </span>
                        )}
                        {status === 'BELUM_VERIFIKASI' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Menunggu
                          </span>
                        )}

                        {v?.staffNote && (
                          <p className="text-[10px] text-slate-500 mt-1 italic truncate max-w-[130px] mx-auto" title={v.staffNote}>
                            "Staf: {v.staffNote}"
                          </p>
                        )}
                        {(v?.claim?.reason || v?.teacherNote) && (
                          <p className="text-[10px] text-amber-800 mt-0.5 italic truncate max-w-[130px] mx-auto" title={v?.claim?.reason || v?.teacherNote}>
                            "Guru: {v?.claim?.reason || v?.teacherNote}"
                          </p>
                        )}
                        {v?.financeNote && (
                          <p className="text-[10px] text-purple-800 font-semibold mt-0.5 italic truncate max-w-[130px] mx-auto" title={v.financeNote}>
                            "Wilayah: {v.financeNote}"
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() =>
                              verifySession(
                                s.id,
                                'SESUAI_LOKASI',
                                'Validasi presensi dan jadwal kelas sesuai logbook cabang.'
                              )
                            }
                            className="p-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-200 transition flex items-center gap-1"
                            title="Validasi Sesuai"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="hidden lg:inline">Validasi</span>
                          </button>

                          <button
                            onClick={() => {
                              setStaffNoteModalSession(s);
                              setStaffNoteText(v?.staffNote || '');
                            }}
                            className="p-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                            title="Tambah Catatan Staf"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
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

      {/* Staff Note Modal */}
      {staffNoteModalSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in duration-150">
            <h4 className="text-base font-bold text-slate-900 mb-1">
              Catatan Staf Cabang
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Pengajar: <strong>{staffNoteModalSession.namaPengajar}</strong> (
              {staffNoteModalSession.lokasi})
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Verifikasi / Keterangan Presensi
              </label>
              <textarea
                value={staffNoteText}
                onChange={(e) => setStaffNoteText(e.target.value)}
                placeholder="Contoh: Sudah konfirmasi log manual, sesi pengganti tanggal 10 Sep telah dicatat..."
                rows={3}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setStaffNoteModalSession(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveStaffNote}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
              >
                Simpan & Validasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
