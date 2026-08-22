const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];
const MONTHS_LONG = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const DAYS_LONG = [
  "Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu",
];

export function rp(n: number): string {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

export function signedRp(n: number): string {
  return (n < 0 ? "− " : "+ ") + rp(Math.abs(n)).slice(3);
}

/** "YYYY-MM-DD" -> "31 Des 2025" */
export function tgl(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS_SHORT[m - 1]} ${y}`;
}

/** "YYYY-MM-DD" -> "31 Desember 2025" */
export function tglPanjang(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS_LONG[m - 1]} ${y}`;
}

/** "YYYY-MM" -> "Des" */
export function monthShort(ym: string): string {
  return MONTHS_SHORT[Number(ym.slice(5, 7)) - 1];
}

/** "YYYY-MM" -> "Desember 2025" */
export function monthLong(ym: string): string {
  return `${MONTHS_LONG[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;
}

export function fmtCount(n: number): string {
  return n.toLocaleString("id-ID");
}

/** Date -> "Sabtu, 22 Agustus 2026" */
export function hariTanggal(date: Date): string {
  return `${DAYS_LONG[date.getDay()]}, ${date.getDate()} ${MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`;
}

/** Date -> "14:35" */
export function jam(date: Date): string {
  return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}
