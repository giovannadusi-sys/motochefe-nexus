import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AtividadesSkeleton() {
  return (
    <Card>
      <Skeleton className="mb-4 h-4 w-24" />
      <Skeleton className="mb-2 h-10 w-full" />
      <Skeleton className="h-2 w-full rounded-full" />
    </Card>
  );
}
