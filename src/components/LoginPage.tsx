import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import {
  FileSpreadsheet,
  Lock,
  User,
  Mail,
  Shield,
  Building2,
  GraduationCap,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Send,
  UserPlus,
  ShieldCheck,
  ChevronRight,
  Info,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, registerUser, users, sessions } = useApp();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register form state (matching image.png)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('guru');
  const [regNopeg, setRegNopeg] = useState('');
  const [regLocation, setRegLocation] = useState('NF Jatimekar');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');

  const [regFeedback, setRegFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // List of unique branches for staff assignment
  const branchLocations = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => {
      if (s.lokasi) set.add(s.lokasi);
    });
    return Array.from(set).sort();
  }, [sessions]);

  // Handle standard login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!usernameOrEmail.trim() || !password) {
      setLoginError('Harap masukkan email/username dan password.');
      return;
    }

    const res = login(usernameOrEmail.trim(), password);
    if (!res.success) {
      setLoginError(res.message || 'Login gagal.');
    }
  };

  // Quick 1-click login for the 3 target dashboards
  const handleQuickDashboardLogin = (targetRole: UserRole) => {
    setLoginError(null);
    if (targetRole === 'admin_keuangan') {
      login('admin', 'admin123');
    } else if (targetRole === 'staf_lokasi') {
      login('staf.jatimekar', 'staf123');
    } else {
      login('guru.adip', 'guru123');
    }
  };

  // Handle register form submission (image.png workflow)
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegFeedback(null);

    if (!regName.trim()) {
      setRegFeedback({ type: 'error', message: 'Nama lengkap & gelar wajib diisi.' });
      return;
    }

    if (!regEmail.trim() || !regEmail.includes('@')) {
      setRegFeedback({ type: 'error', message: 'Format email tidak valid.' });
      return;
    }

    if (regRole === 'guru' && !regNopeg.trim()) {
      setRegFeedback({ type: 'error', message: 'Nomor Pegawai (Nopeg) wajib diisi untuk Guru.' });
      return;
    }

    if (regPassword.length < 6) {
      setRegFeedback({ type: 'error', message: 'Password minimal 6 karakter.' });
      return;
    }

    if (regPassword !== regPasswordConfirm) {
      setRegFeedback({
        type: 'error',
        message: 'Konfirmasi password tidak cocok dengan password awal.',
      });
      return;
    }

    const res = registerUser({
      name: regName.trim(),
      email: regEmail.trim(),
      role: regRole,
      password: regPassword,
      nopeg: regRole === 'guru' ? regNopeg.trim() : undefined,
      assignedLocation: regRole === 'staf_lokasi' ? regLocation : undefined,
    });

    if (res.success) {
      setRegFeedback({ type: 'success', message: res.message });
      // Reset form
      setRegName('');
      setRegEmail('');
      setRegNopeg('');
      setRegPassword('');
      setRegPasswordConfirm('');
    } else {
      setRegFeedback({ type: 'error', message: res.message });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col justify-center items-center px-4 py-8 sm:py-12 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Banner Badge (matching screenshot header pill) */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-500/30 backdrop-blur-md mb-6 shadow-lg shadow-emerald-950/40 animate-in fade-in slide-in-from-top-3 duration-200">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="tracking-wide">
          Login dengan Email Terdaftar & Persetujuan Admin Wilayah
        </span>
      </div>

      {/* Main Container Card */}
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 relative z-10 border border-slate-100">
        {/* App Title Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-md shadow-blue-500/30 mb-2.5">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            SI-SESI
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Portal Verifikasi Sesi Mengajar & Rekap Keuangan Wilayah
          </p>
        </div>

        {/* Top Toggle Tabs: Masuk Akun | Daftar Akun Baru (matches image.png) */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setLoginError(null);
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
              activeTab === 'login'
                ? 'bg-white text-indigo-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-4 h-4 text-indigo-600" />
            Masuk Akun
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setRegFeedback(null);
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
              activeTab === 'register'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-4 h-4 text-emerald-600" />
            Daftar Akun Baru
          </button>
        </div>

        {/* TAB 1: MASUK AKUN (DASHBOARD WILAYAH, LOKASI, GURU) */}
        {activeTab === 'login' && (
          <div className="space-y-6">
            {/* Direct Dashboard Entry Section */}
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                Pilih Menu Masuk Dashboard:
              </p>

              <div className="grid grid-cols-1 gap-2.5">
                {/* 1. Dashboard Wilayah */}
                <button
                  type="button"
                  onClick={() => handleQuickDashboardLogin('admin_keuangan')}
                  className="group w-full p-3 rounded-2xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50/80 to-blue-50/50 hover:from-indigo-100/90 hover:to-blue-100/70 text-left transition flex items-center justify-between shadow-2xs hover:shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-950">
                          Dashboard Wilayah
                        </span>
                        <span className="text-[10px] font-semibold bg-indigo-200/70 text-indigo-800 px-2 py-0.2 rounded-full">
                          Pusat / Keuangan
                        </span>
                      </div>
                      <p className="text-[11px] text-indigo-700/80 mt-0.5">
                        Pantau seluruh cabang, persetujuan masal & sanggahan
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:text-indigo-700 group-hover:translate-x-0.5 transition" />
                </button>

                {/* 2. Dashboard Lokasi */}
                <button
                  type="button"
                  onClick={() => handleQuickDashboardLogin('staf_lokasi')}
                  className="group w-full p-3 rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/80 to-teal-50/50 hover:from-emerald-100/90 hover:to-teal-100/70 text-left transition flex items-center justify-between shadow-2xs hover:shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-950">
                          Dashboard Lokasi
                        </span>
                        <span className="text-[10px] font-semibold bg-emerald-200/70 text-emerald-800 px-2 py-0.2 rounded-full">
                          Staf Cabang
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-700/80 mt-0.5">
                        Pengecekan sesi mengajar lokal & validasi presensi cabang
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition" />
                </button>

                {/* 3. Dashboard Guru */}
                <button
                  type="button"
                  onClick={() => handleQuickDashboardLogin('guru')}
                  className="group w-full p-3 rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50/80 to-orange-50/50 hover:from-amber-100/90 hover:to-orange-100/70 text-left transition flex items-center justify-between shadow-2xs hover:shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-950">
                          Dashboard Guru
                        </span>
                        <span className="text-[10px] font-semibold bg-amber-200/70 text-amber-800 px-2 py-0.2 rounded-full">
                          Pengajar
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-700/80 mt-0.5">
                        Cek kesesuaian sesi, ajukan sanggahan & cetak slip PDF resmi
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-400 group-hover:text-amber-700 group-hover:translate-x-0.5 transition" />
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full"></div>
              <span className="bg-white px-3 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                atau masuk dengan akun terdaftar
              </span>
            </div>

            {/* Error Alert */}
            {loginError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-700 text-xs font-medium leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Standard Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email atau Username Terdaftar
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    placeholder="nama@email.com atau username"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition font-medium"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition"
              >
                Masuk ke Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: DAFTAR AKUN BARU (EXACT MATCH WITH image.png) */}
        {activeTab === 'register' && (
          <div>
            {/* Green Notification Box (Matches screenshot) */}
            <div className="p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-2xl text-xs text-emerald-950 mb-5 leading-relaxed">
              <p className="font-bold text-emerald-900 mb-0.5">Pendaftaran Akun Baru:</p>
              <p className="text-[11px] text-emerald-800">
                Setiap akun yang didaftarkan akan dikirim ke <strong>Admin Wilayah</strong>{' '}
                untuk diverifikasi dan disetujui sebelum dapat digunakan.
              </p>
            </div>

            {/* Feedback Alert */}
            {regFeedback && (
              <div
                className={`mb-4 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs font-medium leading-relaxed ${
                  regFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {regFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p>{regFeedback.message}</p>
                  {regFeedback.type === 'success' && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('login')}
                      className="mt-2 text-[11px] font-bold text-emerald-700 underline flex items-center gap-1"
                    >
                      Beralih ke tab Masuk Akun <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Registration Form matching image.png */}
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {/* Field 1: NAMA LENGKAP & GELAR * */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  NAMA LENGKAP & GELAR *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Contoh: Rian Pratama, S.Pd"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition font-medium"
                    required
                  />
                </div>
              </div>

              {/* Field 2: EMAIL YANG DIDAFTARKAN * */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  EMAIL YANG DIDAFTARKAN *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition font-medium"
                    required
                  />
                </div>
              </div>

              {/* Field 3 & 4: PERAN * & NOPEG/LOKASI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    PERAN *
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 font-semibold text-slate-800"
                  >
                    <option value="guru">Guru / Pengajar</option>
                    <option value="staf_lokasi">Staf Lokasi</option>
                    <option value="admin_keuangan">Admin Wilayah</option>
                  </select>
                </div>

                <div>
                  {regRole === 'guru' && (
                    <>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        NOPEG (709027)*
                      </label>
                      <input
                        type="text"
                        value={regNopeg}
                        onChange={(e) => setRegNopeg(e.target.value)}
                        placeholder="709027"
                        className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 font-mono font-semibold"
                        required
                      />
                    </>
                  )}

                  {regRole === 'staf_lokasi' && (
                    <>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        LOKASI PENUGASAN *
                      </label>
                      <select
                        value={regLocation}
                        onChange={(e) => setRegLocation(e.target.value)}
                        className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 font-semibold text-slate-800"
                      >
                        {branchLocations.map((loc) => (
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                      </select>
                    </>
                  )}

                  {regRole === 'admin_keuangan' && (
                    <>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        WILAYAH PENUGASAN *
                      </label>
                      <input
                        type="text"
                        disabled
                        value="Wilayah Bekasi Plus / Pusat"
                        className="w-full px-3 py-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-semibold cursor-not-allowed"
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Field 5 & 6: PASSWORD AWAL * & ULANGI PASSWORD * */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    PASSWORD AWAL *
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 6 karakter"
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    ULANGI PASSWORD *
                  </label>
                  <input
                    type="password"
                    value={regPasswordConfirm}
                    onChange={(e) => setRegPasswordConfirm(e.target.value)}
                    placeholder="Ketik ulang"
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 font-mono"
                    required
                  />
                </div>
              </div>

              {/* Submit Button (Matches image.png green send button) */}
              <button
                type="submit"
                className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
              >
                <Send className="w-4 h-4" />
                Kirim Pendaftaran ke Admin Wilayah
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Footer info */}
      <p className="text-[11px] text-slate-400 mt-6 text-center max-w-sm">
        Sistem Informasi Verifikasi Sesi Mengajar • Wilayah Bekasi Plus
      </p>
    </div>
  );
};
