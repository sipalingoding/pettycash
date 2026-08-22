import { Card } from "@/components/ui/card";

/** Generic route-level skeleton shown by each `loading.tsx` while the page's data streams in. */
export function PageLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="grid gap-2">
          <div className="h-3 w-32 rounded-full bg-muted" />
          <div className="h-6 w-56 rounded-full bg-muted" />
        </div>
        <div className="h-8 w-32 rounded-lg bg-muted" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="gap-3 rounded-[22px] border-border p-5">
            <div className="h-3 w-20 rounded-full bg-muted" />
            <div className="h-6 w-24 rounded-full bg-muted" />
            <div className="h-2.5 w-16 rounded-full bg-muted" />
          </Card>
        ))}
      </div>

      <div className="mt-4">
        <Card className="gap-4 rounded-[22px] border-border p-6">
          <div className="h-4 w-40 rounded-full bg-muted" />
          <div className="h-56 w-full rounded-2xl bg-muted" />
        </Card>
      </div>
    </div>
  );
}
