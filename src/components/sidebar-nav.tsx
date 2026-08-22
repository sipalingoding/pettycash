"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ListOrdered, BarChart3, Tags, Building2, TrendingUp, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import { rp, fmtCount, hariTanggal, jam } from "@/lib/format";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transaksi", label: "Transaksi", icon: ListOrdered, badgeKey: "count" as const },
  { href: "/laporan", label: "Laporan Bulanan", icon: BarChart3 },
  { href: "/kategori", label: "Kategori", icon: Tags, badgeKey: "categories" as const },
  { href: "/divisi", label: "Divisi", icon: Building2, badgeKey: "divisions" as const },
];

export function SidebarNav({
  transactionCount,
  categoryCount,
  divisionCount,
  balance,
}: {
  transactionCount: number;
  categoryCount: number;
  divisionCount: number;
  balance: number;
}) {
  const pathname = usePathname();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(id);
  }, []);

  const badges = {
    count: fmtCount(transactionCount),
    categories: fmtCount(categoryCount),
    divisions: fmtCount(divisionCount),
  };

  return (
    <aside className="sticky top-0 flex h-screen w-[248px] shrink-0 flex-col gap-6 overflow-y-auto border-r border-sidebar-border bg-sidebar/70 px-4 py-7 backdrop-blur-md">
      <div className="flex items-center gap-3 px-1.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-[13px] bg-gradient-to-br from-[#d89aa6] to-[#b4697a] shadow-[0_6px_14px_rgba(180,105,122,0.28)] dark:from-[#e7a0b0] dark:to-[#c97f92]">
          <Leaf className="size-4.5 origin-bottom animate-leaf-sway text-[#fff6f4]" strokeWidth={1.7} />
        </div>
        <div>
          <div className="font-heading text-[17px] font-semibold leading-tight tracking-tight text-sidebar-foreground">
            Petty Cash
          </div>
          <div className="mt-0.5 text-[10.5px] tracking-[0.14em] text-muted-foreground uppercase">
            Karima Urfa Wardiani
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        <div className="px-2 pb-2 text-[10px] tracking-[0.15em] text-muted-foreground/80 uppercase">
          Menu
        </div>
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-[13px] px-3 py-2.5 text-[13.5px] transition-colors",
                active
                  ? "bg-gradient-to-r from-sidebar-accent to-sidebar-accent/60 font-medium text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span>{item.label}</span>
              {item.badgeKey && (
                <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 font-variant-tabular text-[11px] text-secondary-foreground">
                  {badges[item.badgeKey]}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-[18px] border border-sidebar-border bg-gradient-to-br from-sidebar to-sidebar-accent/40 px-4 py-4">
        <div className="text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
          Saldo saat ini
        </div>
        <div className="font-heading mt-1.5 font-variant-tabular text-[25px] font-semibold tracking-tight text-sidebar-foreground">
          {rp(balance)}
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-income-foreground">
          <TrendingUp className="size-3.5" />
          <span>{fmtCount(transactionCount)} transaksi tercatat</span>
        </div>
        {now && (
          <div className="mt-2 border-t border-sidebar-border pt-2 text-[11px] text-muted-foreground">
            {hariTanggal(now)} · {jam(now)}
          </div>
        )}
      </div>
    </aside>
  );
}
