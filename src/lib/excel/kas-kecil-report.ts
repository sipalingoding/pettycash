import ExcelJS from "exceljs";
import type { ReportData } from "@/db/queries";
import { REPORT_CONFIG } from "@/lib/report-config";
import { periodeLabel, reportDate } from "@/lib/report-format";

const THIN: Partial<ExcelJS.Border> = { style: "thin", color: { argb: "FF9AA5C4" } };
const NUM_FMT = "#,##0.00";

export async function buildKasKecilWorkbook(
  data: ReportData,
  dateFrom: string,
  dateTo: string,
  targetFloat: number
): Promise<ExcelJS.Buffer> {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet("Laporan Kas Kecil", {
    pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true, fitToWidth: 1 },
  });
  sheet.columns = [
    { width: 7 }, // No
    { width: 12 }, // COA
    { width: 13 }, // Tanggal
    { width: 36 }, // Keterangan
    { width: 18 }, // Kategori
    { width: 16 }, // Divisi
    { width: 16 }, // Debit
    { width: 16 }, // Kredit
    { width: 18 }, // Saldo
  ];

  const period = periodeLabel(dateFrom, dateTo);

  function labelRow(label: string, value: string) {
    const row = sheet.addRow([label, `: ${value}`]);
    sheet.mergeCells(row.number, 2, row.number, 9);
    return row;
  }

  labelRow("Nama", REPORT_CONFIG.claimantName);
  labelRow("Jabatan", REPORT_CONFIG.claimantRole);
  const periodRow = sheet.addRow(["Periode Claim", period]);
  sheet.mergeCells(periodRow.number, 2, periodRow.number, 9);
  sheet.addRow([]);

  for (const line of [REPORT_CONFIG.reportTitle, REPORT_CONFIG.companyName, period]) {
    const row = sheet.addRow([line]);
    sheet.mergeCells(row.number, 1, row.number, 9);
    row.getCell(1).alignment = { horizontal: "center" };
    row.getCell(1).font = { bold: line === REPORT_CONFIG.reportTitle };
  }
  sheet.addRow([]);

  const headerRow = sheet.addRow(["No", "COA", "Tanggal", "Keterangan", "Kategori", "Divisi", "Debit", "Kredit", "Saldo"]);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = { top: THIN, bottom: THIN, left: THIN, right: THIN };
  });

  const openingRow = sheet.addRow(["", "", "", "Sisa Saldo", "", "", "", "", data.openingBalance]);
  openingRow.getCell(9).numFmt = NUM_FMT;
  openingRow.getCell(9).alignment = { horizontal: "right" };
  openingRow.eachCell({ includeEmpty: true }, (cell) => {
    cell.border = { top: THIN, bottom: THIN, left: THIN, right: THIN };
  });

  data.rows.forEach((r, i) => {
    const row = sheet.addRow([
      i + 1,
      r.coa || "-",
      reportDate(r.date),
      r.description || "-",
      r.category || "-",
      r.division || "-",
      r.amountIn || "",
      r.amountOut || "",
      r.balance,
    ]);
    row.getCell(1).alignment = { horizontal: "center" };
    row.getCell(2).alignment = { horizontal: "center" };
    row.getCell(3).alignment = { horizontal: "center" };
    row.getCell(4).alignment = { wrapText: true, vertical: "top" };
    row.getCell(5).alignment = { wrapText: true, vertical: "top" };
    row.getCell(6).alignment = { wrapText: true, vertical: "top" };
    for (const col of [7, 8, 9]) {
      row.getCell(col).numFmt = NUM_FMT;
      row.getCell(col).alignment = { horizontal: "right" };
    }
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = { top: THIN, bottom: THIN, left: THIN, right: THIN };
    });
  });

  sheet.addRow([]);

  const pengisian = targetFloat - data.closingBalance;

  const sisaRow = sheet.addRow(["Sisa Saldo Saat Ini", "", "", "", "", "", "", "", data.closingBalance]);
  sisaRow.getCell(9).numFmt = NUM_FMT;
  sisaRow.getCell(9).alignment = { horizontal: "right" };

  const pengisianRow = sheet.addRow(["Pengisian Pettycash", "", "", "", "", "", "", "", pengisian]);
  pengisianRow.getCell(9).numFmt = NUM_FMT;
  pengisianRow.getCell(9).font = { bold: true };
  pengisianRow.getCell(9).alignment = { horizontal: "right" };
  pengisianRow.getCell(9).border = { top: { style: "thin", color: { argb: "FF000000" } } };

  const totalRow = sheet.addRow(["", "", "", "", "", "", "", "", targetFloat]);
  totalRow.getCell(9).numFmt = NUM_FMT;
  totalRow.getCell(9).alignment = { horizontal: "right" };

  sheet.addRow([]);
  const transferRow = sheet.addRow(["Transfer ke :", REPORT_CONFIG.transferAccount]);
  transferRow.getCell(1).font = { bold: true };
  transferRow.getCell(2).font = { bold: true };

  sheet.addRow([]);
  sheet.addRow([]);

  const [s1, s2, s3, s4] = REPORT_CONFIG.signatories;
  const roleRow = sheet.addRow([s1.role + ",", "", s2.role + ",", "", s3.role + ",", "", "", "", s4.role + ","]);
  roleRow.getCell(3).alignment = { horizontal: "center" };
  roleRow.getCell(5).alignment = { horizontal: "center" };
  roleRow.getCell(9).alignment = { horizontal: "center" };

  sheet.addRow([]);
  sheet.addRow([]);

  const nameRow = sheet.addRow([s1.name, "", s2.name, "", s3.name, "", "", "", s4.name]);
  for (const col of [1, 3, 5, 9]) {
    nameRow.getCell(col).font = { underline: true };
  }
  nameRow.getCell(3).alignment = { horizontal: "center" };
  nameRow.getCell(5).alignment = { horizontal: "center" };
  nameRow.getCell(9).alignment = { horizontal: "center" };

  const titleRow = sheet.addRow([s1.title, "", s2.title, "", s3.title, "", "", "", s4.title]);
  titleRow.getCell(3).alignment = { horizontal: "center" };
  titleRow.getCell(5).alignment = { horizontal: "center" };
  titleRow.getCell(9).alignment = { horizontal: "center" };

  return wb.xlsx.writeBuffer();
}
