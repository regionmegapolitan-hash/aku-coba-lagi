import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TeachingSession, SessionVerification } from '../types';
import { formatIndonesianDecimal } from './numberFormat';

/**
 * Format status string into clean Indonesian label
 */
export function getStatusLabel(status?: string): string {
  switch (status) {
    case 'SESUAI_GURU':
      return 'Diverifikasi Sesuai (Guru)';
    case 'SESUAI_LOKASI':
      return 'Disetujui Lokasi & Guru';
    case 'DISETUJUI_KEUANGAN':
      return 'Disetujui Final Keuangan';
    case 'SANGGAHAN':
      return 'Ada Sanggahan / Selisih';
    case 'REVISI_DITERIMA':
      return 'Revisi Disetujui';
    case 'BELUM_VERIFIKASI':
    default:
      return 'Menunggu Verifikasi';
  }
}

/**
 * Export Teacher Session Verification Slip PDF
 */
export function exportTeacherSlipPdf(
  teacherName: string,
  nopeg: string,
  periode: string,
  sessions: TeachingSession[],
  verifications: Record<string, SessionVerification>
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Header banner
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('BUKTI VERIFIKASI SESI MENGAJAR & REKAP HONORARIUM', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('Sistem Informasi Verifikasi Sesi Mengajar & Konsultasi', 14, 18);
  doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB`, 14, 23);

  // Teacher Info Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 34, 182, 28, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DATA PENGAJAR', 18, 41);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nama Pengajar  : ${teacherName}`, 18, 48);
  doc.text(`No. Pegawai    : ${nopeg}`, 18, 54);

  doc.text(`Periode Rekap  : ${periode}`, 110, 48);
  const totalBranches = sessions.length;
  doc.text(`Jumlah Lokasi  : ${totalBranches} Cabang Mengajar`, 110, 54);

  // Compute totals
  let totalSesiNegeri = 0;
  let totalSesiSwasta = 0;
  let totalSesiKonsulNegeri = 0;
  let totalSesiKonsulSwasta = 0;
  let totalJagaTes = 0;
  let totalBelumPresensi = 0;

  sessions.forEach((s) => {
    totalSesiNegeri += s.sesiMengajarNegeri;
    totalSesiSwasta += s.sesiMengajarSwasta;
    totalSesiKonsulNegeri += s.sesiKonsultasiNegeri;
    totalSesiKonsulSwasta += s.sesiKonsultasiSwasta;
    totalJagaTes += s.jagaTesNegeri + s.jagaTesSwasta;
    totalBelumPresensi += s.belumPresensi;
  });

  const totalSesiMengajar = totalSesiNegeri + totalSesiSwasta;
  const totalSesiKonsul = totalSesiKonsulNegeri + totalSesiKonsulSwasta;
  const grandTotalSesi = totalSesiMengajar + totalSesiKonsul;

  // Table rows
  const tableData = sessions.map((s, idx) => {
    const v = verifications[s.id];
    const statusLabel = getStatusLabel(v?.status);
    return [
      idx + 1,
      s.lokasi,
      formatIndonesianDecimal(s.sesiMengajarNegeri),
      formatIndonesianDecimal(s.sesiMengajarSwasta),
      formatIndonesianDecimal(s.sesiKonsultasiNegeri),
      formatIndonesianDecimal(s.sesiKonsultasiSwasta),
      formatIndonesianDecimal(s.jagaTesNegeri + s.jagaTesSwasta),
      formatIndonesianDecimal(s.totalSesiMengajar + s.totalSesiKonsultasi),
      s.belumPresensi > 0 ? `${s.belumPresensi}x` : '-',
      statusLabel,
    ];
  });

  autoTable(doc, {
    startY: 68,
    head: [
      [
        'No',
        'Cabang / Lokasi',
        'Sesi Neg',
        'Sesi Swa',
        'Kons Neg',
        'Kons Swa',
        'Jaga Tes',
        'Total',
        'Blm Pres',
        'Status Verifikasi',
      ],
    ],
    body: tableData,
    foot: [
      [
        'Total',
        `${totalBranches} Cabang`,
        formatIndonesianDecimal(totalSesiNegeri),
        formatIndonesianDecimal(totalSesiSwasta),
        formatIndonesianDecimal(totalSesiKonsulNegeri),
        formatIndonesianDecimal(totalSesiKonsulSwasta),
        formatIndonesianDecimal(totalJagaTes),
        formatIndonesianDecimal(grandTotalSesi),
        totalBelumPresensi > 0 ? `${totalBelumPresensi}x` : '-',
        'Selesai',
      ],
    ],
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      font: 'helvetica',
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 38 },
      2: { halign: 'right', cellWidth: 16 },
      3: { halign: 'right', cellWidth: 16 },
      4: { halign: 'right', cellWidth: 16 },
      5: { halign: 'right', cellWidth: 16 },
      6: { halign: 'right', cellWidth: 15 },
      7: { halign: 'right', cellWidth: 15, fontStyle: 'bold' },
      8: { halign: 'center', cellWidth: 14 },
      9: { cellWidth: 28 },
    },
  });

  // Notes & Signatures
  const finalY = (doc as any).lastAutoTable?.finalY || 180;
  let currentY = finalY + 10;

  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  // Summary box
  doc.setFillColor(238, 242, 255);
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(14, currentY, 182, 22, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(30, 58, 138);
  doc.setFont('helvetica', 'bold');
  doc.text('RINGKASAN TOTAL SESI MENGAJAR & KONSULTASI:', 18, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Total Mengajar: ${formatIndonesianDecimal(totalSesiMengajar)} Sesi  |  Total Konsultasi: ${formatIndonesianDecimal(totalSesiKonsul)} Sesi  |  Grand Total: ${formatIndonesianDecimal(grandTotalSesi)} Sesi`, 18, currentY + 14);

  // Signatures section
  const sigY = currentY + 32;
  if (sigY + 35 > 280) {
    doc.addPage();
    // adjust
  }

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');

  doc.text('Diverifikasi oleh Pengajar,', 25, sigY);
  doc.text('Divalidasi Staf Lokasi,', 88, sigY);
  doc.text('Disetujui Admin Keuangan,', 148, sigY);

  doc.setFont('helvetica', 'bold');
  doc.text(`( ${teacherName} )`, 25, sigY + 24);
  doc.text(`( Staf Operasional Cabang )`, 88, sigY + 24);
  doc.text(`( Bagian Keuangan Pusat )`, 148, sigY + 24);

  doc.save(`Slip_Verifikasi_${nopeg}_${teacherName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}

/**
 * Export Branch Teaching Session Summary PDF for Staff or Finance
 */
export function exportBranchReportPdf(
  branchName: string,
  periode: string,
  sessions: TeachingSession[],
  verifications: Record<string, SessionVerification>
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Header banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 297, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`REKAPITULASI SESI MENGAJAR CABANG: ${branchName.toUpperCase()}`, 14, 11);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`Periode: ${periode} | Dicetak: ${new Date().toLocaleDateString('id-ID')} WIB`, 14, 18);

  // Table rows
  const tableData = sessions.map((s, idx) => {
    const v = verifications[s.id];
    return [
      idx + 1,
      s.nopeg,
      s.namaPengajar,
      s.kode,
      formatIndonesianDecimal(s.sesiMengajarNegeri),
      formatIndonesianDecimal(s.sesiMengajarSwasta),
      formatIndonesianDecimal(s.totalSesiMengajar),
      formatIndonesianDecimal(s.sesiKonsultasiNegeri),
      formatIndonesianDecimal(s.sesiKonsultasiSwasta),
      formatIndonesianDecimal(s.totalSesiKonsultasi),
      formatIndonesianDecimal(s.jagaTesNegeri + s.jagaTesSwasta),
      formatIndonesianDecimal(s.totalSesiMengajar + s.totalSesiKonsultasi),
      s.belumPresensi > 0 ? `${s.belumPresensi}` : '-',
      getStatusLabel(v?.status),
    ];
  });

  autoTable(doc, {
    startY: 32,
    head: [
      [
        'No',
        'Nopeg',
        'Nama Pengajar',
        'Kode',
        'Sesi Neg',
        'Sesi Swa',
        'Tot Ajar',
        'Kons Neg',
        'Kons Swa',
        'Tot Kons',
        'Jaga Tes',
        'Grand Tot',
        'Blm Pres',
        'Status Verifikasi',
      ],
    ],
    body: tableData,
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 16 },
      2: { cellWidth: 46 },
      3: { halign: 'center', cellWidth: 12 },
      4: { halign: 'right', cellWidth: 16 },
      5: { halign: 'right', cellWidth: 16 },
      6: { halign: 'right', cellWidth: 16, fontStyle: 'bold' },
      7: { halign: 'right', cellWidth: 16 },
      8: { halign: 'right', cellWidth: 16 },
      9: { halign: 'right', cellWidth: 16, fontStyle: 'bold' },
      10: { halign: 'right', cellWidth: 15 },
      11: { halign: 'right', cellWidth: 18, fontStyle: 'bold' },
      12: { halign: 'center', cellWidth: 14 },
      13: { cellWidth: 38 },
    },
  });

  doc.save(`Rekap_Cabang_${branchName.replace(/[^a-zA-Z0-9]/g, '_')}_${periode.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}
