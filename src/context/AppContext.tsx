import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  User,
  UserRole,
  TeachingSession,
  SessionVerification,
  AppNotification,
  DataSourceConfig,
  VerificationStatus,
  ClaimDiff,
} from '../types';
import {
  RAW_INITIAL_CSV,
  INITIAL_USERS,
  INITIAL_NOTIFICATIONS,
  INITIAL_VERIFICATIONS,
} from '../data/initialData';
import {
  parseTeachingSessionsCsv,
  parseTeachingSessionsExcel,
  transformGoogleSheetUrl,
} from '../utils/csvParser';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  sessions: TeachingSession[];
  verifications: Record<string, SessionVerification>;
  notifications: AppNotification[];
  dataSourceConfig: DataSourceConfig;
  isSyncing: boolean;
  unreadNotificationCount: number;

  // Authentication
  login: (username: string, password: string) => { success: boolean; message?: string };
  logout: () => void;
  switchUser: (user: User) => void;

  // Data Source & Real-time sync
  syncData: () => Promise<{ success: boolean; message: string; count?: number }>;
  uploadFile: (file: File) => Promise<{ success: boolean; message: string; count?: number }>;
  updateDataSourceConfig: (config: Partial<DataSourceConfig>) => void;
  resetToDefaultData: () => void;

  // Verifications
  verifySession: (
    sessionId: string,
    status: VerificationStatus,
    note?: string,
    claim?: ClaimDiff
  ) => void;
  verifyAllTeacherSessions: (
    nopeg: string,
    status: VerificationStatus,
    note?: string
  ) => void;
  batchApproveFinance: (sessionIds: string[], note?: string) => void;
  saveFinanceResponse: (
    sessionId: string,
    financeNote: string,
    newStatus?: VerificationStatus
  ) => void;

  // User Management & Approval
  registerUser: (data: {
    name: string;
    email: string;
    role: UserRole;
    password: string;
    nopeg?: string;
    assignedLocation?: string;
  }) => { success: boolean; message: string };
  approveUserRegistration: (userId: string) => void;
  batchApproveUserRegistrations: (userIds: string[]) => void;
  rejectUserRegistration: (userId: string, reason?: string) => void;
  revokeUserApproval: (userId: string) => void;
  pendingApprovalCount: number;

  addUser: (user: Omit<User, 'id' | 'createdAt'>) => { success: boolean; message: string };
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;

  // Notifications
  sendNotification: (
    title: string,
    message: string,
    type?: AppNotification['type'],
    targetRole?: User['role'] | 'ALL',
    targetNopeg?: string,
    targetLocation?: string
  ) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CURRENT_USER: 'sisesi_curr_user_v2',
  USERS: 'sisesi_users_v2',
  SESSIONS: 'sisesi_sessions_v3',
  VERIFICATIONS: 'sisesi_verifications_v2',
  NOTIFICATIONS: 'sisesi_notifications_v1',
  DATA_SOURCE: 'sisesi_datasource_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize sessions from local storage or raw initial CSV with auto-correction for decimal values
  const [sessions, setSessions] = useState<TeachingSession[]>(() => {
    try {
      // Clear legacy storage keys that may contain parsed thousands numbers (1975 instead of 19.75)
      localStorage.removeItem('sisesi_sessions_v1');
      localStorage.removeItem('sisesi_sessions_v2');

      const stored = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (stored) {
        const parsed: TeachingSession[] = JSON.parse(stored);
        // Verify that numbers are proper decimals (not thousands e.g. 1975)
        const hasCorruptedThousands = parsed.some(
          (s) => s.durMengajarSwasta > 200 || s.durMengajarNegeri > 200 || s.menitSangsiMengajarSwasta < -200
        );
        if (!hasCorruptedThousands && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return parseTeachingSessionsCsv(RAW_INITIAL_CSV);
  });

  // Users with automatic migration for Murtiyo
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const stored =
        localStorage.getItem(STORAGE_KEYS.USERS) ||
        localStorage.getItem('sisesi_users_v1');
      if (stored) {
        const parsed: User[] = JSON.parse(stored);
        return parsed.map((u) => {
          if (u.id === 'usr_admin' || u.username === 'admin' || u.name.includes('Ratna')) {
            return {
              ...u,
              name: 'Murtiyo',
              email: 'wilayahbekasiplus@gmail.com',
            };
          }
          return u;
        });
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_USERS;
  });

  // Current logged in user (default to Murtiyo / Admin Keuangan)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored =
        localStorage.getItem(STORAGE_KEYS.CURRENT_USER) ||
        localStorage.getItem('sisesi_curr_user_v1');
      if (stored) {
        const parsed: User = JSON.parse(stored);
        if (parsed.id === 'usr_admin' || parsed.username === 'admin' || parsed.name.includes('Ratna')) {
          return {
            ...parsed,
            name: 'Murtiyo',
            email: 'wilayahbekasiplus@gmail.com',
          };
        }
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_USERS[0];
  });

  // Verifications with migration for financeVerifiedBy Murtiyo
  const [verifications, setVerifications] = useState<Record<string, SessionVerification>>(() => {
    try {
      const stored =
        localStorage.getItem(STORAGE_KEYS.VERIFICATIONS) ||
        localStorage.getItem('sisesi_verifications_v1');
      if (stored) {
        const parsed: Record<string, SessionVerification> = JSON.parse(stored);
        Object.values(parsed).forEach((v) => {
          if (v.financeVerifiedBy && v.financeVerifiedBy.includes('Ratna')) {
            v.financeVerifiedBy = 'Murtiyo';
          }
        });
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_VERIFICATIONS;
  });

  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_NOTIFICATIONS;
  });

  // Data Source config
  const [dataSourceConfig, setDataSourceConfig] = useState<DataSourceConfig>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DATA_SOURCE);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return {
      type: 'sample',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSampleLinkUntukSinkronisasiOtomatis/pub?output=csv',
      autoSyncIntervalSeconds: 0,
      lastSyncedAt: new Date().toISOString(),
      lastSyncStatus: 'idle',
      totalRecords: 135,
    };
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Sync state to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.error(e);
    }
  }, [sessions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (e) {
      console.error(e);
    }
  }, [users]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.VERIFICATIONS, JSON.stringify(verifications));
    } catch (e) {
      console.error(e);
    }
  }, [verifications]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch (e) {
      console.error(e);
    }
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DATA_SOURCE, JSON.stringify(dataSourceConfig));
    } catch (e) {
      console.error(e);
    }
  }, [dataSourceConfig]);

  // Login handler
  const login = useCallback(
    (usernameOrEmail: string, password: string): { success: boolean; message?: string } => {
      const trimmedUser = usernameOrEmail.trim().toLowerCase();
      const matched = users.find(
        (u) =>
          (u.username.toLowerCase() === trimmedUser ||
            (u.email && u.email.toLowerCase() === trimmedUser)) &&
          u.password === password
      );

      if (!matched) {
        return { success: false, message: 'Email/Username atau password salah.' };
      }

      if (matched.approvalStatus === 'pending') {
        return {
          success: false,
          message:
            'Akun Anda sedang dalam proses verifikasi dan persetujuan oleh Admin Wilayah. Harap tunggu persetujuan sebelum dapat masuk.',
        };
      }

      if (matched.approvalStatus === 'rejected') {
        return {
          success: false,
          message: `Pendaftaran akun ditolak oleh Admin Wilayah: ${
            matched.rejectionReason || 'Harap hubungi Admin Wilayah untuk informasi lebih lanjut.'
          }`,
        };
      }

      if (!matched.active) {
        return { success: false, message: 'Akun Anda dinonaktifkan oleh Admin Wilayah.' };
      }

      setCurrentUser(matched);
      return { success: true };
    },
    [users]
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const switchUser = useCallback((user: User) => {
    setCurrentUser(user);
  }, []);

  // Send Notification
  const sendNotification = useCallback(
    (
      title: string,
      message: string,
      type: AppNotification['type'] = 'info',
      targetRole: User['role'] | 'ALL' = 'ALL',
      targetNopeg?: string,
      targetLocation?: string
    ) => {
      const newNotif: AppNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        title,
        message,
        type,
        targetRole,
        targetNopeg,
        targetLocation,
        createdAt: new Date().toISOString(),
        readBy: currentUser ? [currentUser.id] : [],
      };
      setNotifications((prev) => [newNotif, ...prev]);
    },
    [currentUser]
  );

  // Sync data from Google Sheet URL or reload
  const syncData = useCallback(async (): Promise<{ success: boolean; message: string; count?: number }> => {
    if (!dataSourceConfig.sheetUrl) {
      return { success: false, message: 'Link spreadsheet belum dikonfigurasi.' };
    }

    setIsSyncing(true);
    setDataSourceConfig((prev) => ({ ...prev, lastSyncStatus: 'syncing' }));

    try {
      const finalUrl = transformGoogleSheetUrl(dataSourceConfig.sheetUrl);

      // Fetch the CSV directly
      const response = await fetch(finalUrl, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const csvText = await response.text();
      const parsedSessions = parseTeachingSessionsCsv(csvText);

      if (!parsedSessions || parsedSessions.length === 0) {
        throw new Error('Data spreadsheet kosong atau format kolom tidak sesuai.');
      }

      setSessions(parsedSessions);
      const nowStr = new Date().toISOString();
      setDataSourceConfig((prev) => ({
        ...prev,
        lastSyncedAt: nowStr,
        lastSyncStatus: 'success',
        lastSyncError: undefined,
        totalRecords: parsedSessions.length,
        type: 'google_sheet',
      }));

      sendNotification(
        'Sinkronisasi Berhasil',
        `Data berhasil disinkronkan real-time dari Spreadsheet (${parsedSessions.length} baris data).`,
        'success',
        'ALL'
      );

      setIsSyncing(false);
      return { success: true, message: `Sinkronisasi berhasil! ${parsedSessions.length} sesi mengajar dimuat.`, count: parsedSessions.length };
    } catch (err: any) {
      console.warn('Real-time fetch error:', err);
      const errMsg = err?.message || 'Gagal menyambung ke Spreadsheet.';
      setDataSourceConfig((prev) => ({
        ...prev,
        lastSyncStatus: 'error',
        lastSyncError: errMsg,
      }));
      setIsSyncing(false);
      return {
        success: false,
        message: `Gagal sinkronisasi: ${errMsg}. Pastikan link Google Sheet telah di "Publikasikan ke Web sebagai CSV" (File -> Bagikan -> Publikasikan ke Web -> CSV).`,
      };
    }
  }, [dataSourceConfig.sheetUrl, sendNotification]);

  // Automatic background interval timer when enabled
  useEffect(() => {
    const intervalSec = dataSourceConfig.autoSyncIntervalSeconds;
    if (!intervalSec || intervalSec <= 0 || dataSourceConfig.type !== 'google_sheet') {
      return;
    }

    const timer = setInterval(() => {
      syncData();
    }, intervalSec * 1000);

    return () => clearInterval(timer);
  }, [dataSourceConfig.autoSyncIntervalSeconds, dataSourceConfig.type, syncData]);

  // Upload Excel or CSV file directly
  const uploadFile = useCallback(
    async (file: File): Promise<{ success: boolean; message: string; count?: number }> => {
      setIsSyncing(true);
      try {
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        let parsed: TeachingSession[] = [];

        if (fileExt === 'csv' || fileExt === 'txt') {
          const text = await file.text();
          parsed = parseTeachingSessionsCsv(text);
        } else if (fileExt === 'xlsx' || fileExt === 'xls') {
          const buffer = await file.arrayBuffer();
          parsed = parseTeachingSessionsExcel(buffer);
        } else {
          setIsSyncing(false);
          return { success: false, message: 'Format file tidak didukung. Harap unggah .xlsx, .xls, atau .csv' };
        }

        if (parsed.length === 0) {
          setIsSyncing(false);
          return { success: false, message: 'File tidak memuat data yang valid.' };
        }

        setSessions(parsed);
        const nowStr = new Date().toISOString();
        setDataSourceConfig((prev) => ({
          ...prev,
          type: 'file_upload',
          lastSyncedAt: nowStr,
          lastSyncStatus: 'success',
          lastSyncError: undefined,
          totalRecords: parsed.length,
        }));

        sendNotification(
          'Data Berhasil Diperbarui',
          `File ${file.name} berhasil diunggah (${parsed.length} baris data).`,
          'success',
          'ALL'
        );

        setIsSyncing(false);
        return { success: true, message: `Berhasil mengimpor ${parsed.length} sesi mengajar dari ${file.name}`, count: parsed.length };
      } catch (err: any) {
        setIsSyncing(false);
        return { success: false, message: `Gagal memproses file: ${err.message}` };
      }
    },
    [sendNotification]
  );

  const updateDataSourceConfig = useCallback((config: Partial<DataSourceConfig>) => {
    setDataSourceConfig((prev) => ({ ...prev, ...config }));
  }, []);

  // Reset to default data
  const resetToDefaultData = useCallback(() => {
    const defaultSessions = parseTeachingSessionsCsv(RAW_INITIAL_CSV);
    setSessions(defaultSessions);
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    setVerifications(INITIAL_VERIFICATIONS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setDataSourceConfig({
      type: 'sample',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSampleLinkUntukSinkronisasiOtomatis/pub?output=csv',
      autoSyncIntervalSeconds: 0,
      lastSyncedAt: new Date().toISOString(),
      lastSyncStatus: 'idle',
      totalRecords: defaultSessions.length,
    });
    localStorage.clear();
  }, []);

  // Verify single session
  const verifySession = useCallback(
    (
      sessionId: string,
      status: VerificationStatus,
      note?: string,
      claim?: ClaimDiff
    ) => {
      const nowStr = new Date().toISOString();
      const session = sessions.find((s) => s.id === sessionId);

      setVerifications((prev) => {
        const existing = prev[sessionId] || {
          id: `ver_${Date.now()}`,
          sessionId,
          nopeg: session?.nopeg || '',
          lok: session?.lok || '',
          periode: session?.periode || '',
          status: 'BELUM_VERIFIKASI',
          updatedAt: nowStr,
        };

        const updated: SessionVerification = {
          ...existing,
          status,
          updatedAt: nowStr,
        };

        if (currentUser?.role === 'guru') {
          updated.teacherVerifiedAt = nowStr;
          if (note) updated.teacherNote = note;
          if (claim) updated.claim = claim;
        } else if (currentUser?.role === 'staf_lokasi') {
          updated.staffVerifiedAt = nowStr;
          updated.staffVerifiedBy = currentUser.name;
          if (note) updated.staffNote = note;
        } else if (currentUser?.role === 'admin_keuangan') {
          updated.financeVerifiedAt = nowStr;
          updated.financeVerifiedBy = currentUser.name;
          if (note) updated.financeNote = note;
        }

        return {
          ...prev,
          [sessionId]: updated,
        };
      });

      // Dispatch appropriate notification
      if (session) {
        if (status === 'SANGGAHAN') {
          sendNotification(
            `Pengajuan Sanggahan Sesi: ${session.namaPengajar}`,
            `${session.namaPengajar} (${session.nopeg}) mengajukan sanggahan sesi di lokasi ${session.lokasi}: "${note || claim?.reason || 'Ada selisih sesi'}".`,
            'dispute',
            'admin_keuangan'
          );
        } else if (status === 'SESUAI_GURU') {
          sendNotification(
            `Verifikasi Selesai oleh Guru`,
            `${session.namaPengajar} mengonfirmasi sesi mengajar di ${session.lokasi} telah sesuai.`,
            'info',
            'staf_lokasi',
            session.nopeg,
            session.lokasi
          );
        } else if (status === 'DISETUJUI_KEUANGAN') {
          sendNotification(
            `Sesi Telah Disetujui Keuangan`,
            `Admin Keuangan telah menyetujui sesi mengajar di lokasi ${session.lokasi}.`,
            'success',
            'guru',
            session.nopeg
          );
        }
      }
    },
    [currentUser, sessions, sendNotification]
  );

  // 1-Click verify all sessions for this teacher
  const verifyAllTeacherSessions = useCallback(
    (nopeg: string, status: VerificationStatus, note?: string) => {
      const teacherSessions = sessions.filter((s) => s.nopeg === nopeg);
      const nowStr = new Date().toISOString();

      setVerifications((prev) => {
        const next = { ...prev };
        teacherSessions.forEach((s) => {
          const existing = next[s.id] || {
            id: `ver_${Date.now()}_${s.lok}`,
            sessionId: s.id,
            nopeg: s.nopeg,
            lok: s.lok,
            periode: s.periode,
            status: 'BELUM_VERIFIKASI',
            updatedAt: nowStr,
          };

          next[s.id] = {
            ...existing,
            status,
            teacherVerifiedAt: nowStr,
            teacherNote: note || 'Dikonfirmasi sesuai oleh guru (semua lokasi).',
            updatedAt: nowStr,
          };
        });
        return next;
      });

      const teacherName = teacherSessions[0]?.namaPengajar || nopeg;
      sendNotification(
        `Verifikasi Lengkap: ${teacherName}`,
        `${teacherName} telah memverifikasi seluruh sesi mengajarnya (${teacherSessions.length} cabang).`,
        'success',
        'admin_keuangan'
      );
    },
    [sessions, sendNotification]
  );

  // Batch approve by Finance
  const batchApproveFinance = useCallback(
    (sessionIds: string[], note?: string) => {
      const nowStr = new Date().toISOString();

      setVerifications((prev) => {
        const next = { ...prev };
        sessionIds.forEach((sid) => {
          const s = sessions.find((item) => item.id === sid);
          if (!s) return;

          const existing = next[sid] || {
            id: `ver_${Date.now()}_${s.lok}`,
            sessionId: sid,
            nopeg: s.nopeg,
            lok: s.lok,
            periode: s.periode,
            status: 'BELUM_VERIFIKASI',
            updatedAt: nowStr,
          };

          next[sid] = {
            ...existing,
            status: 'DISETUJUI_KEUANGAN',
            financeVerifiedAt: nowStr,
            financeVerifiedBy: currentUser?.name || 'Admin Keuangan',
            financeNote: note || 'Disetujui Keuangan Pusat.',
            updatedAt: nowStr,
          };
        });
        return next;
      });

      sendNotification(
        `Persetujuan Massal Keuangan`,
        `${sessionIds.length} sesi mengajar telah disetujui final oleh Admin Keuangan.`,
        'success',
        'ALL'
      );
    },
    [currentUser, sessions, sendNotification]
  );

  // Save Finance Response to Teacher Dispute or Staff Note
  const saveFinanceResponse = useCallback(
    (sessionId: string, financeNote: string, newStatus?: VerificationStatus) => {
      const session = sessions.find((s) => s.id === sessionId);
      const nowStr = new Date().toISOString();

      setVerifications((prev) => {
        const existing = prev[sessionId] || {
          id: `ver_${Date.now()}_${session?.lok || 'lok'}`,
          sessionId,
          nopeg: session?.nopeg || '',
          lok: session?.lok || '',
          periode: session?.periode || '',
          status: 'BELUM_VERIFIKASI',
          updatedAt: nowStr,
        };

        const updated: SessionVerification = {
          ...existing,
          status: newStatus || existing.status,
          financeNote,
          financeVerifiedAt: nowStr,
          financeVerifiedBy: currentUser?.name || 'Murtiyo',
          updatedAt: nowStr,
        };

        return {
          ...prev,
          [sessionId]: updated,
        };
      });

      if (session) {
        sendNotification(
          `Respon Keuangan Wilayah: ${session.namaPengajar}`,
          `Admin Keuangan (Wilayah) memberikan respon untuk sesi di cabang ${session.lokasi}: "${financeNote}".`,
          'info',
          'ALL',
          session.nopeg,
          session.lokasi
        );
      }
    },
    [currentUser, sessions, sendNotification]
  );

  // Add User
  const addUser = useCallback(
    (userData: Omit<User, 'id' | 'createdAt'>): { success: boolean; message: string } => {
      const exists = users.some(
        (u) => u.username.toLowerCase() === userData.username.trim().toLowerCase()
      );
      if (exists) {
        return { success: false, message: `Username "${userData.username}" sudah digunakan!` };
      }

      const newUser: User = {
        ...userData,
        id: `usr_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };

      setUsers((prev) => [newUser, ...prev]);
      return { success: true, message: `User "${newUser.name}" berhasil didaftarkan.` };
    },
    [users]
  );

  // Update User
  const updateUser = useCallback((id: string, updates: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updated = { ...u, ...updates };
          if (currentUser?.id === id) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
  }, [currentUser]);

  // Delete User
  const deleteUser = useCallback((id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }, []);

  // Register New User (Pending Approval by Admin Wilayah)
  const registerUser = useCallback(
    (data: {
      name: string;
      email: string;
      role: UserRole;
      password: string;
      nopeg?: string;
      assignedLocation?: string;
    }): { success: boolean; message: string } => {
      const normalizedEmail = data.email.trim().toLowerCase();
      const exists = users.some(
        (u) =>
          u.username.toLowerCase() === normalizedEmail ||
          (u.email && u.email.toLowerCase() === normalizedEmail)
      );

      if (exists) {
        return {
          success: false,
          message: `Email "${data.email}" sudah terdaftar. Silakan gunakan email lain atau hubungi Admin Wilayah.`,
        };
      }

      const newUser: User = {
        id: `usr_${Date.now()}`,
        name: data.name.trim(),
        username: normalizedEmail,
        email: normalizedEmail,
        password: data.password,
        role: data.role,
        nopeg: data.role === 'guru' ? data.nopeg : undefined,
        assignedLocation: data.role === 'staf_lokasi' ? data.assignedLocation : undefined,
        active: false,
        approvalStatus: 'pending',
        createdAt: new Date().toISOString(),
      };

      setUsers((prev) => [newUser, ...prev]);

      const roleLabel =
        data.role === 'guru'
          ? `Guru (Nopeg: ${data.nopeg || '-'})`
          : data.role === 'staf_lokasi'
          ? `Staf Lokasi (${data.assignedLocation || 'Cabang'})`
          : 'Admin Wilayah';

      sendNotification(
        'Pendaftaran Akun Baru Menunggu Persetujuan',
        `${data.name} telah mendaftar sebagai ${roleLabel} dengan email ${data.email} dan menunggu persetujuan Anda.`,
        'info',
        'admin_keuangan'
      );

      return {
        success: true,
        message:
          'Pendaftaran berhasil dikirim ke Admin Wilayah! Akun Anda akan aktif setelah diverifikasi dan disetujui.',
      };
    },
    [users, sendNotification]
  );

  // Approve User Registration
  const approveUserRegistration = useCallback(
    (userId: string) => {
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === userId) {
            return {
              ...u,
              active: true,
              approvalStatus: 'approved',
              rejectionReason: undefined,
            };
          }
          return u;
        })
      );

      const target = users.find((u) => u.id === userId);
      if (target) {
        sendNotification(
          'Akun Anda Telah Disetujui',
          `Selamat! Akun ${target.name} telah disetujui oleh Admin Wilayah. Anda sekarang dapat masuk ke dashboard.`,
          'success',
          target.role,
          target.nopeg
        );
      }
    },
    [users, sendNotification]
  );

  // Batch Approve User Registrations (1-Click Approve All)
  const batchApproveUserRegistrations = useCallback(
    (userIds: string[]) => {
      setUsers((prev) =>
        prev.map((u) => {
          if (userIds.includes(u.id)) {
            return {
              ...u,
              active: true,
              approvalStatus: 'approved',
              rejectionReason: undefined,
            };
          }
          return u;
        })
      );

      sendNotification(
        'Persetujuan Massal Akun Berhasil',
        `${userIds.length} pendaftaran akun baru telah disetujui sekaligus oleh Admin Wilayah.`,
        'success',
        'admin_keuangan'
      );
    },
    [sendNotification]
  );

  // Reject User Registration
  const rejectUserRegistration = useCallback(
    (userId: string, reason?: string) => {
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === userId) {
            return {
              ...u,
              active: false,
              approvalStatus: 'rejected',
              rejectionReason: reason || 'Kriteria verifikasi tidak terpenuhi.',
            };
          }
          return u;
        })
      );
    },
    []
  );

  // Revoke User Approval (Deactivate)
  const revokeUserApproval = useCallback((userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            active: false,
            approvalStatus: 'pending',
          };
        }
        return u;
      })
    );
  }, []);

  const pendingApprovalCount = useMemo(() => {
    return users.filter((u) => u.approvalStatus === 'pending').length;
  }, [users]);

  // Notification read status
  const markNotificationRead = useCallback(
    (notifId: string) => {
      if (!currentUser) return;
      setNotifications((prev) =>
        prev.map((n) => {
          if (n.id === notifId && !n.readBy.includes(currentUser.id)) {
            return { ...n, readBy: [...n.readBy, currentUser.id] };
          }
          return n;
        })
      );
    },
    [currentUser]
  );

  const markAllNotificationsRead = useCallback(() => {
    if (!currentUser) return;
    setNotifications((prev) =>
      prev.map((n) => {
        if (!n.readBy.includes(currentUser.id)) {
          return { ...n, readBy: [...n.readBy, currentUser.id] };
        }
        return n;
      })
    );
  }, [currentUser]);

  const unreadNotificationCount = useMemo(() => {
    if (!currentUser) return 0;
    return notifications.filter((n) => {
      const matchRole =
        !n.targetRole || n.targetRole === 'ALL' || n.targetRole === currentUser.role;
      const matchNopeg = !n.targetNopeg || n.targetNopeg === currentUser.nopeg;
      const isUnread = !n.readBy.includes(currentUser.id);
      return matchRole && matchNopeg && isUnread;
    }).length;
  }, [currentUser, notifications]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        sessions,
        verifications,
        notifications,
        dataSourceConfig,
        isSyncing,
        unreadNotificationCount,
        login,
        logout,
        switchUser,
        syncData,
        uploadFile,
        updateDataSourceConfig,
        resetToDefaultData,
        verifySession,
        verifyAllTeacherSessions,
        batchApproveFinance,
        saveFinanceResponse,
        addUser,
        updateUser,
        deleteUser,
        registerUser,
        approveUserRegistration,
        batchApproveUserRegistrations,
        rejectUserRegistration,
        revokeUserApproval,
        pendingApprovalCount,
        sendNotification,
        markNotificationRead,
        markAllNotificationsRead,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
