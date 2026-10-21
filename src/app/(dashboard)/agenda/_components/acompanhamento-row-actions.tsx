"use client";

import * as React from "react";
import { Check, Pencil, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { concluirAcompanhamento, excluirAcompanhamento } from "../actions";
import { AcompanhamentoModal } from "./acompanhamento-modal";
import type { TipoAcompanhamento } from "@/types/database";

interface ClienteOption {
  id: string;
  nome: string;
}

interface Props {
  item: {
    id: string;
    cliente_id: string;
    tipo: TipoAcompanhamento;
    data: string;
    descricao: string | null;
    status: string;
  };
  clientes: ClienteOption[];
}

/**
 * Ações de uma linha de acompanhamento. O excluir usa confirmação em
 * duas etapas dentro do próprio botão (clique 1: "Excluir?" em
 * vermelho; clique 2 dentro de 3s: executa) em vez do `confirm()`
 * nativo do navegador — mantém a experiência dentro do design system,
 * sem um dialog do sistema operacional quebrando a continuidade visual.
 */
export function AcompanhamentoRowActions({ item, clientes }: Props) {
  const [confirmandoExclusao, setConfirmandoExclusao] = React.useState(false);
  const [isPendingConcluir, startConcluir] = React.useTransition();
  const [isPendingExcluir, startExcluir] = React.useTransition();
  const { showToast } = useToast();

  React.useEffect(() => {
    if (!confirmandoExclusao) return;
    const timeout = window.setTimeout(() => setConfirmandoExclusao(false), 3000);
    return () => window.clearTimeout(timeout);
  }, [confirmandoExclusao]);

  function handleConcluir() {
    startConcluir(async () => {
      await concluirAcompanhamento(item.id);
      showToast("Acompanhamento concluído.", "success");
    });
  }

  function handleExcluir() {
    if (!confirmandoExclusao) {
      setConfirmandoExclusao(true);
      return;
    }
    startExcluir(async () => {
      await excluirAcompanhamento(item.id);
      showToast("Acompanhamento excluído.", "success");
    });
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      {item.status === "pendente" && (
        <Button size="sm" variant="secondary" onClick={handleConcluir} isLoading={isPendingConcluir}>
          <Check className="size-3.5" aria-hidden="true" />
          Concluir
        </Button>
      )}

      <AcompanhamentoModal
        clientes={clientes}
        inicial={item}
        trigger={(abrir) => (
          <button
            onClick={abrir}
            aria-label="Editar acompanhamento"
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-[var(--duration-fast)] hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <Pencil className="size-3.5" />
          </button>
        )}
      />

      <motion.button
        onClick={handleExcluir}
        disabled={isPendingExcluir}
        animate={{ width: confirmandoExclusao ? "auto" : 32 }}
        transition={{ duration: 0.18, ease: [0.65, 0, 0.35, 1] }}
        aria-label="Excluir acompanhamento"
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
    </div>
  );
}
