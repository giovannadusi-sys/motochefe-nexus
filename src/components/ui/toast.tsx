"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "danger" | "info";

interface Toast {
  id: string;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  /** Dispara um toast de feedback (ex: "Cliente salvo", "Erro ao salvar venda"). */
  showToast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

const toneConfig: Record<ToastTone, { icon: React.ElementType; className: string }> = {
  success: { icon: CheckCircle2, className: "text-success" },
  danger: { icon: XCircle, className: "text-danger" },
  info: { icon: Info, className: "text-primary" },
};

const DURATION_MS = 4000;

/**
 * Provider de toasts — feedback visual para ações do usuário
 * (salvar, excluir, erro de validação, etc.).
 *
 * Segue os defaults de duração/posição do Sonner (Emil Kowalski):
 * canto inferior direito, ~4s de exibição, entrada/saída rápidas
 * e independentes por toast (não há fila bloqueante).
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const showToast = React.useCallback((message: string, tone: ToastTone = "info") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, DURATION_MS);
  }, []);

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2"
        aria-live="polite"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const { icon: Icon, className } = toneConfig[toast.tone];
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                transition={{ type: "spring", duration: 0.45, bounce: 0 }}
                className="pointer-events-auto flex items-start gap-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-popover)]"
              >
                <Icon className={cn("mt-0.5 size-5 shrink-0", className)} aria-hidden="true" />
                <p className="flex-1 text-sm text-foreground">{toast.message}</p>
                <button
                  onClick={() => dismiss(toast.id)}
                  aria-label="Fechar notificação"
                  className="rounded-md text-muted-foreground transition-colors duration-[var(--duration-fast)] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <X className="size-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast deve ser usado dentro de <ToastProvider>");
  return ctx;
}
