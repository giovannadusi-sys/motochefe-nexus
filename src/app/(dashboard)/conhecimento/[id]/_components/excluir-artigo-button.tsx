"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { excluirArtigo } from "../../actions";

export function ExcluirArtigoButton({ id }: { id: string }) {
  const [confirmando, setConfirmando] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    if (!confirmando) return;
    const t = window.setTimeout(() => setConfirmando(false), 3000);
    return () => window.clearTimeout(t);
  }, [confirmando]);

  function handleClick() {
    if (!confirmando) {
      setConfirmando(true);
      return;
    }
    startTransition(async () => {
      await excluirArtigo(id);
    });
  }

  return (
    <motion.button
      onClick={handleClick}
      disabled={isPending}
      animate={{ width: confirmando ? "auto" : 32 }}
      transition={{ duration: 0.18, ease: [0.65, 0, 0.35, 1] }}
      aria-label="Excluir artigo"
      className={cn(
        "flex h-8 shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-lg px-2 text-xs font-medium transition-colors duration-[var(--duration-fast)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        confirmando
          ? "bg-danger-bg text-danger"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Trash2 className="size-3.5 shrink-0" />
      <AnimatePresence>
        {confirmando && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            Excluir artigo?
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
