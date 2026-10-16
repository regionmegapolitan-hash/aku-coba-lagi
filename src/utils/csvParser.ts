import * as XLSX from 'xlsx';
import { TeachingSession } from '../types';

/**
 * Parse Indonesian number format, e.g. "19,75" -> 19.75, "-15,60" -> -15.6, "0,00" -> 0
 */
export function parseIndonesianNumber(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  
  const str = String(val).trim().replace(/"/g, '').replace(/'/g, '');
  if (!str) return 0;

  // Handle standard decimal or comma decimal
  const normalized = str.replace(',', '.');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Transform standard Google Sheets URL into real-time CSV Export URL
 */
export function transformGoogleSheetUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();

  // If already a direct csv url
  if (trimmed.includes('output=csv') || trimmed.includes('format=csv')) {
    return trimmed;
  }

  // Published web link: /pubhtml -> /pub?output=csv
  if (trimmed.includes('/pubhtml')) {
    return trimmed.replace('/pubhtml', '/pub?output=csv');
  }

  // Standard edit URL: https://docs.google.com/spreadsheets/d/SHEET_ID/edit#gid=0 or /edit?usp=sharing
  const match = trimmed.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    const sheetId = match[1];
    let gid = '0';
    const gidMatch = trimmed.match(/gid=([0-9]+)/);
    if (gidMatch && gidMatch[1]) {
      gid = gidMatch[1];
    }
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  }

  return trimmed;
}

/**
 * Parse raw CSV string into TeachingSession array
 */
export function parseTeachingSessionsCsv(csvText: string): TeachingSession[] {
  if (!csvText || !csvText.trim()) return [];

  // Parse CSV using SheetJS with raw: true so quoted decimals like "19,75" or "-15,60" are not treated as thousands
  const workbook = XLSX.read(csvText, { type: 'string', raw: true });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { raw: true, defval: '' });

  return mapRawRowsToTeachingSessions(jsonData);
}

/**
 * Parse an Excel file (ArrayBuffer) into TeachingSession array
 */
export function parseTeachingSessionsExcel(buffer: ArrayBuffer): TeachingSession[] {
  const workbook = XLSX.read(buffer, { type: 'array', raw: true });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { raw: true, defval: '' });

  return mapRawRowsToTeachingSessions(jsonData);
}

/**
 * Flexible header finder to support subtle variations in column headers
 */
function findRowValue(row: Record<string, any>, possibleKeys: string[]): any {
  const rowKeys = Object.keys(row);
  for (const pKey of possibleKeys) {
    const pKeyNorm = pKey.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const rKey of rowKeys) {
      const rKeyNorm = rKey.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (rKeyNorm === pKeyNorm) {
        return row[rKey];
      }
    }
  }
  return '';
}

/**
 * Convert raw parsed rows into structured TeachingSession array
 */
