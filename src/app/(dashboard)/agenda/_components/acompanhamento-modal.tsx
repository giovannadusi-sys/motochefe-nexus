"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  criarAcompanhamento,
  atualizarAcompanhamento,
} from "../actions";
import { initialAcompanhamentoFormState } from "../form-state";
import type { TipoAcompanhamento } from "@/types/database";

interface ClienteOption {
  id: string;
  nome: string;
}

interface AcompanhamentoInicial {
  id: string;
  cliente_id: string;
  tipo: TipoAcompanhamento;
  data: string;
  descricao: string | null;
}

interface AcompanhamentoModalProps {
  clientes: ClienteOption[];
  /** Presente = modo edição; ausente = modo criação. */
  inicial?: AcompanhamentoInicial;
  /** Renderiza o elemento que abre o modal (botão, ícone...). */
  trigger: (abrir: () => void) => React.ReactNode;
}

const HOJE = new Date().toISOString().slice(0, 10);

const selectClassName = cn(
  "h-10 w-full rounded-lg bg-surface px-3 text-sm text-foreground shadow-[var(--shadow-card)] outline-none",
  "transition-shadow duration-[var(--duration-fast)] ease-[var(--ease-out-swift)]",
  "focus-visible:shadow-[0_0_0_1px_var(--primary),0_0_0_4px_rgba(47,95,246,0.15)]"
);

/**
 * Modal único para criar e editar acompanhamentos. O `trigger` é uma
 * render prop — permite tanto o botão "Novo acompanhamento" no topo da
 * página quanto um ícone de lápis por linha, sem duplicar o formulário.
 */
export function AcompanhamentoModal({ clientes, inicial, trigger }: AcompanhamentoModalProps) {
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const { showToast } = useToast();
  const formRef = React.useRef<HTMLFormElement>(null);
  const modoEdicao = Boolean(inicial);

  function fechar() {
    setOpen(false);
    setError(null);
    formRef.current?.reset();
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const action = modoEdicao ? atualizarAcompanhamento : criarAcompanhamento;
      const result = await action(initialAcompanhamentoFormState, formData);
      if (result.success) {
        fechar();
        showToast(
          modoEdicao ? "Acompanhamento atualizado." : "Acompanhamento registrado.",
          "success"
        );
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <>
      {trigger(() => setOpen(true))}

      <Modal
        open={open}
        onClose={fechar}
        title={modoEdicao ? "Editar acompanhamento" : "Novo acompanhamento"}
        maxWidth="max-w-md"
      >
        <form ref={formRef} action={handleSubmit} className="flex flex-col gap-3">
          {modoEdicao && <input type="hidden" name="id" value={inicial!.id} />}

          <select
            name="cliente_id"
            required
            defaultValue={inicial?.cliente_id ?? ""}
            className={selectClassName}
          >
            <option value="" disabled>
              Selecione o cliente
            </option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nome}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select
              name="tipo"
              required
              defaultValue={inicial?.tipo ?? "follow_up"}
              className={selectClassName}
            >
              <option value="follow_up">Follow-up</option>
              <option value="retorno">Retorno</option>
              <option value="seguro">Seguro</option>
              <option value="revisao">Revisão</option>
              <option value="pos_venda">Pós-venda</option>
              <option value="outro">Outro</option>
            </select>
            <Input name="data" type="date" defaultValue={inicial?.data ?? HOJE} required />
          </div>

          <Input
            name="descricao"
            placeholder="Descrição (opcional)"
            defaultValue={inicial?.descricao ?? ""}
          />

          <AnimatePresence>
            {error && (
              <motion.p
                role="alert"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18, ease: [0.65, 0, 0.35, 1] }}
                className="overflow-hidden text-sm text-danger"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={fechar}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isPending}>
              {modoEdicao ? "Salvar alterações" : "Salvar"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
