"use client";

import { cn } from "@/lib/utils";

export interface ProgressBarProps {
  /** Valor entre 0 e 1 (ex: 0.64 = 64%). */
  value: number;
  tone?: "primary" | "success" | "danger";
  className?: string;
  "aria-label"?: string;
}

const toneClasses = {
  primary: "bg-primary",
  success: "bg-success",
  danger: "bg-danger",
};

/**
 * Barra de progresso (ex: meta mensal, ligações do dia).
 *
 * O preenchimento anima via `transform: scaleX()` em vez de `width` —
 * evita reflow (Emil Kowalski, performance) e permite transição suave
 * sempre que o valor mudar, sem custo de layout.
 */
export function ProgressBar({ value, tone = "primary", className, ...props }: ProgressBarProps) {
  const clamped = Math.min(1, Math.max(0, value));

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      {...props}
    >
      <div
        className={cn(
          "h-full w-full origin-left rounded-full transition-transform duration-[var(--duration-polish)] ease-[var(--ease-out-swift)]",
          toneClasses[tone]
        )}
        style={{ transform: `scaleX(${clamped})` }}
      />
    </div>
  );
}
