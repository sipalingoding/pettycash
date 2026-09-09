import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import type { ReportData } from "@/db/queries";
import { REPORT_CONFIG } from "@/lib/report-config";
import { periodeLabel, reportDate, reportNumber } from "@/lib/report-format";

const BORDER = "#9aa5c4";
const NAVY = "#1a237e";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  headerTitle: { fontSize: 14, fontWeight: "bold", marginBottom: 15 },
  attachmentContainer: { marginBottom: 20, alignItems: "center" },
  caption: { fontSize: 9, color: "#555", marginBottom: 4 },
  attachmentImage: {
    width: 350,
    height: "auto",
    objectFit: "contain",
    marginTop: 5,
  },
  frame: {
    flex: 1,
    border: `1.5pt solid ${NAVY}`,
    padding: 14,
  },
  headerRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  headerLabel: { width: 80 },
  headerColon: { width: 10 },
  titleBlock: {
    textAlign: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  titleLine: { fontSize: 11 },
  table: {
    border: `0.75pt solid ${BORDER}`,
  },
  row: {
    flexDirection: "row",
    borderBottom: `0.75pt solid ${BORDER}`,
  },
  headCell: {
    padding: 4,
    borderRight: `0.75pt solid ${BORDER}`,
    textAlign: "center",
    fontWeight: 700,
  },
  cell: {
    padding: 4,
    borderRight: `0.75pt solid ${BORDER}`,
    justifyContent: "center",
  },
  colNo: { width: "4%" },
  colDate: { width: "9%" },
  colDesc: { width: "32%" },
  colCategory: { width: "13%" },
  colDivision: { width: "10%" },
  colDebit: { width: "10%" },
  colKredit: { width: "10%" },
  colSaldo: { width: "12%", borderRight: "none" },
  right: { textAlign: "right" },
  center: { textAlign: "center" },
  footer: {
    marginTop: 14,
    borderTop: `1.5pt solid ${NAVY}`,
    paddingTop: 10,
  },
  footerRow: { flexDirection: "row", marginBottom: 2 },
  footerLabel: { width: 160 },
  footerValueWrap: { width: 200, alignItems: "flex-end" },
  footerValue: { textAlign: "right" },
  footerValueBold: { textAlign: "right", fontWeight: 700 },
  footerTotalLine: {
    width: 90,
    borderTop: `0.75pt solid #000000`,
    paddingTop: 2,
  },
  transferRow: { flexDirection: "row", marginTop: 8, marginBottom: 16 },
  signRow: { flexDirection: "row", marginTop: 24 },
  signCol: { flex: 1, alignItems: "center" },
  signColFirst: { flex: 1, alignItems: "flex-start" },
  signName: {
    marginTop: 34,
    textDecoration: "underline",
  },
  signTitle: { marginTop: 2 },
});

