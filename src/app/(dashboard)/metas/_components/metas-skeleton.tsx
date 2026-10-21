import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function MetasSkeleton() {
  return (
    <Card>
      <Skeleton className="mb-4 h-4 w-32" />
      <Skeleton className="mb-2 h-8 w-40" />
      <Skeleton className="mb-3 h-3 w-56" />
      <Skeleton className="h-2 w-full rounded-full" />
    </Card>
  );
}
