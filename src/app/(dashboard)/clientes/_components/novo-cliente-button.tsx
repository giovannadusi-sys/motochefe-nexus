"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { criarCliente } from "../actions";
import { initialClienteFormState } from "../form-state";

/**
 * Botão "Novo cliente" + modal de cadastro.
 *
 * A submissão chama a Server Action manualmente dentro de uma
 * `startTransition` (em vez de `useActionState` + `useEffect`) para
 * decidir o que fazer com o resultado (fechar modal, resetar form,
 * mostrar toast) de forma imperativa e síncrona à resposta — sem
 * disparar setState dentro de um efeito.
 */
export function NovoClienteButton() {
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
      const result = await criarCliente(initialClienteFormState, formData);

      if (result.success) {
        fechar();
        formRef.current?.reset();
        showToast("Cliente cadastrado com sucesso.", "success");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden="true" />
        Novo cliente
      </Button>

      <Modal open={open} onClose={fechar} title="Novo cliente" maxWidth="max-w-lg">
        <form ref={formRef} action={handleSubmit} className="flex flex-col gap-3">
          <Input name="nome" placeholder="Nome completo *" required />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input name="cpf" placeholder="CPF" />
            <Input name="telefone" placeholder="Telefone" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input name="email" type="email" placeholder="E-mail" />
            <Input name="data_nascimento" type="date" placeholder="Nascimento" />
          </div>

          <Input name="endereco" placeholder="Endereço" />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input name="cep" placeholder="CEP" />
            <Input name="bairro" placeholder="Bairro" />
          </div>

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
              Salvar cliente
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
