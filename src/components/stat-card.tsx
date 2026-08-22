import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TONE_STYLES = {
  accent: { icon: "bg-secondary text-accent-foreground", value: "" },
  income: { icon: "bg-income/15 text-income-foreground", value: "text-income-foreground" },
  expense: { icon: "bg-expense/15 text-expense-foreground", value: "text-expense-foreground" },
  highlight: { icon: "bg-secondary text-accent-foreground", value: "" },
} as const;

export function StatCard({
  icon: Icon,
  label,
  value,
  foot,
  tone = "accent",
  highlight = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  foot: string;
  tone?: keyof typeof TONE_STYLES;
  highlight?: boolean;
}) {
  const styles = TONE_STYLES[tone];
  return (
    <Card
      className={cn(
        "gap-0 rounded-2xl border-border p-5",
        highlight && "bg-gradient-to-br from-card to-secondary/50"
      )}
    >
      <div className="flex items-center gap-2.5">
        <span className={cn("flex size-7 items-center justify-center rounded-[10px]", styles.icon)}>
          <Icon className="size-3.5" />
        </span>
        <span className="text-[12.5px] text-muted-foreground">{label}</span>
      </div>
      <div className={cn("font-heading mt-3.5 font-variant-tabular text-[26px] font-semibold tracking-tight", styles.value)}>
        {value}
      </div>
      <div className="mt-1.5 text-xs text-muted-foreground/80">{foot}</div>
    </Card>
  );
}
