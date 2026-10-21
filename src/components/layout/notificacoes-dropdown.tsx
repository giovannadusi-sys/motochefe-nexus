"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bell, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NotificacaoItem {
  id: string;
  clienteNome: string;
  dataPrevista: string;
  diasRestantes: number;
}

const formatoData = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

export function NotificacoesDropdown({ itens }: { itens: NotificacaoItem[] }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onClickOutside);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notificações"
        className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-[var(--duration-fast)] hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        <Bell className="size-4" aria-hidden="true" />
        {itens.length > 0 && (
          <span className="absolute right-1 top-1 flex size-2 rounded-full bg-danger" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: "spring", duration: 0.25, bounce: 0 }}
            className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl bg-surface p-2 shadow-[var(--shadow-popover)]"
          >
            <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Revisões se aproximando
            </p>
            {itens.length === 0 ? (
              <p className="px-2 py-3 text-sm text-muted-foreground">Nenhuma notificação por enquanto.</p>
            ) : (
              <div className="flex flex-col">
                {itens.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-2 rounded-lg px-2 py-2 transition-colors duration-[var(--duration-fast)] hover:bg-muted"
                  >
                    <ShieldAlert
                      className={cn(
                        "mt-0.5 size-4 shrink-0",
                        item.diasRestantes <= 7 ? "text-danger" : "text-warning"
                      )}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm text-foreground">{item.clienteNome}</p>
                      <p className="text-xs text-muted-foreground">
                        Revisão em {formatoData.format(new Date(`${item.dataPrevista}T12:00:00`))}
                        {item.diasRestantes >= 0
                          ? ` · ${item.diasRestantes} dias`
                          : " · atrasada"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
