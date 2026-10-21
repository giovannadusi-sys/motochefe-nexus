import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function RankingListSkeleton() {
  return (
    <Card className="divide-y divide-[var(--border-soft)] p-0">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <Skeleton className="size-8 rounded-full" />
          <div className="flex-1">
            <Skeleton className="mb-2 h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </Card>
  );
}