export function mapRawRowsToTeachingSessions(rows: Record<string, any>[]): TeachingSession[] {
  const sessions: TeachingSession[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    const periode = String(findRowValue(row, ['Periode']) || '2026-08-25 sd 2026-09-24').trim();
    const nopeg = String(findRowValue(row, ['Nopeg', 'No Peg', 'No_Peg', 'NIP']) || '').trim();
    const namaPengajar = String(findRowValue(row, ['Nama Pengajar', 'Nama', 'Pengajar']) || '').trim();
    const kode = String(findRowValue(row, ['Kode', 'Kode Pengajar']) || '').trim();
    const lok = String(findRowValue(row, ['Lok', 'Kode Lok', 'Kode Lokasi']) || '').trim();
    const lokasi = String(findRowValue(row, ['Lokasi', 'Nama Lokasi', 'Cabang']) || '').trim();

    // Skip blank or invalid rows
    if (!namaPengajar && !nopeg) continue;

    const durNegeri = parseIndonesianNumber(findRowValue(row, ['Dur Mengajar Negeri', 'Durasi Mengajar Negeri']));
    const sesiNegeri = parseIndonesianNumber(findRowValue(row, ['Sesi Mengajar Negeri']));
    const menitSangsiNegeri = parseIndonesianNumber(findRowValue(row, ['Menit Sangsi Mengajar Negeri']));
    const insentifNegeri = parseIndonesianNumber(findRowValue(row, ['Insentif Hadir Mengajar Negeri']));
    const jagaTesNegeri = parseIndonesianNumber(findRowValue(row, ['Jaga Tes Negeri', 'Jaga TesNegeri']));

    const durSwasta = parseIndonesianNumber(findRowValue(row, ['Dur Mengajar Swasta', 'Durasi Mengajar Swasta']));
    const sesiSwasta = parseIndonesianNumber(findRowValue(row, ['Sesi Mengajar Swasta']));
    const menitSangsiSwasta = parseIndonesianNumber(findRowValue(row, ['Menit Sangsi Mengajar Swasta']));
    const insentifSwasta = parseIndonesianNumber(findRowValue(row, ['Insentif Hadir Mengajar Swasta']));
    const jagaTesSwasta = parseIndonesianNumber(findRowValue(row, ['Jaga Tes Swasta', 'Jaga TesSwasta']));

    const sesiAhad = parseIndonesianNumber(findRowValue(row, ['Sesi Mengajar Ahad']));
    const sesiTidakHadir = parseIndonesianNumber(findRowValue(row, ['Sesi Tidak Hadir']));

    const durKonsulNegeri = parseIndonesianNumber(findRowValue(row, ['Dur Konsultasi Negeri']));
    const sesiKonsulNegeri = parseIndonesianNumber(findRowValue(row, ['Sesi Konsultasi Negeri']));
    const instKonsulNegeri = parseIndonesianNumber(findRowValue(row, ['Inst Konsultasi Negeri']));

    const durKonsulSwasta = parseIndonesianNumber(findRowValue(row, ['Dur Konsultasi Swasta']));
    const sesiKonsulSwasta = parseIndonesianNumber(findRowValue(row, ['Sesi Konsultasi Swasta']));
    const instKonsulSwasta = parseIndonesianNumber(findRowValue(row, ['Inst Konsultasi Swasta']));

    const belumPresensi = Math.round(parseIndonesianNumber(findRowValue(row, ['Belum Presensi'])));

    const totalSesiMengajar = parseFloat((sesiNegeri + sesiSwasta).toFixed(2));
    const totalSesiKonsultasi = parseFloat((sesiKonsulNegeri + sesiKonsulSwasta).toFixed(2));
    const totalDurasiMengajar = parseFloat((durNegeri + durSwasta).toFixed(2));

    const id = `${nopeg || 'GURU'}_${lok || i}_${periode.replace(/[^a-zA-Z0-9]/g, '_')}`;

    sessions.push({
      id,
      periode,
      nopeg,
      namaPengajar,
      kode,
      lok,
      lokasi,
      durMengajarNegeri: durNegeri,
      sesiMengajarNegeri: sesiNegeri,
      menitSangsiMengajarNegeri: menitSangsiNegeri,
      insentifHadirMengajarNegeri: insentifNegeri,
      jagaTesNegeri,
      durMengajarSwasta: durSwasta,
      sesiMengajarSwasta: sesiSwasta,
      menitSangsiMengajarSwasta: menitSangsiSwasta,
      insentifHadirMengajarSwasta: insentifSwasta,
      jagaTesSwasta,
      sesiMengajarAhad: sesiAhad,
      sesiTidakHadir,
      durKonsultasiNegeri: durKonsulNegeri,
      sesiKonsultasiNegeri: sesiKonsulNegeri,
      instKonsultasiNegeri: instKonsulNegeri,
      durKonsultasiSwasta: durKonsulSwasta,
      sesiKonsultasiSwasta: sesiKonsulSwasta,
      instKonsultasiSwasta: instKonsulSwasta,
      belumPresensi,
      totalSesiMengajar,
      totalSesiKonsultasi,
      totalDurasiMengajar,
    });
  }

  return sessions;
}