export function KasKecilReportDocument({
  data,
  dateFrom,
  dateTo,
  targetFloat,
}: {
  data: ReportData;
  dateFrom: string;
  dateTo: string;
  targetFloat: number;
}) {
  const period = periodeLabel(dateFrom, dateTo);
  const pengisian = targetFloat - data.closingBalance;

  const groupedAttachments =
    data.attachments?.reduce(
      (acc, att) => {
        const desc = att.transactionDescription || "Tanpa Keterangan";
        if (!acc[desc]) {
          acc[desc] = [];
        }
        acc[desc].push(att);
        return acc;
      },
      {} as Record<string, typeof data.attachments>,
    ) || {};

  const attachmentGroups = Object.entries(groupedAttachments);

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.frame}>
          <View style={styles.headerRow}>
            <Text style={styles.headerLabel}>Nama</Text>
            <Text style={styles.headerColon}>:</Text>
            <Text>{REPORT_CONFIG.claimantName}</Text>
          </View>
          <View style={styles.headerRow}>
            <Text style={styles.headerLabel}>Jabatan</Text>
            <Text style={styles.headerColon}>:</Text>
            <Text>{REPORT_CONFIG.claimantRole}</Text>
          </View>
          <View style={styles.headerRow}>
            <Text style={styles.headerLabel}>Periode Claim</Text>
            <Text style={styles.headerColon}>:</Text>
            <Text>{period}</Text>
          </View>

          <View style={styles.titleBlock}>
            <Text style={styles.titleLine}>{REPORT_CONFIG.reportTitle}</Text>
            <Text style={styles.titleLine}>{REPORT_CONFIG.companyName}</Text>
            <Text style={styles.titleLine}>{period}</Text>
          </View>

          <View style={styles.table}>
            <View style={styles.row}>
              <Text style={[styles.headCell, styles.colNo]}>No</Text>
              <Text style={[styles.headCell, styles.colDate]}>Tanggal</Text>
              <Text style={[styles.headCell, styles.colDesc]}>Keterangan</Text>
              <Text style={[styles.headCell, styles.colCategory]}>Kategori</Text>
              <Text style={[styles.headCell, styles.colDivision]}>Divisi</Text>
              <Text style={[styles.headCell, styles.colDebit]}>Debit</Text>
              <Text style={[styles.headCell, styles.colKredit]}>Kredit</Text>
              <Text style={[styles.headCell, styles.colSaldo]}>Saldo</Text>
            </View>

            <View style={styles.row}>
              <View style={[styles.cell, styles.colNo]} />
              <View style={[styles.cell, styles.colDate]} />
              <Text style={[styles.cell, styles.colDesc]}>Sisa Saldo</Text>
              <View style={[styles.cell, styles.colCategory]} />
              <View style={[styles.cell, styles.colDivision]} />
              <View style={[styles.cell, styles.colDebit]} />
              <View style={[styles.cell, styles.colKredit]} />
              <Text style={[styles.cell, styles.colSaldo, styles.right]}>
                {reportNumber(data.openingBalance)}
              </Text>
            </View>

            {data.rows.map((r, i) => (
              <View style={styles.row} key={r.txNo} wrap={false}>
                <Text style={[styles.cell, styles.colNo, styles.center]}>
                  {i + 1}
                </Text>
                <Text style={[styles.cell, styles.colDate, styles.center]}>
                  {reportDate(r.date)}
                </Text>
                <Text style={[styles.cell, styles.colDesc]}>
                  {r.description || "-"}
                </Text>
                <Text style={[styles.cell, styles.colCategory]}>
                  {r.category || "-"}
                </Text>
                <Text style={[styles.cell, styles.colDivision]}>
                  {r.division || "-"}
                </Text>
                <Text style={[styles.cell, styles.colDebit, styles.right]}>
                  {r.amountIn ? reportNumber(r.amountIn) : ""}
                </Text>
                <Text style={[styles.cell, styles.colKredit, styles.right]}>
                  {r.amountOut ? reportNumber(r.amountOut) : ""}
                </Text>
                <Text style={[styles.cell, styles.colSaldo, styles.right]}>
                  {reportNumber(r.balance)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.footer}>
            <View style={styles.footerRow}>
              <Text style={styles.footerLabel}>Sisa Saldo Saat Ini</Text>
              <View style={styles.footerValueWrap}>
                <Text style={styles.footerValue}>
                  {reportNumber(data.closingBalance, 0)}
                </Text>
              </View>
            </View>
            <View style={styles.footerRow}>
              <Text style={styles.footerLabel}>Pengisian Pettycash</Text>
              <View style={styles.footerValueWrap}>
                <Text style={styles.footerValueBold}>
                  {reportNumber(pengisian, 0)}
                </Text>
              </View>
            </View>
            <View style={styles.footerRow}>
              <Text style={styles.footerLabel} />
              <View style={styles.footerValueWrap}>
                <View style={styles.footerTotalLine}>
                  <Text style={styles.footerValue}>
                    {reportNumber(targetFloat, 0)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.transferRow}>
              <Text style={{ fontWeight: 700 }}>Transfer ke : </Text>
              <Text style={{ fontWeight: 700 }}>
                {REPORT_CONFIG.transferAccount}
              </Text>
            </View>

            <View style={styles.signRow}>
              {REPORT_CONFIG.signatories.map((s, i) => (
                <View
                  style={i === 0 ? styles.signColFirst : styles.signCol}
                  key={s.role + s.name}
                >
                  <Text>{s.role},</Text>
                  <Text style={styles.signName}>{s.name}</Text>
                  <Text style={styles.signTitle}>{s.title}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </Page>
      {attachmentGroups.map(([description, items], groupIndex) => (
        <Page key={description + groupIndex} size="A4" style={styles.page}>
          <View style={styles.frame}>
            {/* Judul utama hanya muncul sekali di kelompok/halaman pertama */}
            {groupIndex === 0 && (
              <Text style={styles.headerTitle}>LAMPIRAN BUKTI TRANSAKSI</Text>
            )}

            {/* Keterangan yang sama ditampilkan cukup sekali per halaman */}
            <View style={styles.attachmentContainer}>
              <Text
                style={[
                  styles.caption,
                  { fontSize: 11, fontWeight: "bold", marginBottom: 10 },
                ]}
              >
                Lampiran: {description}
              </Text>

              {/* Render semua gambar bukti yang masuk dalam keterangan ini */}
              {items.map(
                (att) =>
                  att.url && (
                    <Image
                      key={att.id}
                      src={att.url}
                      style={[styles.attachmentImage, { marginBottom: 10 }]}
                    />
                  ),
              )}
            </View>
          </View>
        </Page>
      ))}
    </Document>
  );
}
