import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function EquipeListSkeleton() {
  return (
    <Card className="divide-y divide-[var(--border-soft)] p-0">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 px-5 py-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-5 w-28 rounded-full" />
        </div>
      ))}
    </Card>
  );
}
