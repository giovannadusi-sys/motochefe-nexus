import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Fallback exibido pelo <Suspense> enquanto <StatsWidget /> carrega.
 * Reproduz a mesma geometria do conteúdo final para não haver "salto"
 * de layout quando os dados chegam.
 */
export function StatsWidgetSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <Skeleton className="mb-4 h-4 w-24" />
          <Skeleton className="mb-2 h-7 w-16" />
          <Skeleton className="h-3 w-32" />
        </Card>
      ))}
    </div>
  );
}
