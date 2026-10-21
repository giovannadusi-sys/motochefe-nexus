"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { criarArtigo, atualizarArtigo } from "../actions";
import { initialArtigoFormState } from "../form-state";
import type { CategoriaConhecimento } from "@/types/database";

const CATEGORIA_LABEL: Record<CategoriaConhecimento, string> = {
  produtos: "Produtos",
  especificacoes: "Especificações",
  processos: "Processos",
  garantia: "Garantia",
  treinamentos: "Treinamentos",
};

interface ArtigoInicial {
  id: string;
  categoria: CategoriaConhecimento;
  titulo: string;
  conteudo: string;
  link_externo?: string | null;
  arquivo_url?: string | null;
}

interface Props {
  inicial?: ArtigoInicial;
  categoriaSugerida?: CategoriaConhecimento;
  trigger: (abrir: () => void) => React.ReactNode;
}

const selectClassName = cn(
  "h-10 w-full rounded-lg bg-surface px-3 text-sm text-foreground shadow-[var(--shadow-card)] outline-none",
  "transition-shadow duration-[var(--duration-fast)] ease-[var(--ease-out-swift)]",
  "focus-visible:shadow-[0_0_0_1px_var(--primary),0_0_0_4px_rgba(47,95,246,0.15)]"
);

/**
 * Modal único para criar e editar artigos. Editor é um textarea simples
 * com suporte a markdown — sem WYSIWYG pesado. Aceita opcionalmente um
 * PDF (sobe pro Storage do Supabase) e/ou um link externo.
 */
export function ArtigoModal({ inicial, categoriaSugerida, trigger }: Props) {
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
      const action = modoEdicao ? atualizarArtigo : criarArtigo;
      const result = await action(initialArtigoFormState, formData);
      if (result.success) {
        fechar();
        showToast(modoEdicao ? "Artigo atualizado." : "Artigo criado.", "success");
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
        title={modoEdicao ? "Editar artigo" : "Novo artigo"}
        maxWidth="max-w-xl"
      >
        <form ref={formRef} action={handleSubmit} className="flex flex-col gap-3">
          {modoEdicao && <input type="hidden" name="id" value={inicial!.id} />}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select
              name="categoria"
              required
              defaultValue={inicial?.categoria ?? categoriaSugerida ?? "produtos"}
              className={selectClassName}
            >
              {Object.entries(CATEGORIA_LABEL).map(([valor, label]) => (
                <option key={valor} value={valor}>
                  {label}
                </option>
              ))}
            </select>
            <Input name="titulo" placeholder="Título *" defaultValue={inicial?.titulo} required />
          </div>

          <textarea
            name="conteudo"
            required
            rows={8}
            placeholder="Conteúdo (aceita markdown — # títulos, **negrito**, listas...)"
            defaultValue={inicial?.conteudo}
            className={cn(
              "w-full resize-y rounded-lg bg-surface p-3 text-sm text-foreground shadow-[var(--shadow-card)] outline-none",
              "transition-shadow duration-[var(--duration-fast)] ease-[var(--ease-out-swift)]",
              "focus-visible:shadow-[0_0_0_1px_var(--primary),0_0_0_4px_rgba(47,95,246,0.15)]"
            )}
          />

          <div className="rounded-lg bg-muted p-3">
            <p className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Paperclip className="size-3.5" /> Anexos (opcional)
            </p>
            <div className="flex flex-col gap-2">
              <div>
                <input
                  name="arquivo"
                  type="file"
                  accept="application/pdf"
                  className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-surface file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-foreground file:shadow-[var(--shadow-card)]"
                />
                {inicial?.arquivo_url && (
                  <a
                    href={inicial.arquivo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-xs text-primary underline"
                  >
                    Ver PDF atual (enviar um novo substitui)
                  </a>
                )}
              </div>
              <Input
                name="link_externo"
                placeholder="Link externo (ex: vídeo, manual online)"
                defaultValue={inicial?.link_externo ?? ""}
              />
            </div>
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
              {modoEdicao ? "Salvar alterações" : "Publicar"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
