"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme, type Theme } from "@/components/shared/theme-provider";
import { cn } from "@/lib/utils";

const OPCOES: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Tema claro" },
  { value: "dark", icon: Moon, label: "Tema escuro" },
  { value: "system", icon: Monitor, label: "Tema automático (segue o sistema)" },
];

/**
 * Toggle de 3 posições. Cada opção troca o tema imediatamente — sem
 * modal, sem confirmação; é uma preferência de baixo risco, não uma
 * ação que precisa de fricção.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-muted p-0.5">
      {OPCOES.map((opcao) => {
        const Icon = opcao.icon;
        const ativo = theme === opcao.value;

        return (
          <button
            key={opcao.value}
            onClick={() => setTheme(opcao.value)}
            aria-label={opcao.label}
            aria-pressed={ativo}
            className={cn(
              "flex size-7 items-center justify-center rounded-md transition-colors duration-[var(--duration-fast)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              ativo
                ? "bg-surface text-foreground shadow-[var(--shadow-card)]"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
