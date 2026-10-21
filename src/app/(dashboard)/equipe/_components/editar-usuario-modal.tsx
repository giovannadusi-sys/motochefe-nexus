"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { atualizarUsuario } from "../actions";
import { initialAtualizarUsuarioState } from "../form-state";
import type { PapelUsuario } from "@/types/database";

interface Props {
  usuario: { id: string; nome: string; papel: PapelUsuario };
  trigger: (abrir: () => void) => React.ReactNode;
}

export function EditarUsuarioModal({ usuario, trigger }: Props) {
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const { showToast } = useToast();
  const formRef = React.useRef<HTMLFormElement>(null);

  function fechar() {
    setOpen(false);
    setError(null);
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await atualizarUsuario(initialAtualizarUsuarioState, formData);
      if (result.success) {
        fechar();
        showToast("Usuário atualizado.", "success");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <>
      {trigger(() => setOpen(true))}

      <Modal open={open} onClose={fechar} title="Editar usuário" maxWidth="max-w-sm">
        <form ref={formRef} action={handleSubmit} className="flex flex-col gap-3">
          <input type="hidden" name="id" value={usuario.id} />
          <Input name="nome" placeholder="Nome completo *" defaultValue={usuario.nome} required />
          <select
            name="papel"
            required
            defaultValue={usuario.papel}
            className={cn(
              "h-10 w-full rounded-lg bg-surface px-3 text-sm text-foreground shadow-[var(--shadow-card)] outline-none",
              "transition-shadow duration-[var(--duration-fast)] ease-[var(--ease-out-swift)]",
              "focus-visible:shadow-[0_0_0_1px_var(--primary),0_0_0_4px_rgba(47,95,246,0.15)]"
            )}
          >
            <option value="vendedor">Vendedor</option>
            <option value="gerente">Gerente</option>
            <option value="auxiliar_administrativa">Auxiliar administrativa</option>
          </select>

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
              Salvar alterações
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
