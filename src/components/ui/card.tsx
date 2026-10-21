import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Eleva a sombra suavemente no hover — use apenas em cards clicáveis/navegáveis. */
  interactive?: boolean;
  /**
   * Borda amarela sutil no modo escuro — reservado pros cards
   * principais do Dashboard, não é o padrão do design system (usar em
   * todo card diluiria o destaque). No tema claro não faz diferença
   * visível de propósito (fundo já claro, não precisa do reforço).
   */
  accent?: boolean;
}

/**
 * Card base do design system.
 *
 * Usa sombra em camadas em vez de borda sólida (Jakub Krehel) — se adapta
 * melhor a qualquer fundo e cria profundidade sem parecer "achatado".
 * A transição de sombra no hover é sutil (200ms) e só existe em cards
 * marcados como `interactive`.
 */
export function Card({ className, interactive, accent, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-surface p-5 shadow-[var(--shadow-card)]",
        interactive &&
          "transition-shadow duration-[var(--duration-base)] ease-[var(--ease-out-swift)] hover:shadow-[var(--shadow-card-hover)]",
        accent && "dark:shadow-[0_0_0_1px_rgba(255,195,0,0.35),0_1px_2px_-1px_rgba(0,0,0,0.3),0_2px_4px_0_rgba(0,0,0,0.2)]",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 flex items-center justify-between", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-sm font-medium text-muted-foreground", className)} {...props} />
  );
}
