"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Largura máxima do painel — ex: "max-w-lg" (padrão), "max-w-xl", "max-w-sm". */
  maxWidth?: string;
  /** Desativa fechar ao clicar no backdrop (ex: tela de credenciais que não deve sumir sem querer). */
  disableBackdropClose?: boolean;
  /** Esconde o X de fechar (mesmo caso da tela de credenciais — força passar pelo botão "Concluir"). */
  hideCloseButton?: boolean;
}

/**
 * Modal compartilhado por todo o app.
 *
 * Renderiza via `createPortal` direto em `document.body` — de
 * propósito, não por preferência estética. `PageTransition` anima a
 * página inteira com `transform` (opacity/y/blur via Framer Motion), e
 * QUALQUER elemento `position: fixed` dentro de uma árvore com um
 * ancestral transformado deixa de se posicionar relativo à tela e
 * passa a se posicionar relativo a esse ancestral — é comportamento
 * padrão do CSS, não um bug do Framer Motion. Resultado prático: sem
 * portal, o modal podia aparecer cortado/deslocado dependendo da
 * página. O portal tira o modal de dentro dessa árvore transformada,
 * então `fixed inset-0` volta a valer para a tela inteira sempre.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-lg",
  disableBackdropClose = false,
  hideCloseButton = false,
}: ModalProps) {
  const [mounted, setMounted] = React.useState(false);

  // Efeito intencional: só existe `document.body` no cliente, então
  // "montar" o portal precisa esperar o primeiro efeito rodar — mesma
  // exceção documentada em theme-provider.tsx.
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    setMounted(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  React.useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-black/40"
            onClick={disableBackdropClose ? undefined : onClose}
            aria-hidden="true"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", duration: 0.32, bounce: 0 }}
            className={cn(
              "relative flex max-h-[90vh] w-full flex-col overflow-y-auto rounded-xl bg-surface p-6 shadow-[var(--shadow-popover)]",
              maxWidth
            )}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">{title}</h2>
              {!hideCloseButton && (
                <button
                  onClick={onClose}
                  aria-label="Fechar"
                  className="rounded-md text-muted-foreground transition-colors duration-[var(--duration-fast)] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <X className="size-5" />
                </button>
              )}
            </div>

            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
