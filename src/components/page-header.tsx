import type { ReactNode } from "react";

export function PageHeader({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-5">
      <div>
        <div className="text-[11px] tracking-[0.16em] text-primary/80 uppercase">{kicker}</div>
        <h1 className="font-heading mt-1.5 text-[28px] font-semibold tracking-tight sm:text-[33px]">
          {title}
        </h1>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2.5">{children}</div>}
    </div>
  );
}
