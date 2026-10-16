import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TeachingSession, ClaimDiff, VerificationStatus } from '../types';
import { formatIndonesianDecimal } from '../utils/numberFormat';
import {
  X,
  AlertTriangle,
  Send,
  CheckCircle2,
  Clock,
  Shield,
  FileQuestion,
} from 'lucide-react';

interface DisputeModalProps {
  session: TeachingSession | null;
  isOpen: boolean;
  onClose: () => void;
  isReviewMode?: boolean; // if Admin Keuangan is reviewing the dispute
}

export const DisputeModal: React.FC<DisputeModalProps> = ({
  session,
  isOpen,
  onClose,
  isReviewMode = false,
}) => {
  const { verifySession, verifications, currentUser } = useApp();

  const [claimedField, setClaimedField] = useState('Dur Mengajar Swasta');
  const [claimedValue, setClaimedValue] = useState('');
  const [reason, setReason] = useState('');
  const [financeDecisionNote, setFinanceDecisionNote] = useState('');

  if (!isOpen || !session) return null;

  const existingVerification = verifications[session.id];
  const existingClaim = existingVerification?.claim;

  // Determine current value for the selected field
  const getCurrentFieldValue = (field: string) => {
    switch (field) {
      case 'Dur Mengajar Negeri':
        return formatIndonesianDecimal(session.durMengajarNegeri);
      case 'Menit Sangsi Mengajar Negeri':
        return formatIndonesianDecimal(session.menitSangsiMengajarNegeri);
      case 'Insentif Hadir Mengajar Negeri':
        return formatIndonesianDecimal(session.insentifHadirMengajarNegeri);
      case 'Jaga Tes Negeri':
        return formatIndonesianDecimal(session.jagaTesNegeri);
      case 'Dur Mengajar Swasta':
        return formatIndonesianDecimal(session.durMengajarSwasta);
      case 'Menit Sangsi Mengajar Swasta':
        return formatIndonesianDecimal(session.menitSangsiMengajarSwasta);
      case 'Insentif Hadir Mengajar Swasta':
        return formatIndonesianDecimal(session.insentifHadirMengajarSwasta);
      case 'Jaga TesSwasta':
        return formatIndonesianDecimal(session.jagaTesSwasta);
      case 'Dur Konsultasi Negeri':
        return formatIndonesianDecimal(session.durKonsultasiNegeri);
      case 'Inst Konsultasi Negeri':
        return formatIndonesianDecimal(session.instKonsultasiNegeri);
      case 'Dur Konsultasi Swasta':
        return formatIndonesianDecimal(session.durKonsultasiSwasta);
      case 'Inst Konsultasi Swasta':
        return formatIndonesianDecimal(session.instKonsultasiSwasta);
      case 'Belum Presensi':
        return session.belumPresensi.toString();
      default:
        return '0,00';
    }
  };

  const handleTeacherSubmitDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Harap masukkan alasan sanggahan / perbedaan sesi.');
      return;
    }

    const claim: ClaimDiff = {
      claimedField,
      currentValue: getCurrentFieldValue(claimedField),
      claimedValue: claimedValue || '0',
      reason: reason.trim(),
      dateCreated: new Date().toISOString(),
    };

    verifySession(session.id, 'SANGGAHAN', reason.trim(), claim);
    onClose();
  };

  const handleFinanceResolveDispute = (status: VerificationStatus) => {
    verifySession(session.id, status, financeDecisionNote.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isReviewMode ? 'Penyelesaian Sanggahan Sesi' : 'Ajukan Sanggahan / Selisih Sesi'}
              </h3>
              <p className="text-xs text-slate-500">
                {session.namaPengajar} ({session.lokasi})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Session Box */}
        <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Nama Pengajar:</span>
            <span className="font-bold">{session.namaPengajar} ({session.nopeg})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Lokasi / Cabang:</span>
            <span className="font-bold">{session.lokasi}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Tercatat di Sistem:</span>
            <span>
              Ajar: {session.totalSesiMengajar.toFixed(2)} sesi | Konsul: {session.totalSesiKonsultasi.toFixed(2)} sesi
            </span>
          </div>
        </div>

        {/* Teacher Filing Form */}
        {!isReviewMode ? (
          <form onSubmit={handleTeacherSubmitDispute} className="space-y-4 mt-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pilih Kolom / Bagian yang Berselisih
              </label>
              <select
                value={claimedField}
                onChange={(e) => setClaimedField(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                <option value="Dur Mengajar Negeri">Dur Mengajar Negeri</option>
                <option value="Menit Sangsi Mengajar Negeri">Menit Sangsi Mengajar Negeri</option>
                <option value="Insentif Hadir Mengajar Negeri">Insentif Hadir Mengajar Negeri</option>
                <option value="Jaga Tes Negeri">Jaga Tes Negeri</option>
                <option value="Dur Mengajar Swasta">Dur Mengajar Swasta</option>
                <option value="Menit Sangsi Mengajar Swasta">Menit Sangsi Mengajar Swasta</option>
                <option value="Insentif Hadir Mengajar Swasta">Insentif Hadir Mengajar Swasta</option>
                <option value="Jaga TesSwasta">Jaga TesSwasta</option>
                <option value="Dur Konsultasi Negeri">Dur Konsultasi Negeri</option>
                <option value="Inst Konsultasi Negeri">Inst Konsultasi Negeri</option>
                <option value="Dur Konsultasi Swasta">Dur Konsultasi Swasta</option>
                <option value="Inst Konsultasi Swasta">Inst Konsultasi Swasta</option>
                <option value="Belum Presensi">Belum Presensi</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nilai di Sistem Saat Ini
                </label>
                <input
                  type="text"
                  disabled
                  value={getCurrentFieldValue(claimedField)}
                  className="w-full text-xs p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nilai Seharusnya (Klaim Anda)
                </label>
                <input
                  type="text"
                  value={claimedValue}
                  onChange={(e) => setClaimedValue(e.target.value)}
                  placeholder="Contoh: 15,00"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alasan / Penjelasan Sanggahan
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Jelaskan tanggal jadwal mengajar, kelas bimbingan, atau dispensasi yang telah disetujui..."
                rows={3}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Kirim Sanggahan ke Keuangan
              </button>
            </div>
          </form>
        ) : (
          /* Admin Keuangan Reviewing & Resolving Dispute */
          <div className="space-y-4 mt-5">
            <div className="p-3.5 bg-rose-50/70 rounded-2xl border border-rose-200 text-xs">
              <span className="font-bold text-rose-950 uppercase tracking-wider text-[10px] block mb-1">
                Rincian Sanggahan Pengajar:
              </span>
              <p className="font-semibold text-slate-900">
                Kolom: {existingClaim?.claimedField || 'Sesi Mengajar'}
              </p>
              <div className="flex items-center gap-4 mt-1 text-slate-600">
                <span>Nilai Sistem: <strong>{existingClaim?.currentValue}</strong></span>
                <span>Klaim Guru: <strong className="text-rose-600">{existingClaim?.claimedValue}</strong></span>
              </div>
              <p className="mt-2 text-slate-700 italic bg-white p-2.5 rounded-xl border border-rose-100">
                "{existingClaim?.reason || existingVerification?.teacherNote || 'Tidak ada catatan tertulis.'}"
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Keputusan Keuangan
              </label>
              <textarea
                value={financeDecisionNote}
                onChange={(e) => setFinanceDecisionNote(e.target.value)}
                placeholder="Contoh: Telah dicocokkan dengan log fingerprint cabang, revisi 2 sesi disetujui..."
                rows={3}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Tutup
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleFinanceResolveDispute('REVISI_DITERIMA')}
                  className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
                >
                  Setujui Revisi
                </button>
                <button
                  type="button"
                  onClick={() => handleFinanceResolveDispute('DISETUJUI_KEUANGAN')}
                  className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
                >
                  Selesaikan & Setujui
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
