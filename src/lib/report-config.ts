/** Static identity for the "Laporan Kas Kecil" print/export report — fixed company & signatory info. */
export const REPORT_CONFIG = {
  reportTitle: "LAPORAN KAS KECIL JAKARTA",
  companyName: "PT. WORCAS NUSANTARA ABADI",
  claimantName: "Karima Urfa Wardiani",
  claimantRole: "AP & Tax",
  /** Suggested starting value for the "Target Pettycash" field in the print dialog — not authoritative, the user sets the real figure per report. */
  defaultTargetFloat: 30_000_000,
  transferAccount: "3995953999 an Roysevelt",
  signatories: [
    { role: "Dibuat Oleh", name: "Rima", title: "Staff AP & Tax" },
    { role: "Disetujui Oleh", name: "Septian", title: "Finance & Accounting" },
    { role: "Disetujui Oleh", name: "Max Thober", title: "GM Finance & Accounting" },
    { role: "Disetujui Oleh", name: "Roysevelt", title: "Direktur Utama" },
  ],
} as const;
