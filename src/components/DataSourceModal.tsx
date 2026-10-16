import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  FileSpreadsheet,
  Link,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';

interface DataSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataSourceModal: React.FC<DataSourceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    dataSourceConfig,
    updateDataSourceConfig,
    syncData,
    uploadFile,
    isSyncing,
    resetToDefaultData,
    sessions,
  } = useApp();

  const [sheetUrl, setSheetUrl] = useState(dataSourceConfig.sheetUrl);
  const [autoInterval, setAutoInterval] = useState(
    dataSourceConfig.autoSyncIntervalSeconds
  );
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  if (!isOpen) return null;

  const handleSaveAndSync = async () => {
    setFeedback(null);
    updateDataSourceConfig({
      sheetUrl,
      autoSyncIntervalSeconds: autoInterval,
    });

    const res = await syncData();
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFeedback(null);
    const res = await uploadFile(file);
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleResetData = () => {
    if (confirm('Kembalikan ke data bawaan awal (135 data sesi & akun default)?')) {
      resetToDefaultData();
      setFeedback({
        type: 'success',
        message: 'Data aplikasi berhasil di-reset ke kondisi awal.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Integrasi Sumber Data & Real-Time Sync
              </h3>
              <p className="text-xs text-slate-500">
                Hubungkan link Google Spreadsheet atau unggah berkas Excel (.xlsx / .csv)
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

        {feedback && (
          <div
            className={`mt-4 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs font-medium ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">{feedback.message}</div>
          </div>
        )}

        <div className="space-y-6 mt-6">
          {/* SECTION 1: Google Sheet Real-time URL */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Link className="w-4 h-4 text-blue-600" />
                Link Google Spreadsheet Real-Time
              </label>
              {dataSourceConfig.lastSyncedAt && (
                <span className="text-[10px] text-slate-500">
                  Sinkron terakhir:{' '}
                  {new Date(dataSourceConfig.lastSyncedAt).toLocaleTimeString('id-ID')}{' '}
                  WIB
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-500 mb-3">
              Mendukung link Google Sheets publik atau link "Publikasikan ke Web" (CSV).
              Aplikasi akan melakukan sinkronisasi real-time setiap interval yang dipilih.
            </p>

            <input
              type="url"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv"
              className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Interval Auto-Sync Real-Time:
                </label>
                <select
                  value={autoInterval}
                  onChange={(e) => setAutoInterval(Number(e.target.value))}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-700"
                >
                  <option value={0}>Manual (Hanya saat klik Sync)</option>
                  <option value={30}>Setiap 30 Detik (Live Update)</option>
                  <option value={60}>Setiap 1 Menit</option>
                  <option value={300}>Setiap 5 Menit</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleSaveAndSync}
                  disabled={isSyncing}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`}
                  />
                  {isSyncing ? 'Menyinkronkan...' : 'Simpan & Sync Sekarang'}
                </button>
              </div>
            </div>

            <div className="mt-3 p-2.5 bg-blue-50/70 rounded-xl border border-blue-100 text-[11px] text-blue-900 leading-relaxed">
              <strong>Tips Google Sheets:</strong> Buka file Spreadsheet Anda &gt; menu{' '}
              <strong>File</strong> &gt; <strong>Bagikan</strong> &gt;{' '}
              <strong>Publikasikan ke web</strong> &gt; pilih tautan{' '}
              <strong>Nilai yang dipisahkan koma (.csv)</strong> &gt; salin link tersebut ke kolom di atas.
            </div>
          </div>

          {/* SECTION 2: Direct Upload File Excel / CSV */}
          <div className="border border-dashed border-slate-300 rounded-2xl p-5 text-center bg-white hover:bg-slate-50 transition">
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-slate-800">
              Unggah Berkas Excel (.xlsx, .xls) atau .CSV
            </h4>
            <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
              Perbarui rekap sesi secara manual langsung dari file komputer Anda tanpa perlu Google Sheets.
            </p>
            <div className="mt-3">
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs transition">
                <Upload className="w-3.5 h-3.5" />
                Pilih Berkas Komputer
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Current State Info & Reset */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="text-slate-500 text-center sm:text-left">
              Data aktif saat ini:{' '}
              <strong className="text-slate-800">{sessions.length}</strong> catatan sesi mengajar
            </div>

            <button
              type="button"
              onClick={handleResetData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset ke Data Bawaan Awal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
