"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function SortableHeader({
  field,
  label,
  align = "left",
}: {
  field: "date" | "amountOut";
  label: string;
  align?: "left" | "right";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort") ?? "date";
  const currentDir = searchParams.get("dir") ?? "desc";
  const active = currentSort === field;
  const nextDir = active && currentDir === "desc" ? "asc" : "desc";

  function onClick() {
    const next = new URLSearchParams(searchParams);
    next.set("sort", field);
    next.set("dir", nextDir);
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}`);
  }

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 uppercase ${align === "right" ? "ml-auto" : ""}`}
    >
      {label}
      <span className="text-[9px]">{active ? (currentDir === "desc" ? "▼" : "▲") : ""}</span>
    </button>
  );
}
