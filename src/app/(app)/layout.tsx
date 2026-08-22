import { DecorBackground } from "@/components/decor-background";
import { SidebarNav } from "@/components/sidebar-nav";
import { getAggregates, getDivisionNames } from "@/db/queries";

// This whole subtree reads live data on every request — never prerender it at build time,
// since a build environment typically won't have DATABASE_URL configured yet.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const [agg, divisionNames] = await Promise.all([getAggregates(), getDivisionNames()]);

  return (
    <div className="relative flex min-h-screen">
      <DecorBackground />
      <SidebarNav
        transactionCount={agg.count}
        categoryCount={agg.categories.length}
        divisionCount={divisionNames.length}
        balance={agg.currentBalance}
      />
      <main className="relative z-10 min-w-0 flex-1 px-5 py-7 sm:px-9 sm:py-8">{children}</main>
    </div>
  );
}
