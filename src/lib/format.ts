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

const MONEY_FRACTION_DIGITS = 2;

export function formatRupiahNumber(n: number): string {
  return n.toLocaleString("id-ID", {
    minimumFractionDigits: MONEY_FRACTION_DIGITS,
    maximumFractionDigits: MONEY_FRACTION_DIGITS,
  });
}

export function rp(n: number): string {
  return "Rp " + formatRupiahNumber(n);
}

export function signedRp(n: number): string {
  return (n < 0 ? "− " : "+ ") + formatRupiahNumber(Math.abs(n));
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

/** Formats nominal input in Indonesian money style, e.g. "12000,5" -> "12.000,5". */
export function formatNominalInput(
  raw: string,
  options: { fixedDecimals?: boolean } = {}
): string {
  const compact = raw.replace(/[^\d,.]/g, "");
  const dotDecimalMatch = compact.includes(",") ? null : compact.match(/^(\d+)\.(\d{1,2})$/);
  const cleaned = (dotDecimalMatch ? `${dotDecimalMatch[1]},${dotDecimalMatch[2]}` : compact).replace(/[^\d,]/g, "");
  const hasDecimal = cleaned.includes(",");
  const [integerPart = "", ...fractionParts] = cleaned.split(",");
  const integerDigits = integerPart.replace(/\D/g, "");
  const fractionDigits = fractionParts.join("").replace(/\D/g, "").slice(0, MONEY_FRACTION_DIGITS);

  if (!integerDigits && !fractionDigits && !hasDecimal) return "";

  const integerDisplay = integerDigits ? Number(integerDigits).toLocaleString("id-ID") : "0";
  if (hasDecimal || options.fixedDecimals) {
    const decimalDisplay = options.fixedDecimals
      ? fractionDigits.padEnd(MONEY_FRACTION_DIGITS, "0")
      : fractionDigits;
    return `${integerDisplay},${decimalDisplay}`;
  }

  return integerDisplay;
}

export function parseNominalInput(raw: string): number {
  const formatted = formatNominalInput(raw, { fixedDecimals: true });
  return Number(formatted.replace(/\./g, "").replace(",", ".")) || 0;
}

/** Date -> "Sabtu, 22 Agustus 2026" */
export function hariTanggal(date: Date): string {
  return `${DAYS_LONG[date.getDay()]}, ${date.getDate()} ${MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`;
}

/** Date -> "14:35" */
export function jam(date: Date): string {
  return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}
