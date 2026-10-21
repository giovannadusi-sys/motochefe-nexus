import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ArtigosListSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i}>
          <Skeleton className="mb-2 h-4 w-24" />
          <Card className="divide-y divide-[var(--border-soft)] p-0">
            {Array.from({ length: 2 }).map((_, j) => (
              <div key={j} className="px-5 py-3">
                <Skeleton className="h-4 w-48" />
              </div>
            ))}
          </Card>
        </div>
      ))}
    </div>
  );
}
