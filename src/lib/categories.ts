import { hashColor } from "@/lib/utils";

export const UNCATEGORIZED = "Tanpa Kategori";

/** Base accent color per category — reused across badges, donut chart, and category cards. */
export const CATEGORY_COLORS: Record<string, string> = {
  "Pos Silang": "#A05869",
  "Biaya Operasional": "#6F7C61",
  "ATK / Keperluan Kantor": "#9C7355",
  "Lain-lain": "#7B6689",
  "Pengajuan Urgent": "#5E778C",
  "Listrik / Air / Pulsa": "#A0637A",
  "Parkir /Tol / Bensin": "#8C7746",
  "Biaya ADM": "#7C7466",
  "Biaya Service": "#5F7B77",
  "Biaya Pemeliharaan kendaraan": "#7E7364",
  "Transportasi / Ongkos Kirim": "#666F91",
  "Makan & Minum / Konsumsi": "#A26F51",
  "Top-up / Tambahan Dana": "#6E7D5B",
  "Bunga Bank": "#6C7686",
  "Pajak Bunga": "#83717A",
  "Perbaikan & Pemeliharaan": "#5A8073",
  "Biaya Laundry": "#7590A6",
  "Biaya Pos / Kurir": "#AD8449",
  [UNCATEGORIZED]: "#8A7E76",
};

export function categoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? hashColor(category);
}
