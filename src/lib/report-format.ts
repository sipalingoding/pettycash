const MONTHS_LONG = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/** The printed report's own number style (comma thousands, dot decimals) — distinct from
 * the app's Indonesian "Rp 12.000" style, to match the source template exactly. */
export function reportNumber(n: number, decimals: 0 | 2 = 2): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** "YYYY-MM-DD" -> "12/05/2026" */
export function reportDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** ("2026-05-12", "2026-06-02") -> "12 Mei - 2 Juni 2026" */
export function periodeLabel(from: string, to: string): string {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  const start = fy === ty ? `${fd} ${MONTHS_LONG[fm - 1]}` : `${fd} ${MONTHS_LONG[fm - 1]} ${fy}`;
  const end = `${td} ${MONTHS_LONG[tm - 1]} ${ty}`;
  return `${start} - ${end}`;
}
