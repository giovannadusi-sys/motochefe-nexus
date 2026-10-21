"use client";

import * as React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { excluirUsuario } from "../actions";
import { EditarUsuarioModal } from "./editar-usuario-modal";
import type { PapelUsuario } from "@/types/database";

interface Props {
  usuario: { id: string; nome: string; papel: PapelUsuario };
  ehVoceMesmo: boolean;
}

export function EquipeRowActions({ usuario, ehVoceMesmo }: Props) {
  const [confirmandoExclusao, setConfirmandoExclusao] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const { showToast } = useToast();

  React.useEffect(() => {
    if (!confirmandoExclusao) return;
    const t = window.setTimeout(() => setConfirmandoExclusao(false), 3000);
    return () => window.clearTimeout(t);
  }, [confirmandoExclusao]);

  function handleExcluir() {
    if (!confirmandoExclusao) {
      setConfirmandoExclusao(true);
      return;
    }
    startTransition(async () => {
      const result = await excluirUsuario(usuario.id);
      if (result.error) {
        showToast(result.error, "danger");
      } else {
        showToast("Usuário excluído.", "success");
      }
    });
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      <EditarUsuarioModal
        usuario={usuario}
        trigger={(abrir) => (
          <button
            onClick={abrir}
            aria-label="Editar usuário"
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-[var(--duration-fast)] hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <Pencil className="size-3.5" />
          </button>
        )}
      />

      {!ehVoceMesmo && (
        <motion.button
          onClick={handleExcluir}
          disabled={isPending}
          animate={{ width: confirmandoExclusao ? "auto" : 32 }}
          transition={{ duration: 0.18, ease: [0.65, 0, 0.35, 1] }}
          aria-label="Excluir usuário"
          className={cn(
            "flex h-8 shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-lg px-2 text-xs font-medium transition-colors duration-[var(--duration-fast)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            confirmandoExclusao
              ? "bg-danger-bg text-danger"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Trash2 className="size-3.5 shrink-0" />
          <AnimatePresence>
            {confirmandoExclusao && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
              >
                Confirmar?
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      )}
    </div>
  );
}
