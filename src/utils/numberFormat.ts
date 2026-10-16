/**
 * Formats numbers according to Indonesian spreadsheet format (comma decimal, 2 decimals)
 * e.g. 19.75 -> "19,75", 0 -> "0,00", -15.6 -> "-15,60"
 * Ensures numbers are NEVER grouped with thousands separators ("jangan dijadikan angka ribuan").
 */
export function formatIndonesianDecimal(val: number | string | undefined | null): string {
  if (val === undefined || val === null || val === '') return '0,00';
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'));
  if (isNaN(num) || Math.abs(num) < 0.00001) return '0,00';
  return num.toLocaleString('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  });
}

/**
 * Formats integer count
 */
export function formatCount(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(val)) return '0';
  return Math.round(Number(val)).toString();
}
