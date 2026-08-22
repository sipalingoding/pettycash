import { hashColor } from "@/lib/utils";

export const UNASSIGNED_DIVISION = "Tanpa Divisi";

export function divisionColor(division: string): string {
  return hashColor(division, 28, 40);
}
