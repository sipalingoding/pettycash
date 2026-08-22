import ExcelJS from "exceljs";
import { UNCATEGORIZED } from "@/lib/categories";
import { UNASSIGNED_DIVISION } from "@/lib/divisions";

export type ParsedRow = {
  date: string; // "YYYY-MM-DD"
  description: string;
  category: string;
  division: string;
  amountIn: number;
  amountOut: number;
};

export type ParseResult = {
  rows: ParsedRow[];
  skipped: number;
  errors: string[];
};

const HEADER_ALIASES: Record<string, keyof RowFields> = {
  tanggal: "date",
  date: "date",
  keterangan: "description",
  deskripsi: "description",
  description: "description",
  pemasukan: "amountIn",
  debit: "amountIn",
  kategori: "category",
  category: "category",
  divisi: "division",
  division: "division",
  pengeluaran: "amountOut",
  kredit: "amountOut",
  saldo: "balance",
  balance: "balance",
};

type RowFields = {
  date: number;
  description: number;
  category: number;
  division: number;
  amountIn: number;
  amountOut: number;
  balance: number;
};

function normalizeHeader(v: unknown): string {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/\.$/, "");
}

function cellToText(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "object" && "text" in (v as Record<string, unknown>)) {
    return String((v as { text: unknown }).text ?? "").trim();
  }
  if (typeof v === "object" && "result" in (v as Record<string, unknown>)) {
    return String((v as { result: unknown }).result ?? "").trim();
  }
  return String(v).trim();
}

function cellToNumber(v: unknown): number {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return v;
  if (typeof v === "object" && "result" in (v as Record<string, unknown>)) {
    return cellToNumber((v as { result: unknown }).result);
  }
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

const EXCEL_EPOCH = Date.UTC(1899, 11, 30);

function cellToDate(v: unknown): string | null {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "number") {
    return new Date(EXCEL_EPOCH + v * 86400000).toISOString().slice(0, 10);
  }
  if (typeof v === "object" && v !== null && "result" in (v as Record<string, unknown>)) {
    return cellToDate((v as { result: unknown }).result);
  }
  if (typeof v === "string" && v.trim()) {
    const parsed = new Date(v.trim());
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  }
  return null;
}

/** Parses a petty-cash ledger workbook (No./Tanggal/Keterangan/Pemasukan/Pengeluaran/Saldo/Kategori/Divisi columns, in any order). */
export async function parseTransactionWorkbook(
  buffer: Buffer,
  isEmptyLedger: boolean
): Promise<ParseResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return { rows: [], skipped: 0, errors: ["File tidak berisi sheet apa pun."] };

  // Find the header row by scanning the first 15 rows for known column names.
  let headerRowNumber = -1;
  let fields: Partial<RowFields> = {};
  for (let r = 1; r <= Math.min(15, sheet.rowCount); r++) {
    const row = sheet.getRow(r);
    const found: Partial<RowFields> = {};
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const key = HEADER_ALIASES[normalizeHeader(cell.value)];
      if (key) found[key] = colNumber;
    });
    if (found.date && found.description) {
      headerRowNumber = r;
      fields = found;
      break;
    }
  }

  if (headerRowNumber === -1) {
    return {
      rows: [],
      skipped: 0,
      errors: [
        'Baris header tidak ditemukan. Pastikan file punya kolom "Tanggal" dan "Keterangan".',
      ],
    };
  }

  const rows: ParsedRow[] = [];
  const errors: string[] = [];
  let skipped = 0;
  let isFirstDataRow = true;

  for (let r = headerRowNumber + 1; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    if (row.cellCount === 0) continue;

    const dateVal = fields.date ? row.getCell(fields.date).value : null;
    const date = cellToDate(dateVal);
    if (!date) {
      // A fully blank row (common as a trailing/spacer row) isn't an error — just skip quietly.
      const hasAnyValue = row.values && (row.values as unknown[]).some((v) => v !== null && v !== undefined && v !== "");
      if (hasAnyValue) errors.push(`Baris ${r}: tanggal tidak valid, dilewati.`);
      skipped++;
      continue;
    }

    const description = fields.description ? cellToText(row.getCell(fields.description).value) : "";
    const category = fields.category ? cellToText(row.getCell(fields.category).value) : "";
    const division = fields.division ? cellToText(row.getCell(fields.division).value) : "";
    const amountIn = fields.amountIn ? cellToNumber(row.getCell(fields.amountIn).value) : 0;
    const amountOut = fields.amountOut ? cellToNumber(row.getCell(fields.amountOut).value) : 0;
    const balance = fields.balance ? cellToNumber(row.getCell(fields.balance).value) : 0;

    if (amountIn === 0 && amountOut === 0) {
      // A row with no movement usually just decorates the sheet — except the very first
      // row of an empty ledger, where a lone "Saldo" figure represents a carried-over
      // opening balance that must be preserved as a real entry, or the total goes stale.
      if (isFirstDataRow && isEmptyLedger && balance > 0) {
        rows.push({
          date,
          description: description || "Saldo Awal",
          category: category || UNCATEGORIZED,
          division: division || UNASSIGNED_DIVISION,
          amountIn: balance,
          amountOut: 0,
        });
        isFirstDataRow = false;
        continue;
      }
      skipped++;
      isFirstDataRow = false;
      continue;
    }

    rows.push({
      date,
      description: description || "",
      category: category || UNCATEGORIZED,
      division: division || UNASSIGNED_DIVISION,
      amountIn,
      amountOut,
    });
    isFirstDataRow = false;
  }

  return { rows, skipped, errors };
}
