export type UserRole = 'admin_keuangan' | 'staf_lokasi' | 'guru';

export type UserApprovalStatus = 'approved' | 'pending' | 'rejected';

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  nopeg?: string; // Khusus guru
  assignedLocation?: string; // Khusus staf lokasi (atau 'ALL' untuk wilayah/pusat)
  email?: string;
  phone?: string;
  active: boolean;
  approvalStatus?: UserApprovalStatus;
  rejectionReason?: string;
  createdAt: string;
}

export interface TeachingSession {
  id: string; // generated unique id: `${nopeg}_${lok}_${periode}`
  periode: string;
  nopeg: string;
  namaPengajar: string;
  kode: string;
  lok: string;
  lokasi: string;
  durMengajarNegeri: number;
  sesiMengajarNegeri: number;
  menitSangsiMengajarNegeri: number;
  insentifHadirMengajarNegeri: number;
  jagaTesNegeri: number;
  durMengajarSwasta: number;
  sesiMengajarSwasta: number;
  menitSangsiMengajarSwasta: number;
  insentifHadirMengajarSwasta: number;
  jagaTesSwasta: number;
  sesiMengajarAhad: number;
  sesiTidakHadir: number;
  durKonsultasiNegeri: number;
  sesiKonsultasiNegeri: number;
  instKonsultasiNegeri: number;
  durKonsultasiSwasta: number;
  sesiKonsultasiSwasta: number;
  instKonsultasiSwasta: number;
  belumPresensi: number;
  // Computed fields:
  totalSesiMengajar: number;
  totalSesiKonsultasi: number;
  totalDurasiMengajar: number;
}

export type VerificationStatus =
  | 'BELUM_VERIFIKASI'
  | 'SESUAI_GURU'
  | 'SESUAI_LOKASI'
  | 'SANGGAHAN'
  | 'DISETUJUI_KEUANGAN'
  | 'REVISI_DITERIMA';

export interface ClaimDiff {
  claimedField: string;
  currentValue: string | number;
  claimedValue: string | number;
  reason: string;
  dateCreated: string;
}

export interface SessionVerification {
  id: string;
  sessionId: string;
  nopeg: string;
  lok: string;
  periode: string;
  status: VerificationStatus;
  teacherVerifiedAt?: string;
  teacherNote?: string;
  staffVerifiedAt?: string;
  staffVerifiedBy?: string;
  staffNote?: string;
  financeVerifiedAt?: string;
  financeVerifiedBy?: string;
  financeNote?: string;
  claim?: ClaimDiff;
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'dispute';
  targetRole?: UserRole | 'ALL';
  targetNopeg?: string;
  targetLocation?: string;
  createdAt: string;
  readBy: string[]; // List of user IDs that marked read
  linkTab?: string;
}

export interface DataSourceConfig {
  type: 'sample' | 'google_sheet' | 'file_upload';
  sheetUrl: string;
  autoSyncIntervalSeconds: number; // 0 = disabled, 30, 60, 300
  lastSyncedAt?: string;
  lastSyncStatus: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncError?: string;
  totalRecords: number;
}
