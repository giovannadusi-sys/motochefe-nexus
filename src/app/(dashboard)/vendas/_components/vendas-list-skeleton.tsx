import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function VendasListSkeleton() {
  return (
    <Card className="divide-y divide-[var(--border-soft)] p-0">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 px-5 py-3">
          <div className="flex-1">
            <Skeleton className="mb-2 h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-5 w-24" />
        </div>
      ))}
    </Card>
  );
}
