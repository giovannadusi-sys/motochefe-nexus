import { cn } from "@/lib/utils";

/**
 * Skeleton screen — usado como fallback de `Suspense` e estados de
 * carregamento de dados. O shimmer é pausado automaticamente quando
 * `prefers-reduced-motion: reduce` está ativo (ver globals.css).
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Carregando"
      className={cn("skeleton rounded-md", className)}
    />
  );
}
