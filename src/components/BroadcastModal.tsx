import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import {
  X,
  Bell,
  Send,
  AlertTriangle,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BroadcastModal: React.FC<BroadcastModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { sendNotification } = useApp();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'warning' | 'success' | 'dispute'>('warning');
  const [targetRole, setTargetRole] = useState<UserRole | 'ALL'>('guru');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      alert('Judul dan pesan tidak boleh kosong.');
      return;
    }

    sendNotification(
      title.trim(),
      message.trim(),
      type,
      targetRole
    );

    alert('Notifikasi broadcast berhasil dikirim!');
    setTitle('');
    setMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Kirim Notifikasi / Broadcast
              </h3>
              <p className="text-xs text-slate-500">
                Kirim pengingat batas waktu verifikasi atau pengumuman keuangan
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

        <form onSubmit={handleSubmit} className="space-y-4 mt-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Penerima
            </label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value as any)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
            >
              <option value="guru">Hanya Seluruh Guru / Pengajar</option>
              <option value="staf_lokasi">Hanya Staf Lokasi Cabang</option>
              <option value="ALL">Semua Pengguna (Guru, Staf & Keuangan)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tipe Notifikasi
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
            >
              <option value="warning">Peringatan / Pengingat Deadline</option>
              <option value="info">Informasi Umum</option>
              <option value="success">Pemberitahuan Sukses / Pencairan</option>
              <option value="dispute">Klarifikasi Sesi Mengajar</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Judul Notifikasi
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Pengingat Batas Akhir Verifikasi Sesi Hari Ini Pukul 17.00"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Isi Pesan Notifikasi
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tuliskan rincian pesan yang akan diterima di lonceng notifikasi pengguna..."
              rows={4}
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Kirim Notifikasi Sekarang
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
