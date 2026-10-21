import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

/**
 * Checkbox com estado visual próprio (o input nativo fica invisível,
 * mas continua acessível via teclado/leitor de tela).
 *
 * Usa `group-has-[:checked]` (não `peer-checked`) porque o ícone de
 * check fica aninhado dentro do <span>, não é irmão direto do input —
 * o combinador de irmãos do CSS não alcançaria ele. `:has()` resolve
 * isso checando o estado de qualquer descendente do <label>.
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;

    return (
      <label
        htmlFor={inputId}
        className={cn("group flex cursor-pointer items-center gap-2 text-sm text-foreground", className)}
      >
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          className="peer sr-only"
          {...props}
        />
        <span
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-md shadow-[var(--shadow-card)]",
            "transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out-swift)]",
            "group-has-[:checked]:bg-primary group-has-[:checked]:text-primary-foreground",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface"
          )}
        >
          <Check className="size-3.5 opacity-0 transition-opacity duration-[var(--duration-fast)] group-has-[:checked]:opacity-100" />
        </span>
        {label}
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";
