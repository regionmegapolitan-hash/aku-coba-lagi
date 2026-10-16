import { TeachingSession, SessionVerification } from '../types';

/**
 * Export teaching sessions with their verification status into CSV format
 */
export function exportSessionsToCsv(
  sessions: TeachingSession[],
  verifications: Record<string, SessionVerification>,
  filename: string = 'Rekap_Sesi_Mengajar.csv'
) {
  const headers = [
    'Periode',
    'Nopeg',
    'Nama Pengajar',
    'Kode',
    'Lok',
    'Lokasi',
    'Dur Mengajar Negeri',
    'Sesi Mengajar Negeri',
    'Menit Sangsi Negeri',
    'Insentif Hadir Negeri',
    'Jaga Tes Negeri',
    'Dur Mengajar Swasta',
    'Sesi Mengajar Swasta',
    'Menit Sangsi Swasta',
    'Insentif Hadir Swasta',
    'Jaga Tes Swasta',
    'Sesi Mengajar Ahad',
    'Sesi Tidak Hadir',
    'Dur Konsultasi Negeri',
    'Sesi Konsultasi Negeri',
    'Inst Konsultasi Negeri',
    'Dur Konsultasi Swasta',
    'Sesi Konsultasi Swasta',
    'Inst Konsultasi Swasta',
    'Total Sesi Mengajar',
    'Total Sesi Konsultasi',
    'Belum Presensi',
    'Status Verifikasi',
    'Catatan Guru / Sanggahan',
    'Catatan Staf Lokasi',
    'Catatan Keuangan',
  ];

  const rows = sessions.map((s) => {
    const v = verifications[s.id];
    const statusText = v ? v.status : 'BELUM_VERIFIKASI';
    const teacherNote = (v?.teacherNote || v?.claim?.reason || '').replace(/"/g, '""');
    const staffNote = (v?.staffNote || '').replace(/"/g, '""');
    const financeNote = (v?.financeNote || '').replace(/"/g, '""');

    return [
      `"${s.periode}"`,
      `"${s.nopeg}"`,
      `"${s.namaPengajar.replace(/"/g, '""')}"`,
      `"${s.kode}"`,
      `"${s.lok}"`,
      `"${s.lokasi.replace(/"/g, '""')}"`,
      s.durMengajarNegeri.toFixed(2).replace('.', ','),
      s.sesiMengajarNegeri.toFixed(2).replace('.', ','),
      s.menitSangsiMengajarNegeri.toFixed(2).replace('.', ','),
      s.insentifHadirMengajarNegeri.toFixed(2).replace('.', ','),
      s.jagaTesNegeri.toFixed(2).replace('.', ','),
      s.durMengajarSwasta.toFixed(2).replace('.', ','),
      s.sesiMengajarSwasta.toFixed(2).replace('.', ','),
      s.menitSangsiMengajarSwasta.toFixed(2).replace('.', ','),
      s.insentifHadirMengajarSwasta.toFixed(2).replace('.', ','),
      s.jagaTesSwasta.toFixed(2).replace('.', ','),
      s.sesiMengajarAhad.toFixed(2).replace('.', ','),
      s.sesiTidakHadir.toFixed(2).replace('.', ','),
      s.durKonsultasiNegeri.toFixed(2).replace('.', ','),
      s.sesiKonsultasiNegeri.toFixed(2).replace('.', ','),
      s.instKonsultasiNegeri.toFixed(2).replace('.', ','),
      s.durKonsultasiSwasta.toFixed(2).replace('.', ','),
      s.sesiKonsultasiSwasta.toFixed(2).replace('.', ','),
      s.instKonsultasiSwasta.toFixed(2).replace('.', ','),
      s.totalSesiMengajar.toFixed(2).replace('.', ','),
      s.totalSesiKonsultasi.toFixed(2).replace('.', ','),
      s.belumPresensi,
      `"${statusText}"`,
      `"${teacherNote}"`,
      `"${staffNote}"`,
      `"${financeNote}"`,
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
